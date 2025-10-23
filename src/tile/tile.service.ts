import { Injectable, Logger } from '@nestjs/common';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { TILE_CONSTANTS } from './constants/tile.constants';
import {
  TileCacheEntry,
  PointCacheEntry,
  TileCoordinates,
} from './interfaces/tile.interface';
import { AddPointDto } from './dto/add-point.dto';

@Injectable()
export class TileService {
  private readonly logger = new Logger(TileService.name);
  private readonly tileCache = new Map<string, TileCacheEntry>();
  private readonly pointCache = new Map<string, PointCacheEntry>();

  // Ngưỡng để rebuild tile (nếu tile có > 1000 points thì skip rebuild mỗi lần)
  private readonly REBUILD_THRESHOLD = 1000;

  // Batch rebuild queue
  private readonly dirtyTiles = new Set<string>();
  private rebuildTimer: NodeJS.Timeout | null = null;

  /**
   * Get a cached tile by coordinates
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @returns Tile buffer or null if not found
   */
  getTile(z: number, x: number, y: number): Uint8Array<ArrayBufferLike> | null {
    const key = this.generateCacheKey(z, x, y);

    // Check if tile is dirty and needs rebuild
    if (this.dirtyTiles.has(key)) {
      this.rebuildTile(z, x, y);
    }

    const cached = this.tileCache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Add a point and generate tiles for all zoom levels
   * @param pointData - Point data containing name, latitude, and longitude
   */
  addPoint(pointData: AddPointDto): void {
    const startTime = performance.now();
    const { lat, lon, name } = pointData;

    this.validateCoordinates(lat, lon);

    const point = this.createGeoJSONPoint(lat, lon, name);

    for (
      let zoom = TILE_CONSTANTS.MIN_ZOOM;
      zoom <= TILE_CONSTANTS.MAX_ZOOM;
      zoom++
    ) {
      const { x, y } = this.latLonToTileCoordinates(lon, lat, zoom);
      this.updateTileCacheOptimized(zoom, x, y, point);
    }

    // Schedule batch rebuild
    this.scheduleBatchRebuild();

    const endTime = performance.now();
    this.logger.log(
      `Point "${name}" added in ${(endTime - startTime).toFixed(2)}ms`,
    );
  }

  /**
   * Get all cached points
   * @returns Array of all GeoJSON features
   */
  getAllPoints(): GeoJSON.Feature[] {
    const allPoints: GeoJSON.Feature[] = [];

    for (const entry of this.pointCache.values()) {
      allPoints.push(...entry.points);
    }

    return allPoints;
  }

  /**
   * Generate a cache key from tile coordinates
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @returns Cache key string
   */
  private generateCacheKey(z: number, x: number, y: number): string {
    return `${z}/${x}/${y}`;
  }

  /**
   * Update tile cache with SMART REBUILD strategy
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param point - GeoJSON point feature
   */
  private updateTileCacheOptimized(
    z: number,
    x: number,
    y: number,
    point: GeoJSON.Feature,
  ): void {
    const cacheKey = this.generateCacheKey(z, x, y);

    // Update point cache
    if (!this.pointCache.has(cacheKey)) {
      this.pointCache.set(cacheKey, { points: [] });
    }
    this.pointCache.get(cacheKey)?.points.push(point);

    const points = this.pointCache.get(cacheKey)?.points || [];
    const pointCount = points.length;

    // SMART REBUILD:
    // - Nếu < 1000 points: rebuild ngay (nhanh)
    // - Nếu >= 1000 points: đánh dấu dirty, rebuild sau (tránh lag)
    if (pointCount < this.REBUILD_THRESHOLD) {
      // Rebuild ngay lập tức
      const tileBuffer = this.generateTileBuffer(z, x, y, points);
      if (tileBuffer) {
        this.tileCache.set(cacheKey, { data: tileBuffer });
        this.logger.debug(
          `Tile rebuilt immediately: ${cacheKey} (${pointCount} points)`,
        );
      }
    } else {
      // Đánh dấu dirty, rebuild sau
      this.dirtyTiles.add(cacheKey);
      this.logger.debug(
        `Tile marked dirty: ${cacheKey} (${pointCount} points)`,
      );
    }
  }

  /**
   * Rebuild a specific tile
   */
  private rebuildTile(z: number, x: number, y: number): void {
    const cacheKey = this.generateCacheKey(z, x, y);
    const points = this.pointCache.get(cacheKey)?.points || [];

    if (points.length === 0) {
      return;
    }

    const startTime = performance.now();
    const tileBuffer = this.generateTileBuffer(z, x, y, points);

    if (tileBuffer) {
      this.tileCache.set(cacheKey, { data: tileBuffer });
      this.dirtyTiles.delete(cacheKey);

      const duration = (performance.now() - startTime).toFixed(2);
      this.logger.debug(
        `Tile rebuilt: ${cacheKey} (${points.length} points in ${duration}ms)`,
      );
    }
  }

  /**
   * Schedule batch rebuild của dirty tiles
   */
  private scheduleBatchRebuild(): void {
    // Clear timer cũ
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
    }

    // Schedule rebuild sau 100ms (debounce)
    this.rebuildTimer = setTimeout(() => {
      this.batchRebuildDirtyTiles();
    }, 100);
  }

  /**
   * Rebuild tất cả dirty tiles trong background
   */
  private batchRebuildDirtyTiles(): void {
    if (this.dirtyTiles.size === 0) {
      return;
    }

    const startTime = performance.now();
    const dirtyCount = this.dirtyTiles.size;
    let rebuilt = 0;

    for (const cacheKey of this.dirtyTiles) {
      const [z, x, y] = cacheKey.split('/').map(Number);
      const points = this.pointCache.get(cacheKey)?.points || [];

      if (points.length > 0) {
        const tileBuffer = this.generateTileBuffer(z, x, y, points);
        if (tileBuffer) {
          this.tileCache.set(cacheKey, { data: tileBuffer });
          rebuilt++;
        }
      }
    }

    this.dirtyTiles.clear();

    const duration = (performance.now() - startTime).toFixed(2);
    this.logger.log(
      `Batch rebuild: ${rebuilt}/${dirtyCount} tiles in ${duration}ms`,
    );
  }

  /**
   * Generate a tile buffer from points
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param points - Array of GeoJSON features
   * @returns Tile buffer or null
   */
  private generateTileBuffer(
    z: number,
    x: number,
    y: number,
    points: GeoJSON.Feature[],
  ): Uint8Array<ArrayBufferLike> | null {
    const featureCollection = this.createFeatureCollection(points);

    // Build tile index
    const tileIndex = geojsonvt(featureCollection as any, {
      maxZoom: TILE_CONSTANTS.MAX_ZOOM,
      tolerance: this.getToleranceForZoom(z),
      extent: 4096,
      buffer: 64,
    });

    const tile = tileIndex.getTile(z, x, y);

    if (!tile || !tile.features || tile.features.length === 0) {
      return null;
    }

    const vectorTile = {
      [TILE_CONSTANTS.LAYER_NAME]: tile,
    };

    return vtpbf.fromGeojsonVt(vectorTile);
  }

  /**
   * Get tolerance based on zoom level
   */
  private getToleranceForZoom(zoom: number): number {
    if (zoom <= 5) return 5;
    if (zoom <= 10) return 3;
    return 1;
  }

  /**
   * Convert lat/lon to tile coordinates
   * @param lon - Longitude
   * @param lat - Latitude
   * @param zoom - Zoom level
   * @returns Tile coordinates
   */
  private latLonToTileCoordinates(
    lon: number,
    lat: number,
    zoom: number,
  ): TileCoordinates {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        Math.pow(2, zoom),
    );

    return { x, y, z: zoom };
  }

  /**
   * Create a GeoJSON point feature
   * @param lat - Latitude
   * @param lon - Longitude
   * @param name - Point name
   * @returns GeoJSON feature
   */
  private createGeoJSONPoint(
    lat: number,
    lon: number,
    name: string,
  ): GeoJSON.Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        name,
      },
    };
  }

  /**
   * Create a GeoJSON feature collection
   * @param features - Array of GeoJSON features
   * @returns GeoJSON feature collection
   */
  private createFeatureCollection(
    features: GeoJSON.Feature[],
  ): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Validate coordinates
   * @param lat - Latitude
   * @param lon - Longitude
   * @throws Error if coordinates are invalid
   */
  private validateCoordinates(lat: number, lon: number): void {
    if (lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }
    if (lon < -180 || lon > 180) {
      throw new Error(
        `Invalid longitude: ${lon}. Must be between -180 and 180.`,
      );
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalTiles: this.tileCache.size,
      totalPointCaches: this.pointCache.size,
      dirtyTiles: this.dirtyTiles.size,
      totalPoints: this.getAllPoints().length,
    };
  }

  /**
   * Force rebuild all dirty tiles (for manual trigger)
   */
  forceRebuildAll(): void {
    this.logger.log('Force rebuilding all dirty tiles...');
    this.batchRebuildDirtyTiles();
  }
}

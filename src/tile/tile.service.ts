import { Injectable } from '@nestjs/common';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

interface TileCacheEntry {
  data: Uint8Array<ArrayBufferLike>;
}

@Injectable()
export class TileService {
  private cacheTile = new Map<string, TileCacheEntry>();
  private cachePoint = new Map<string, GeoJSON.GeoJSON[]>();

  private key(z: number, x: number, y: number) {
    return `${z}/${x}/${y}`;
  }

  getTiles(z: number, x: number, y: number) {
    const key = this.key(z, x, y);
    const cached = this.cacheTile.get(key);
    return cached ? cached.data : null;
  }

  addPoint(lat: number, lon: number, name: string) {
    console.time('start');
    const point = this.normalizeGeoJson(lat, lon, name);
    for (let z = 6; z <= 14; z++) {
      const { x, y } = this.lonLatToTile(lon, lat, z);
      this.buildCacheTile(z, x, y, point);
    }
    console.timeEnd('start');
  }

  getAllPoints() {
    return Array.from(this.cachePoint.values()).flat();
  }

  private buildCacheTile(
    z: number,
    x: number,
    y: number,
    point: GeoJSON.GeoJSON,
  ) {
    console.log(`Building tile for ${z}/${x}/${y}`);
    const keyPoint = this.key(z, x, y);
    if (!this.cachePoint.has(keyPoint)) {
      this.cachePoint.set(keyPoint, []);
    }
    this.cachePoint.get(keyPoint)?.push(point);

    const data = this.cachePoint.get(keyPoint);
    const geojsonData = this.buildFeatureCollection(data || []);

    // build tile index
    const tileIndex = geojsonvt(geojsonData as any, {
      maxZoom: 14,
    });

    const tile = tileIndex.getTile(z, x, y);
    if (!tile) {
      return null;
    }

    if (tile && tile.features && tile.features.length > 0) {
      const vectorTile = {
        myLayer: tile,
      };
      const buffer = vtpbf.fromGeojsonVt(vectorTile);
      const key = this.key(z, x, y);
      this.cacheTile.set(key, { data: buffer });
    }
  }

  private lonLatToTile(lon: number, lat: number, zoom: number) {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );
    return { x, y };
  }

  private normalizeGeoJson(lat: number, lon: number, name: string) {
    const point: GeoJSON.Feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        name,
      },
    };
    return point;
  }

  private buildFeatureCollection(points: GeoJSON.GeoJSON[]) {
    return {
      type: 'FeatureCollection',
      features: points,
    };
  }
}

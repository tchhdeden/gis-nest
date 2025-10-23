import { TileCoordinates } from '../interfaces/tile.interface';

/**
 * Utility functions for tile calculations
 */
export class TileUtils {
  /**
   * Convert tile coordinates to lat/lon bounds
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param z - Zoom level
   * @returns Bounding box [west, south, east, north]
   */
  static tileToBBox(
    x: number,
    y: number,
    z: number,
  ): [number, number, number, number] {
    const n = Math.pow(2, z);
    const west = (x / n) * 360 - 180;
    const east = ((x + 1) / n) * 360 - 180;
    const north = this.tileToLat(y, z);
    const south = this.tileToLat(y + 1, z);

    return [west, south, east, north];
  }

  /**
   * Convert tile Y coordinate to latitude
   * @param y - Tile Y coordinate
   * @param z - Zoom level
   * @returns Latitude
   */
  private static tileToLat(y: number, z: number): number {
    const n = Math.pow(2, z);
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    return (latRad * 180) / Math.PI;
  }

  /**
   * Check if coordinates are within valid ranges
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns True if valid
   */
  static isValidCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Get all tile coordinates within a bounding box
   * @param bbox - Bounding box [west, south, east, north]
   * @param zoom - Zoom level
   * @returns Array of tile coordinates
   */
  static getTilesInBBox(
    bbox: [number, number, number, number],
    zoom: number,
  ): TileCoordinates[] {
    const [west, south, east, north] = bbox;
    const tiles: TileCoordinates[] = [];

    const minX = Math.floor(((west + 180) / 360) * Math.pow(2, zoom));
    const maxX = Math.floor(((east + 180) / 360) * Math.pow(2, zoom));

    const minY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((north * Math.PI) / 180) +
            1 / Math.cos((north * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );
    const maxY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((south * Math.PI) / 180) +
            1 / Math.cos((south * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }
}

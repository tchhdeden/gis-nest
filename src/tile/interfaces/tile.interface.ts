export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface TileCacheEntry {
  data: Uint8Array<ArrayBufferLike>;
}

export interface PointCacheEntry {
  points: GeoJSON.Feature[];
}

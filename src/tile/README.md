# Tile Module

This module handles vector tile generation and caching for map rendering using Protocol Buffers (Mapbox Vector Tiles format).

## Features

- **Vector Tile Generation**: Converts GeoJSON points to Mapbox Vector Tiles (MVT/PBF format)
- **Multi-Zoom Caching**: Automatically generates and caches tiles for zoom levels 6-14
- **Efficient Caching**: In-memory caching of both points and generated tiles
- **RESTful API**: Simple endpoints for adding points and retrieving tiles

## Architecture

### Files Structure

```
tile/
├── constants/
│   └── tile.constants.ts      # Configuration constants
├── dto/
│   └── add-point.dto.ts       # Data transfer objects
├── interfaces/
│   └── tile.interface.ts      # TypeScript interfaces
├── utils/
│   └── tile.utils.ts          # Utility functions for tile calculations
├── tile.controller.ts         # HTTP endpoints
├── tile.service.ts            # Business logic
└── tile.module.ts             # Module definition
```

### Key Components

#### TileService

- **Caching Strategy**: Two-level cache (points + tiles)
- **Tile Generation**: Uses `geojson-vt` for tile indexing and `vt-pbf` for encoding
- **Coordinate Conversion**: Web Mercator projection for lat/lon to tile coordinates

#### TileController

- `GET /tile/tiles/:z/:x/:y.pbf` - Retrieve a vector tile
- `POST /tile` - Add a new point
- `GET /tile` - Get all cached points

## API Usage

### Add a Point

```bash
curl -X POST http://localhost:3000/tile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Location",
    "lat": 40.7128,
    "lon": -74.0060
  }'
```

### Retrieve a Tile

```bash
curl http://localhost:3000/tile/tiles/10/301/384.pbf > tile.pbf
```

### Get All Points

```bash
curl http://localhost:3000/tile
```

## Configuration

Constants are defined in `tile.constants.ts`:

- `MIN_ZOOM`: 6
- `MAX_ZOOM`: 14
- `LAYER_NAME`: 'myLayer'

## Dependencies

- `geojson-vt`: Convert GeoJSON to vector tiles
- `vt-pbf`: Serialize vector tiles to Protocol Buffer format

## Performance

- Points are cached per tile coordinate
- Tiles are pre-generated for all zoom levels on point addition
- Performance metrics logged for each point addition

## Future Enhancements

- [ ] Persistent storage (database integration)
- [ ] Tile expiration/invalidation
- [ ] Support for other geometry types (lines, polygons)
- [ ] Configurable zoom levels
- [ ] Spatial indexing for better performance

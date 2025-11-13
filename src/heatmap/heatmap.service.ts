import { Injectable } from '@nestjs/common';
import { CreateHeatmapDto } from './dto/create-heatmap.dto';
import { UpdateHeatmapDto } from './dto/update-heatmap.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HeatmapService {
  constructor(private prismaService: PrismaService) {}

  async create(createHeatmapDto: CreateHeatmapDto) {
    await this.prismaService.$executeRaw`
      INSERT INTO "locations" ("id", "name", "geom","createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        ${createHeatmapDto.name}, 
        ST_SetSRID(ST_MakePoint(${createHeatmapDto.lon}, ${createHeatmapDto.lat}), 4326),
        NOW(),
        NOW()
      )
  `;
    return { message: 'Heatmap point created successfully' };
  }

  findAll() {
    return `This action returns all heatmap`;
  }

  findOne(id: number) {
    return `This action returns a #${id} heatmap`;
  }

  update(id: number, updateHeatmapDto: UpdateHeatmapDto) {
    console.log(updateHeatmapDto);
    return `This action updates a #${id} heatmap`;
  }

  remove(id: number) {
    return `This action removes a #${id} heatmap`;
  }

  async getTile(z: number, x: number, y: number) {
    try {
      const { minLon, minLat, maxLon, maxLat } = tileToBBox(z, x, y);
      const sql = `
          SELECT ST_AsMVT(tile, 'heatmap', 4096, 'geom') AS mvt
          FROM (
            SELECT
              id,
              name,
              ST_AsMVTGeom(
                ST_Transform(geom, 3857),
                ST_Transform(ST_MakeEnvelope($1, $2, $3, $4, 4326), 3857),
                4096, 256, true
              ) AS geom
            FROM locations
            WHERE ST_Intersects(
              ST_Transform(geom, 3857),
              ST_Transform(ST_MakeEnvelope($1, $2, $3, $4, 4326), 3857)
            )
          ) AS tile;
    `;
      const result: any = await this.prismaService.$queryRawUnsafe(
        sql,
        minLon,
        minLat,
        maxLon,
        maxLat,
      );
      // Note: prisma returns rows; result[0].mvt is a Buffer or Uint8Array depending on driver

      return result[0].mvt;
    } catch (err) {
      console.error('Error generating vector tile:', err);
      return null;
    }
  }

  async getHeatmapTile(z: number, x: number, y: number) {
    const gridSize = z < 10 ? 1000 : z < 14 ? 500 : 50;

    const sql = `
    WITH
    bounds AS (
      SELECT ST_TileEnvelope(${z}::int, ${x}::int, ${y}::int) AS geom_3857
    ),
    points AS (
      SELECT ST_Transform(l.geom, 3857) AS geom
      FROM locations l
      WHERE ST_Intersects(
        ST_Transform(l.geom, 3857),
        (SELECT geom_3857 FROM bounds)
      )
    ),
    grid AS (
      SELECT
        ST_SnapToGrid(geom, ${gridSize}::int) AS cell_geom,
        COUNT(*) AS count
      FROM points
      GROUP BY ST_SnapToGrid(geom, ${gridSize}::int)
    )
    SELECT ST_AsMVT(tile, 'heatmap', 4096, 'geom') AS mvt
    FROM (
      SELECT
        ST_AsMVTGeom(
          g.cell_geom,
          (SELECT geom_3857 FROM bounds),
          4096, 256, true
        ) AS geom,
        g.count
      FROM grid g
      WHERE g.count > 0
    ) AS tile;
  `;
    const result = await this.prismaService.$queryRawUnsafe(sql);
    const mvtBuffer = result?.[0]?.mvt || null;
    return mvtBuffer;
  }

  async getClusteredTile(z: number, x: number, y: number) {
    if (z > 13) {
      return this.getTile(z, x, y);
    }

    const sql = `
    WITH
    bounds AS (
      SELECT ST_TileEnvelope(${z}::int, ${x}::int, ${y}::int) AS geom_3857
    ),
    points AS (
      SELECT ST_Transform(l.geom, 3857) AS geom
      FROM locations l
      WHERE ST_Intersects(
        ST_Transform(l.geom, 3857),
        (SELECT geom_3857 FROM bounds)
      )
    ),
    clusters AS (
      SELECT
        ST_ClusterDBSCAN(geom, eps := 100, minpoints := 2) OVER () AS cluster_id,
        geom
      FROM points
    )
    SELECT ST_AsMVT(tile, 'heatmap', 4096, 'geom') AS mvt
    FROM (
      SELECT
        ST_AsMVTGeom(
          ST_Centroid(ST_Collect(c.geom)),
          (SELECT geom_3857 FROM bounds),
          4096, 256, true
        ) AS geom,
        COUNT(*) AS point_count
      FROM clusters c
      GROUP BY c.cluster_id
      HAVING COUNT(*) > 1
    ) AS tile;
  `;
    const result = await this.prismaService.$queryRawUnsafe(sql);
    const mvtBuffer = result?.[0]?.mvt || null;
    return mvtBuffer;
  }
}

function tile2lon(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function tileToBBox(z, x, y) {
  const minLon = tile2lon(x, z);
  const maxLon = tile2lon(x + 1, z);
  const minLat = tile2lat(y + 1, z);
  const maxLat = tile2lat(y, z);
  return { minLon, minLat, maxLon, maxLat };
}

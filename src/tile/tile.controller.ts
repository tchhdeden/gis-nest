import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { TileService } from './tile.service';
import { type Response } from 'express';

class AddPointDto {
  name: string;
  lat: number;
  lon: number;
}

@Controller('tile')
export class TileController {
  constructor(private readonly tileService: TileService) {}

  @Get('tiles/:z/:x/:y.pbf')
  getTiles(
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: Response,
  ) {
    const zoom = parseInt(z, 10);
    const xTile = parseInt(x, 10);
    const yTile = parseInt(y, 10);

    const tile = this.tileService.getTiles(zoom, xTile, yTile);

    if (!tile) {
      return null;
    }

    res.set({
      'Content-Type': 'application/x-protobuf',
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(tile);
  }

  @Post()
  addPoint(@Body() data: AddPointDto) {
    const { lat, lon, name } = data;
    this.tileService.addPoint(lat, lon, name);
  }

  @Get()
  getAll() {
    return this.tileService.getAllPoints();
  }
}

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import { TileService } from './tile.service';
import { type Response } from 'express';
import { AddPointDto } from './dto/add-point.dto';
import { TILE_CONSTANTS } from './constants/tile.constants';

@Controller('tile')
export class TileController {
  constructor(private readonly tileService: TileService) {}

  /**
   * Get vector tile in Protocol Buffer format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param res - Express response object
   */
  @Get('tiles/:z/:x/:y.pbf')
  getTiles(
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y', ParseIntPipe) y: number,
    @Res() res: Response,
  ) {
    const tile = this.tileService.getTile(z, x, y);

    if (!tile) {
      throw new NotFoundException(
        `Tile not found for coordinates z=${z}, x=${x}, y=${y}`,
      );
    }

    this.setTileHeaders(res);
    res.send(tile);
  }

  /**
   * Add a new point to the tile cache
   * @param data - Point data containing name, latitude, and longitude
   */
  @Post()
  addPoint(@Body() data: AddPointDto) {
    this.tileService.addPoint(data);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Point added successfully',
    };
  }

  /**
   * Get all cached points
   * @returns Array of all GeoJSON points
   */
  @Get()
  getAllPoints() {
    return this.tileService.getAllPoints();
  }

  /**
   * Set appropriate headers for tile response
   * @param res - Express response object
   */
  private setTileHeaders(res: Response): void {
    res.set({
      'Content-Type': TILE_CONSTANTS.CONTENT_TYPE,
      'Cache-Control': TILE_CONSTANTS.CACHE_CONTROL,
      Pragma: 'no-cache',
      Expires: '0',
    });
  }
}

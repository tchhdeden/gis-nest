import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { HeatmapService } from './heatmap.service';
import { CreateHeatmapDto } from './dto/create-heatmap.dto';
import { UpdateHeatmapDto } from './dto/update-heatmap.dto';
import { type Response } from 'express';
import { gzipSync } from 'zlib';
@Controller('heatmap')
export class HeatmapController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Post()
  create(@Body() createHeatmapDto: CreateHeatmapDto) {
    return this.heatmapService.create(createHeatmapDto);
  }

  @Get()
  findAll() {
    return this.heatmapService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heatmapService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHeatmapDto: UpdateHeatmapDto) {
    return this.heatmapService.update(+id, updateHeatmapDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.heatmapService.remove(+id);
  }

  @Get('tile/:z/:x/:y')
  async getHeatmapTile(
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: Response,
  ) {
    try {
      // Parse and validate parameters
      const zNum = parseInt(z, 10);
      const xNum = parseInt(x, 10);
      const yNum = parseInt(y, 10);

      if (isNaN(zNum) || isNaN(xNum) || isNaN(yNum)) {
        return res.status(400).json({
          error: 'Invalid tile parameters',
          message: `z, x, y must be valid integers. Received: z=${z}, x=${x}, y=${y}`,
        });
      }

      const tileBuffer = await this.heatmapService.getClusteredTile(
        zNum,
        xNum,
        yNum,
      );

      if (!tileBuffer) {
        return res.status(404).json({
          error: 'Tile not found',
          message: 'No data available for this tile',
        });
      }

      res.setHeader('Content-Type', 'application/x-protobuf');
      res.setHeader('Content-Encoding', 'gzip');
      res.send(gzipSync(tileBuffer));
    } catch (error) {
      console.error('Error in getHeatmapTile controller:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

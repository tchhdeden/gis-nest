import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HeatmapService } from './heatmap.service';
import { CreateHeatmapDto } from './dto/create-heatmap.dto';
import { UpdateHeatmapDto } from './dto/update-heatmap.dto';

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
}

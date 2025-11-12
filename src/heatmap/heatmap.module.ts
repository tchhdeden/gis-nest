import { Module } from '@nestjs/common';
import { HeatmapService } from './heatmap.service';
import { HeatmapController } from './heatmap.controller';

@Module({
  controllers: [HeatmapController],
  providers: [HeatmapService],
})
export class HeatmapModule {}

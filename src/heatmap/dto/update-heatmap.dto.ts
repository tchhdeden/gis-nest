import { PartialType } from '@nestjs/mapped-types';
import { CreateHeatmapDto } from './create-heatmap.dto';

export class UpdateHeatmapDto extends PartialType(CreateHeatmapDto) {}

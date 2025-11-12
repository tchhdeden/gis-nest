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
}

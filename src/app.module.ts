import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthenModule } from './authen/authen.module';
import { TileModule } from './tile/tile.module';
import { HeatmapModule } from './heatmap/heatmap.module';

@Module({
  imports: [
    PrismaModule,
    CategoryModule,
    AuthenModule,
    TileModule,
    HeatmapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

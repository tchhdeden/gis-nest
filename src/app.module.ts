import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthenModule } from './authen/authen.module';
import { TileModule } from './tile/tile.module';

@Module({
  imports: [PrismaModule, CategoryModule, AuthenModule, TileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

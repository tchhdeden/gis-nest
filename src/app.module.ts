import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthenModule } from './authen/authen.module';

@Module({
  imports: [PrismaModule, CategoryModule, AuthenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

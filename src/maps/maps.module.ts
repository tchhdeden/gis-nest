import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsGateway } from './maps.gateway';

@Module({
  providers: [MapsGateway, MapsService],
})
export class MapsModule {}

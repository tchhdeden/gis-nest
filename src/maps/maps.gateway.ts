import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/create-map.dto';
import { UpdateMapDto } from './dto/update-map.dto';

@WebSocketGateway()
export class MapsGateway {
  constructor(private readonly mapsService: MapsService) {}

  @SubscribeMessage('createMap')
  create(@MessageBody() createMapDto: CreateMapDto) {
    return this.mapsService.create(createMapDto);
  }

  @SubscribeMessage('findAllMaps')
  findAll() {
    return this.mapsService.findAll();
  }

  @SubscribeMessage('findOneMap')
  findOne(@MessageBody() id: number) {
    return this.mapsService.findOne(id);
  }

  @SubscribeMessage('updateMap')
  update(@MessageBody() updateMapDto: UpdateMapDto) {
    return this.mapsService.update(updateMapDto.id, updateMapDto);
  }

  @SubscribeMessage('removeMap')
  remove(@MessageBody() id: number) {
    return this.mapsService.remove(id);
  }
}

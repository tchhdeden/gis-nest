import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getMap() {
    return { message: 'This is the map endpoint' };
  }
}

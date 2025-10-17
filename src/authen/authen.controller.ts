import { Body, Controller, Post } from '@nestjs/common';
import { AuthenService } from './authen.service';
import { type CreateUserDto } from './dto/create-user.dto';

@Controller('authen')
export class AuthenController {
  constructor(private readonly authenService: AuthenService) {}

  @Post('register')
  register(@Body() data: CreateUserDto) {
    return this.authenService.register(data);
  }
}

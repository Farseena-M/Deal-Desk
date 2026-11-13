import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello() {
    return {
      message: 'DealDesk Backend is running successfully!',
      status: 'OK',
    };
  }
}

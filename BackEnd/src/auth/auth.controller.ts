import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { UtilityService } from '../shared/utils/utils.service.js';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly utilityService: UtilityService
  ) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return this.utilityService.createResponse(
      'Success',
      'Login successful',
      result,
    );
  } catch(error: Error) {
    const message =
      error instanceof Error ? error.message : 'Login failed';
    return this.utilityService.createResponse(
      'Error',
      message,
    );
  }
}

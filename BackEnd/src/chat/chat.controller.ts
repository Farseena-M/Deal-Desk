import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { UtilityService } from '../shared/utils/utils.service.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';

@Controller('chat')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly utilityService: UtilityService,
  ) { }

  @Get('deal/:dealId')
  async getThread(
    @Param('dealId') dealId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.chatService.getOrCreateThread(
        dealId,
        user,
      );

      return this.utilityService.createResponse(
        'Success',
        'Chat thread fetched successfully',
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch chat thread';
      return this.utilityService.createResponse(
        'Error',
        message,
      );
    }
  }




  @Post('message')
  @Permissions('chat.send')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    try {
      const thread = await this.chatService.getOrCreateThread(
        dto.dealId,
        user,
      );

      const result = await this.chatService.sendMessage(
        thread._id.toString(),
        dto.message,
        user,
      );

      return this.utilityService.createResponse(
        'Success',
        'Message sent successfully',
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';

      return this.utilityService.createResponse('Error', message);
    }
  }



  @Get(':threadId/messages')
  async getMessages(
    @Param('threadId') threadId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.chatService.getMessages(
        threadId,
        user,
      );

      return this.utilityService.createResponse(
        'Success',
        'Chat messages fetched successfully',
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch chat messages';
      return this.utilityService.createResponse(
        'Error',
        message,
      );
    }
  }



  @Post(':threadId/read')
  async markAsRead(
    @Param('threadId') threadId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.chatService.markAsRead(
        threadId,
        user,
      );

      return this.utilityService.createResponse(
        'Success',
        'Messages marked as read successfully',
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to mark messages as read';
      return this.utilityService.createResponse(
        'Error',
        message,
      );
    }
  }


  @Get('my-threads')
  @UseGuards(JwtAuthGuard)
  async getMyThreads(@CurrentUser() user: any) {
    try {
      const result = await this.chatService.getMyThreads(user);

      return this.utilityService.createResponse(
        'Success',
        'Chat threads fetched successfully',
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch chat threads';
      return this.utilityService.createResponse(
        'Error',
        message,
      );
    }
  }
}
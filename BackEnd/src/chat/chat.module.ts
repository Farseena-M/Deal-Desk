import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatThread,
  ChatThreadSchema,
} from './schemas/chat-thread.schema.js';
import {
  ChatMessage,
  ChatMessageSchema,
} from './schemas/chat-message.schema.js';
import {
  Deal,
  DealSchema,
} from '../deals/schemas/deal.schema.js';
import {
  User,
  UserSchema,
} from '../users/schemas/user.schema.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { UsersModule } from '../users/users.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { Role, RoleSchema } from '../roles/schemas/role.schema.js';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatThread.name, schema: ChatThreadSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Deal.name, schema: DealSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    UsersModule,
    SharedModule
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule { }
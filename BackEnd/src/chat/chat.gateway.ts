
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ChatService } from './chat.service.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,

        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    // 1. Authenticate during the Socket.IO handshake
    afterInit(server: Server) {
        server.use(async (client: Socket, next) => {
            try {
                const authToken = client.handshake.auth?.token;

                const header = client.handshake.headers.authorization;

                const token =
                    typeof authToken === 'string'
                        ? authToken.replace(/^Bearer\s+/i, '')
                        : typeof header === 'string'
                            ? header.replace(/^Bearer\s+/i, '')
                            : '';

                if (!token) {
                    return next(new Error('Unauthorized: Token missing'));
                }

                const payload = await this.jwtService.verifyAsync<{
                    sub: string;
                }>(token);

                const user = await this.userModel
                    .findById(payload.sub)
                    .populate('roleId')
                    .lean();

                if (!user || !user.isActive || !user.roleId) {
                    return next(new Error('Unauthorized: Invalid user'));
                }

                // Store authenticated user on socket
                client.data.user = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    branchId: user.branchId?.toString(),
                    role: user.roleId,
                };

                next();

            } catch {
                next(new Error('Unauthorized: Invalid token'));
            }
        });
    }

    // 2. Handle authenticated connection
    async handleConnection(client: Socket) {
        const user = client.data.user;

        if (!user) {
            client.disconnect(true);
            return;
        }

        // Personal room for system notifications
        await client.join(`user:${user.id}`);

        console.log(`Chat connected: ${user.email}`);
    }

    // 3. Join a deal chat room
    @SubscribeMessage('joinDealChat')
    async joinDealChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { dealId: string },
    ) {
        try {
            console.log('1. joinDealChat event received');
            console.log('2. Deal ID:', data.dealId);
            console.log('3. User:', client.data.user?.email);

            const thread = await this.chatService.getOrCreateThread(
                data.dealId,
                client.data.user,
            );

            console.log('4. Thread created/fetched:', thread._id);

            await client.join(thread._id.toString());

            console.log('5. User joined room:', thread._id.toString());

            client.emit('chat.joined', {
                threadId: thread._id.toString(),
                dealId: data.dealId,
            });

        } catch (error: unknown) {
            console.error('JOIN CHAT ERROR:', error);

            client.emit('chat.error', {
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to join chat',
            });
        }
    }

    // 4. Send and broadcast message
    @SubscribeMessage('sendMessage')
    async sendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            threadId: string;
            message: string;
        },
    ) {
        try {
            const user = client.data.user;

            if (!client.rooms.has(data.threadId)) {
                throw new Error('Join the chat before sending messages');
            }

            // ChatService must verify thread participation
            const message = await this.chatService.sendMessage(
                data.threadId,
                data.message,
                user,
            );

            // Send only to sockets in this thread room
            this.server.to(data.threadId).emit('newMessage', message);

        } catch (error) {
            client.emit('chat.error', {
                message: error instanceof Error
                    ? error.message
                    : 'Unable to send message',
            });
        }
    }

    // 5. Mark messages as read
    @SubscribeMessage('markRead')
    async markRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { threadId: string },
    ) {
        try {
            const result = await this.chatService.markAsRead(
                data.threadId,
                client.data.user,
            );

            client.emit('messages.read', result);

        } catch (error) {
            client.emit('chat.error', {
                message: error instanceof Error
                    ? error.message
                    : 'Unable to mark messages as read',
            });
        }
    }

    // 6. Send system notifications to a specific user
    notifyUser(userId: string, event: string, payload: any) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }

    // 7. Send notifications to everyone in a chat thread
    notifyThread(threadId: string, event: string, payload: any) {
        this.server.to(threadId).emit(event, payload);
    }

    // 8. Handle disconnect
    handleDisconnect(client: Socket) {
        console.log('Chat disconnected:', client.id);
    }
}

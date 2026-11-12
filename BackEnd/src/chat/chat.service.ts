import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    InternalServerErrorException,
    HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    ChatThread,
    ChatThreadDocument,
} from './schemas/chat-thread.schema.js';
import {
    ChatMessage,
    ChatMessageDocument,
} from './schemas/chat-message.schema.js';
import {
    Deal,
    DealDocument,
} from '../deals/schemas/deal.schema.js';
import {
    User,
    UserDocument,
} from '../users/schemas/user.schema.js';
import {
    Role,
    RoleDocument,
} from '../roles/schemas/role.schema.js';




@Injectable()
export class ChatService {
    constructor(
        @InjectModel(ChatThread.name)
        private readonly threadModel: Model<ChatThreadDocument>,
        @InjectModel(ChatMessage.name)
        private readonly messageModel: Model<ChatMessageDocument>,
        @InjectModel(Deal.name)
        private readonly dealModel: Model<DealDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,
    ) { }

    async getOrCreateThread(dealId: string, user: any) {
        try {
            if (!Types.ObjectId.isValid(dealId)) {
                throw new BadRequestException('Invalid deal ID');
            }

            const role = user.role;

            const dealObjectId = new Types.ObjectId(dealId);

            const dealFilter: any = {
                _id: dealObjectId,
            };

            if (role.dataScope === 'own') {
                dealFilter.ownerId = new Types.ObjectId(user.id);
            } else if (role.dataScope === 'branch') {
                dealFilter.branchId = new Types.ObjectId(user.branchId);
            }

            const deal = await this.dealModel.findOne(dealFilter);

            if (!deal) {
                throw new NotFoundException('Deal not found');
            }

            let thread = await this.threadModel.findOne({
                dealId: dealObjectId,
            });

            if (!thread) {
                const participants: string[] = [
                    deal.ownerId.toString(),
                ];

                const managerRole = await this.roleModel.findOne({
                    isManager: true,
                    isActive: true,
                });

                if (managerRole) {
                    const manager = await this.userModel.findOne({
                        branchId: deal.branchId,
                        roleId: managerRole._id,
                        isActive: true,
                    });

                    if (manager) {
                        participants.push(manager._id.toString());
                    }
                }

                thread = await this.threadModel.create({
                    dealId: dealObjectId,
                    participants: [
                        ...new Set(participants),
                    ].map((id) => new Types.ObjectId(id)),
                    unreadCounts: {},
                });
            }

            if (
                !thread.participants.some(
                    (id) => id.toString() === user.id.toString(),
                )
            ) {
                thread.participants.push(
                    new Types.ObjectId(user.id),
                );

                await thread.save();
            }

            return thread;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Get or create thread error:', error);

            throw new InternalServerErrorException(
                'Failed to fetch chat thread',
            );
        }
    }




    async sendMessage(
        threadId: string,
        message: string,
        user: any,
    ) {
        try {
            if (!Types.ObjectId.isValid(threadId)) {
                throw new BadRequestException('Invalid thread ID');
            }

            if (!message?.trim()) {
                throw new BadRequestException(
                    'Message cannot be empty',
                );
            }

            const threadObjectId = new Types.ObjectId(threadId);
            const userId = new Types.ObjectId(user.id);

            const thread = await this.threadModel.findOne({
                _id: threadObjectId,
                participants: userId,
            });

            if (!thread) {
                throw new ForbiddenException(
                    'You are not a participant in this chat',
                );
            }

            const newMessage = await this.messageModel.create({
                threadId: threadObjectId,
                senderId: userId,
                message: message.trim(),
                readBy: [userId],
            });

            // Increment unread count for other participants
            for (const participantId of thread.participants) {
                if (participantId.toString() !== userId.toString()) {
                    await this.threadModel.updateOne(
                        { _id: threadObjectId },
                        {
                            $inc: {
                                [`unreadCounts.${participantId.toString()}`]: 1,
                            },
                        },
                    );
                }
            }

            return newMessage;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Send message error:', error);

            throw new InternalServerErrorException(
                'Failed to send chat message',
            );
        }
    }






    async getMessages(threadId: string, user: any) {
        try {
            if (!Types.ObjectId.isValid(threadId)) {
                throw new BadRequestException('Invalid thread ID');
            }

            const threadObjectId = new Types.ObjectId(threadId);
            const userId = new Types.ObjectId(user.id);

            const thread = await this.threadModel.findOne({
                _id: threadObjectId,
                participants: userId,
            });

            if (!thread) {
                throw new ForbiddenException(
                    'You cannot access these chat messages',
                );
            }

            return await this.messageModel
                .find({
                    threadId: threadObjectId,
                })
                .populate('senderId', 'name email')
                .sort({ createdAt: 1 });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Get messages error:', error);

            throw new InternalServerErrorException(
                'Failed to fetch chat messages',
            );
        }
    }





    async markAsRead(threadId: string, user: any) {
        try {
            if (!Types.ObjectId.isValid(threadId)) {
                throw new BadRequestException('Invalid thread ID');
            }

            const threadObjectId = new Types.ObjectId(threadId);
            const userId = new Types.ObjectId(user.id);

            const thread = await this.threadModel.findOne({
                _id: threadObjectId,
                participants: userId,
            });

            if (!thread) {
                throw new ForbiddenException(
                    'You cannot access this chat',
                );
            }

            const updateResult = await this.messageModel.updateMany(
                {
                    threadId: threadObjectId,
                    senderId: { $ne: userId },
                    readBy: { $ne: userId },
                },
                {
                    $addToSet: {
                        readBy: userId,
                    },
                },
            );

            // Reset current user's unread count
            await this.threadModel.updateOne(
                {
                    _id: threadObjectId,
                },
                {
                    $set: {
                        [`unreadCounts.${user.id}`]: 0,
                    },
                },
            );

            // Fetch updated thread
            const updatedThread = await this.threadModel
                .findById(threadObjectId)
                .lean();

            const unreadCounts =
                updatedThread?.unreadCounts as unknown as
                Record<string, number>;

            const unreadCount =
                unreadCounts?.[user.id] ?? 0;

            return {
                threadId: threadObjectId,
                unreadCount,
                messagesUpdated: updateResult.modifiedCount,
                message: 'Messages marked as read successfully',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Mark as read error:', error);

            throw new InternalServerErrorException(
                'Failed to mark messages as read',
            );
        }
    }






    // GET LOGGED-IN USER'S CHAT THREADS
    async getMyThreads(user: any) {
        try {
            const userId = new Types.ObjectId(user.id);

            const threads = await this.threadModel
                .find({
                    participants: userId,
                })
                .populate('dealId', 'title')
                .sort({ updatedAt: -1 })
                .lean();

            const result = await Promise.all(
                threads.map(async (thread) => {
                    // Fetch latest message
                    const lastMessage = await this.messageModel
                        .findOne({
                            threadId: new Types.ObjectId(
                                thread._id.toString(),
                            ),
                        })
                        .populate('senderId', 'name')
                        .sort({ createdAt: -1 })
                        .lean();

                    // Get current user's unread count
                    const unreadCounts =
                        thread.unreadCounts as unknown as
                        Record<string, number>;

                    const unreadCount =
                        unreadCounts?.[user.id] ?? 0;

                    return {
                        threadId: thread._id,
                        deal: thread.dealId,
                        lastMessage,
                        unreadCount,
                    };
                }),
            );

            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error('Get my threads error:', error);

            throw new InternalServerErrorException(
                'Failed to fetch chat threads',
            );
        }
    }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema.js';
import {
    Notification,
    NotificationDocument,
} from './schemas/notification.schema.js';
import { ChatGateway } from '../chat/chat.gateway.js';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<User>,
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,
        private readonly chatGateway: ChatGateway,
    ) { }

    async sendInvoiceNotification(
        senderId: string,
        invoiceId: string,
        dealId: string,
    ) {
        const users = await this.userModel.find({
            _id: { $ne: new Types.ObjectId(senderId) },
            isActive: true,
        }).select('_id');

        if (!users.length) {
            return { count: 0 };
        }

        const notifications = await this.notificationModel.insertMany(
            users.map((user) => ({
                userId: user._id,
                title: 'New Invoice Created',
                message: 'A new invoice has been created.',
                type: 'GENERAL',
                invoiceId: new Types.ObjectId(invoiceId),
                dealId: new Types.ObjectId(dealId),
                isRead: false,
            })),
        );

        notifications.forEach((notification) => {
            this.chatGateway.notifyUser(
                notification.userId.toString(),
                'newNotification',
                notification,
            );
        });

        return {
            message: 'Notifications sent successfully',
            count: notifications.length,
        };
    }
}
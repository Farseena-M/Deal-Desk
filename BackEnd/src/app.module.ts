import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { ProductsModule } from './products/products.module.js';
import { DealsModule } from './deals/deals.module.js';
import { ApprovalsModule } from './approvals/approvals.module.js';
import { ChatModule } from './chat/chat.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { IntegrationLogsModule } from './integration-logs/integration-logs.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from './shared/shared.module.js';
import { BullModule } from '@nestjs/bullmq';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>(`MONGO_URI`)
        return {
          uri,
          onConnectionCreate: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB Connected Successfully!');
            });
            connection.on('error', (error) => {
              console.error('❌ MongoDB Connection Error:', error);
            });

            return connection;
          },
        }
      }
    }),
    AuthModule, UsersModule, RolesModule, BranchesModule, CustomersModule, ProductsModule, DealsModule, ApprovalsModule, ChatModule, NotificationsModule, InvoicesModule, WebhooksModule, IntegrationLogsModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { IntegrationLogsService } from './integration-logs.service.js';
import { IntegrationLogsController } from './integration-logs.controller.js';

@Module({
  controllers: [IntegrationLogsController],
  providers: [IntegrationLogsService],
})
export class IntegrationLogsModule {}

import { Controller } from '@nestjs/common';
import { IntegrationLogsService } from './integration-logs.service.js';

@Controller('integration-logs')
export class IntegrationLogsController {
  constructor(private readonly integrationLogsService: IntegrationLogsService) {}
}

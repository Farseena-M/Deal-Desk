import { PartialType } from '@nestjs/mapped-types';
import { CreateApprovalConfigDto } from './create-approval-config.dto.js';

export class UpdateApprovalConfigDto extends PartialType(
  CreateApprovalConfigDto,
) {}
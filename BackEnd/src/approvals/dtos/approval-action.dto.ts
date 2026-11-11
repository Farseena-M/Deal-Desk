import {
    IsIn,
    IsOptional,
    IsString,
} from 'class-validator';

export class ApprovalActionDto {
    @IsIn(['approved', 'rejected'])
    action: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    remarks?: string;
}
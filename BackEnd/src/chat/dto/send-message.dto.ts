import {
    IsMongoId,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class SendMessageDto {
    @IsMongoId()
    dealId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;
}
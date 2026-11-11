import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApprovalHistoryDocument =
  HydratedDocument<ApprovalHistory>;

@Schema({ timestamps: true })
export class ApprovalHistory {
  @Prop({
    type: Types.ObjectId,
    ref: 'Deal',
    required: true,
  })
  dealId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'ApprovalRequest',
    required: true,
  })
  approvalRequestId: Types.ObjectId;

  @Prop({ required: true })
  step: number;

  @Prop({ required: true })
  approverRole: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  approverId: Types.ObjectId;

  @Prop({
    enum: ['approved', 'rejected'],
    required: true,
  })
  action: string;

  @Prop()
  remarks?: string;
}

export const ApprovalHistorySchema =
  SchemaFactory.createForClass(ApprovalHistory);
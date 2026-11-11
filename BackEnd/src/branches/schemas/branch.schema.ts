
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ timestamps: true })
export class Branch {
    @Prop({
        required: true,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    })
    code: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

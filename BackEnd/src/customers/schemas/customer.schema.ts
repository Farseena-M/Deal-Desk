import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true })
export class Customer {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({
        required: true,
        lowercase: true,
        trim: true,
    })
    email: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({ default: 0, min: 0 })
    outstandingBalance: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

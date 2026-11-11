import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    })
    sku: string;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

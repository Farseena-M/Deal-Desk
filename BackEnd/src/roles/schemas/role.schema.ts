
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

export enum DataScope {
    OWN = 'own',
    BRANCH = 'branch',
    ALL = 'all',
}

@Schema({ timestamps: true })
export class Role {
    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    name: string;

    @Prop({
        type: [String],
        default: [],
    })
    permissions: string[];

    @Prop({
        type: String,
        enum: Object.values(DataScope),
        default: DataScope.OWN,
    })
    dataScope: DataScope;

    @Prop({ default: true })
    isActive: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../users/schemas/user.schema.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: { sub: string }) {
        if (!Types.ObjectId.isValid(payload.sub)) {
            throw new UnauthorizedException('Invalid token');
        }

        const user = await this.userModel
            .findById(payload.sub)
            .populate('roleId')
            .lean();

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            branchId: user.branchId.toString(),
            role: user.roleId,
        };
    }
}

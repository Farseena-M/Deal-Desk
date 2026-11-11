import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { LoginDto } from './dto/login.dto.js';


@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userModel
            .findOne({ email: email.toLowerCase() })
            .select('+password')
            .populate('roleId');

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = {
            sub: user._id.toString(),
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            message: 'Login successful',
            accessToken,
            tokenType: 'Bearer',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.roleId,
                branchId: user.branchId,
            },
        };
    }
}

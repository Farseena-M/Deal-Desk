import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions =
            this.reflector.getAllAndOverride<string[]>(
                PERMISSIONS_KEY,
                [
                    context.getHandler(),
                    context.getClass(),
                ],
            );

        // No permission requirement on this route
        if (!requiredPermissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found');
        }

        const userPermissions: string[] =
            user.role.permissions || [];

        const hasPermission = requiredPermissions.every(
            (permission) => userPermissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                'You do not have permission to perform this action',
            );
        }

        return true;
    }
}

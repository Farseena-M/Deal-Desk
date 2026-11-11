
import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
    createResponse(
        status: 'Success' | 'Error',
        message: string,
        data?: any,
        pagination?: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        },
    ) {
        const response: {
            status: 'Success' | 'Error';
            message: string;
            data?: any;
            pagination?: any;
        } = {
            status,
            message,
        };

        if (data !== undefined) {
            response.data = data;
        }

        if (pagination !== undefined) {
            response.pagination = pagination;
        }

        return response;
    }
}

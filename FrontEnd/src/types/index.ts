export interface ApiResponse<T> {
    status?: string;
    message?: string;
    data: T;
    pagination?: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role?: {
        name?: string;
        key?: string;
        permissions?: string[];
        [key: string]: unknown;
    };
    branchId?: string;
}

export interface Deal {
    _id: string;
    title: string;
    amount: number;
    quantity: number;
    discountPercent: number;
    status: string;

    customerId?: {
        _id: string;
        name: string;
        email?: string;
    } | string;

    productId?: {
        _id: string;
        name: string;
        sku?: string;
        price?: number;
    } | string;

    createdAt?: string;
}

export interface Approval {
    _id: string;
    dealId?: Deal | string;
    discountPercent: number;
    status: string;
    approvalChain?: {
        approverRole: string;
        status: string;
    }[];
    createdAt?: string;
}

export interface ChatThread {
    _id: string;
    dealId?: Deal | string;
    updatedAt?: string;
}

export interface ChatMessage {
    _id: string;
    message: string;
    senderId?: {
        _id?: string;
        name?: string;
    } | string;
    createdAt?: string;
}
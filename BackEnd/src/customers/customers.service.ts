import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';
import { Customer } from './schemas/customer.schema.js';

@Injectable()
export class CustomersService {
    constructor(
        @InjectModel(Customer.name)
        private readonly productModel: Model<Customer>,
    ) { }

    async findAll(user: AuthenticatedUser) {

        const customers = await this.productModel.find()
        return {
            count: customers.length,
            data: customers,
        };
    }
}
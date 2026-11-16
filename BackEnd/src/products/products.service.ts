import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';
import { Product } from './schemas/product.schema.js';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name)
        private readonly productModel: Model<Product>,
    ) { }

    async findAll(user: AuthenticatedUser) {

        const products = await this.productModel.find()
        return {
            count: products.length,
            data: products,
        };
    }
}
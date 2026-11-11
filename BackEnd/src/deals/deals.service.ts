import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, QueryFilter } from 'mongoose';
import { Deal, DealDocument, DealStatus } from './schemas/deal.schema.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { AuthenticatedUser } from './interfaces/authenticatedUser.js';


@Injectable()
export class DealsService {
  constructor(
    @InjectModel(Deal.name)
    private readonly dealModel: Model<DealDocument>,
  ) { }

  // Build database-level scope filter
  private getScopeFilter(
    user: AuthenticatedUser,
  ): QueryFilter<DealDocument> {
    switch (user.role.dataScope) {
      case 'own':
        return {
          ownerId: new Types.ObjectId(user.id),
        };

      case 'branch':
        return {
          branchId: new Types.ObjectId(user.branchId),
        };

      case 'all':
        return {};

      default:
        throw new ForbiddenException('Invalid data scope');
    }
  }

  // Create a new deal
  async create(
    dto: CreateDealDto,
    user: AuthenticatedUser,
  ) {
    const deal = await this.dealModel.create({
      title: dto.title,
      customerId: new Types.ObjectId(dto.customerId),
      productId: new Types.ObjectId(dto.productId),
      quantity: dto.quantity,
      amount: dto.amount,
      discountPercent: dto.discountPercent ?? 0,
      ownerId: new Types.ObjectId(user.id),
      branchId: new Types.ObjectId(user.branchId),
      status: DealStatus.OPEN,
    });

    return {
      message: 'Deal created successfully',
      data: deal,
    };
  }

  async findAll(user: AuthenticatedUser) {
    const scopeFilter = this.getScopeFilter(user);

    const deals = await this.dealModel
      .find(scopeFilter)
      .populate('customerId', 'name email')
      .populate('productId', 'name sku price')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    return {
      count: deals.length,
      data: deals,
    };
  }

  // Get a single deal according to user's scope
  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Deal not found');
    }

    const scopeFilter = this.getScopeFilter(user);

    const deal = await this.dealModel
      .findOne({
        _id: new Types.ObjectId(id),
        ...scopeFilter,
      })
      .populate('customerId', 'name email')
      .populate('productId', 'name sku price')
      .populate('ownerId', 'name email');

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }
}

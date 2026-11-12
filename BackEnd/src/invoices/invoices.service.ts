import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import {
    Invoice,
    InvoiceDocument,
} from './schemas/invoice.schema.js';
import {
    Customer,
    CustomerDocument,
} from '../customers/schemas/customer.schema.js';
import { Deal, DealDocument } from '../deals/schemas/deal.schema.js';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { AuthenticatedUser } from '../deals/interfaces/authenticatedUser.js';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';


type BillPortStatus = 'SENT' | 'VIEWED' | 'PAID' | 'FAILED';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectModel(Invoice.name)
        private readonly invoiceModel: Model<InvoiceDocument>,
        @InjectModel(Customer.name)
        private readonly customerModel: Model<CustomerDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        @InjectModel(Deal.name)
        private readonly dealModel: Model<DealDocument>,
        @InjectQueue('invoice')
        private readonly invoiceQueue: Queue
    ) { }


    async updateStatusFromWebhook(
        externalId: string,
        status: BillPortStatus,
    ): Promise<void> {
        const invoice = await this.invoiceModel.findOne({ externalId });

        if (!invoice) {
            throw new NotFoundException(
                `Invoice not found: ${externalId}`,
            );
        }

        console.log('Invoice before webhook:', {
            id: invoice._id.toString(),
            status: invoice.status,
            balanceUpdated: invoice.balanceUpdated,
            amount: invoice.amount,
        });

        if (status !== 'PAID') {
            const result = await this.invoiceModel.updateOne(
                {
                    _id: invoice._id,
                    balanceUpdated: false,
                },
                {
                    $set: {
                        status: status.toLowerCase(),
                    },
                },
            );

            console.log('Invoice status update result:', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            });

            return;
        }

        // PAID: update invoice and customer balance together.
        const session = await this.connection.startSession();

        try {
            await session.withTransaction(async () => {
                const updatedInvoice =
                    await this.invoiceModel.findOneAndUpdate(
                        {
                            _id: invoice._id,
                            balanceUpdated: false,
                        },
                        {
                            $set: {
                                status: 'paid',
                                balanceUpdated: true,
                            },
                        },
                        {
                            returnDocument: 'after',
                            session,
                        },
                    );

                if (!updatedInvoice) {
                    console.log('Invoice already paid:', externalId);
                    return;
                }

                const customerResult = await this.customerModel.updateOne(
                    {
                        _id: updatedInvoice.customerId,
                    },
                    {
                        $inc: {
                            outstandingBalance: -updatedInvoice.amount,
                        },
                    },
                    { session },
                );

                if (customerResult.matchedCount === 0) {
                    throw new NotFoundException('Customer not found');
                }

                console.log('Customer balance updated:', {
                    customerId: updatedInvoice.customerId.toString(),
                    amountDeducted: updatedInvoice.amount,
                });
            });
        } finally {
            await session.endSession();
        }
    }


    async createLocalInvoice(
        dealId: string,
        user: AuthenticatedUser,
    ) {
        if (!Types.ObjectId.isValid(dealId)) {
            throw new NotFoundException('Deal not found');
        }

        const scopeFilter: any = {};

        if (user.role.dataScope === 'own') {
            scopeFilter.ownerId = new Types.ObjectId(user.id);
        } else if (user.role.dataScope === 'branch') {
            scopeFilter.branchId = new Types.ObjectId(user.branchId);
        } else if (user.role.dataScope !== 'all') {
            throw new ForbiddenException('Invalid data scope');
        }

        const deal = await this.dealModel.findOne({
            _id: new Types.ObjectId(dealId),
            ...scopeFilter,
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        // Return existing invoice if this deal was already converted.
        const existingInvoice = await this.invoiceModel.findOne({
            dealId: deal._id,
        });

        if (existingInvoice) {
            return existingInvoice;
        }

        const invoice = await this.invoiceModel.create({
            dealId: deal._id,
            customerId: deal.customerId,
            amount: deal.amount,
            idempotencyKey: `deal-${deal._id.toString()}`,
            status: 'pending',
            balanceUpdated: false,
        });

        await this.invoiceQueue.add(
            'send-to-billport',
            {
                invoiceId: invoice._id.toString(),
            },
            {
                jobId: invoice._id.toString(),
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        return invoice;
    }
}

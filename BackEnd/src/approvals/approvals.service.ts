import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    ApprovalConfig,
    ApprovalConfigDocument,
} from './schemas/approval-config.schema.js';
import {
    ApprovalRequest,
    ApprovalRequestDocument,
} from './schemas/approval-request.schema.js';
import {
    ApprovalHistory,
    ApprovalHistoryDocument,
} from './schemas/approval-history.schema.js';
import { CreateApprovalConfigDto } from './dtos/create-approval-config.dto.js';
import { UpdateApprovalConfigDto } from './dtos/update-approval-config.dto.js';
import {
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RequestApprovalDto } from './dtos/request-approval.dto.js';
import { Deal, DealDocument, DealStatus } from '../deals/schemas/deal.schema.js';
import { ApprovalActionDto } from './dtos/approval-action.dto.js';



@Injectable()
export class ApprovalsService {
    constructor(
        @InjectModel(ApprovalConfig.name)
        private configModel: Model<ApprovalConfigDocument>,
        @InjectModel(ApprovalRequest.name)
        private requestModel: Model<ApprovalRequestDocument>,
        @InjectModel(ApprovalHistory.name)
        private historyModel: Model<ApprovalHistoryDocument>,
        @InjectModel(Deal.name)
        private dealModel: Model<DealDocument>,
    ) { }




    async createConfig(dto: CreateApprovalConfigDto) {
        if (dto.minDiscount > dto.maxDiscount) {
            throw new BadRequestException(
                'Minimum discount cannot exceed maximum discount',
            );
        }

        if (dto.autoApprove && dto.approverRoles.length > 0) {
            throw new BadRequestException(
                'Auto-approved configuration cannot contain approver roles',
            );
        }

        return this.configModel.create(dto);
    }




    async getConfigs() {
        return this.configModel.find().sort({ minDiscount: 1 });
    }




    async updateConfig(
        id: string,
        dto: UpdateApprovalConfigDto,
    ) {
        const config = await this.configModel.findByIdAndUpdate(
            id,
            dto,
            { new: true, runValidators: true },
        );

        if (!config) {
            throw new NotFoundException(
                'Approval configuration not found',
            );
        }

        return config;
    }




    async findMatchingConfig(discountPercent: number) {
        const configs = await this.configModel
            .find({ isActive: true })
            .sort({ minDiscount: 1 });

        const matchingConfig = configs.find((config) => {
            const minValid = config.minInclusive
                ? discountPercent >= config.minDiscount
                : discountPercent > config.minDiscount;

            const maxValid = config.maxInclusive
                ? discountPercent <= config.maxDiscount
                : discountPercent < config.maxDiscount;

            return minValid && maxValid;
        });

        if (!matchingConfig) {
            throw new BadRequestException(
                'No approval configuration found for this discount',
            );
        }

        return matchingConfig;
    }





    async requestApproval(dto: RequestApprovalDto, user: any) {
        const scopeFilter: any = {};

        if (user.role.dataScope === 'own') {
            scopeFilter.ownerId = new Types.ObjectId(user.id);
        } else if (user.role.dataScope === 'branch') {
            scopeFilter.branchId = new Types.ObjectId(user.branchId);
        } else if (user.role.dataScope !== 'all') {
            throw new ForbiddenException('Invalid data scope');
        }

        // Find deal within the user's permitted scope
        const deal = await this.dealModel.findOne({
            _id: new Types.ObjectId(dto.dealId),
            ...scopeFilter,
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (deal.status === DealStatus.PENDING_APPROVAL) {
            throw new ConflictException(
                'Deal already has a pending approval',
            );
        }

        const config = await this.findMatchingConfig(
            dto.discountPercent,
        );

        deal.discountPercent = dto.discountPercent;

        if (config.autoApprove) {
            await deal.save();

            return {
                message: 'Discount automatically approved',
                deal,
            };
        }

        if (!config.approverRoles.length) {
            throw new BadRequestException(
                'Approval chain is not configured',
            );
        }

        // Create sequential approval chain
        const approvalChain = config.approverRoles.map(
            (role, index) => ({
                step: index + 1,
                approverRole: role,
                status: 'pending',
            }),
        );

        const request = await this.requestModel.create({
            dealId: deal._id,
            requestedBy: user.id,
            discountPercent: dto.discountPercent,
            approvalChain,
            currentStep: 0,
            status: 'pending',
        });

        deal.status = DealStatus.PENDING_APPROVAL;
        await deal.save();

        return {
            message: 'Discount approval requested',
            request,
        };
    }




    async getPendingApprovals(user: any) {
        const requests = await this.requestModel.find({
            status: 'pending',
            requestedBy: {
                $ne: new Types.ObjectId(user.id),
            },
            approvalChain: {
                $exists: true,
                $ne: [],
            },
        }).populate('dealId');

        return requests.filter((request) => {
            const step = request.approvalChain[request.currentStep];

            // Admin can see all pending approvals
            if (user.role.name === 'admin') {
                return true;
            }

            return step?.approverRole === user.role.name;
        });
    }





    async processApproval(
        requestId: string,
        dto: ApprovalActionDto,
        user: any,
    ) {
        const request = await this.requestModel.findOne({
            _id: requestId,
            status: 'pending',
        });

        if (!request) {
            throw new NotFoundException(
                'Pending approval request not found',
            );
        }

        if (request.requestedBy.toString() === user.id) {
            throw new ForbiddenException(
                'You cannot approve your own request',
            );
        }

        const currentStep =
            request.approvalChain[request.currentStep];

        if (!currentStep) {
            throw new ConflictException(
                'No pending approval step found',
            );
        }


        if (currentStep.approverRole !== user.role.name) {
            throw new ForbiddenException(
                'It is not your turn to approve this request',
            );
        }

        const deal = await this.dealModel.findById(
            request.dealId,
        );

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        await this.historyModel.create({
            dealId: request.dealId,
            approvalRequestId: request._id,
            step: currentStep.step,
            approverRole: currentStep.approverRole,
            approverId: user.id,
            action: dto.action,
            remarks: dto.remarks,
        });

        if (dto.action === 'rejected') {
            request.status = 'rejected';

            // Clear the pending approval chain
            request.approvalChain = [];

            await request.save();

            deal.status = DealStatus.OPEN;
            await deal.save();

            return {
                message: 'Discount request rejected',
                request,
            };
        }

        request.approvalChain[request.currentStep].status =
            'approved';

        request.currentStep += 1;

        if (
            request.currentStep >= request.approvalChain.length
        ) {
            request.status = 'approved';

            deal.status = DealStatus.WON;

            await deal.save();
        }

        await request.save();

        return {
            message:
                request.status === 'approved'
                    ? 'Discount fully approved'
                    : 'Approval completed. Waiting for next approver',

            request,
        };
    }


}
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { BranchSchema } from '../src/branches/schemas/branch.schema.js';
import { RoleSchema } from '../src/roles/schemas/role.schema.js';
import { UserSchema } from '../src/users/schemas/user.schema.js';
import { CustomerSchema } from '../src/customers/schemas/customer.schema.js';
import { ProductSchema } from '../src/products/schemas/product.schema.js';
import { DealSchema } from '../src/deals/schemas/deal.schema.js';


async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);

        console.log('MongoDB connected');

        const Branch = mongoose.model('Branch', BranchSchema);
        const Role = mongoose.model('Role', RoleSchema);
        const User = mongoose.model('User', UserSchema);
        const Customer = mongoose.model('Customer', CustomerSchema);
        const Product = mongoose.model('Product', ProductSchema);
        const Deal = mongoose.model('Deal', DealSchema);

        // Clear existing seed data
        await Promise.all([
            User.deleteMany({}),
            Role.deleteMany({}),
            Branch.deleteMany({}),
            Customer.deleteMany({}),
            Product.deleteMany({}),
            Deal.deleteMany({})
        ]);

        // 1. Create branches
        const branches = await Branch.insertMany([
            {
                name: 'Dubai Branch',
                code: 'DXB',
            },
            {
                name: 'Abu Dhabi Branch',
                code: 'AUH',
            },
        ]);

        const dubaiBranch = branches[0];
        const abuDhabiBranch = branches[1];

        // 2. Create roles
        const roles = await Role.insertMany([
            {
                name: 'sales_exec',
                permissions: [
                    'deal.view',
                    'deal.edit',
                    'chat.send',
                ],
                dataScope: 'own',
            },
            {
                name: 'sales_manager',
                permissions: [
                    'deal.view',
                    'deal.edit',
                    'discount.approve',
                    'chat.send',
                ],
                dataScope: 'branch',
            },
            {
                name: 'finance',
                permissions: [
                    'deal.view',
                    'discount.approve',
                    'invoice.issue',
                    'invoice.cancel',
                ],
                dataScope: 'all',
            },
            {
                name: 'admin',
                permissions: [
                    'deal.view',
                    'deal.edit',
                    'discount.approve',
                    'invoice.issue',
                    'invoice.cancel',
                    'chat.send',
                    'role.manage',
                    'approval-config.manage',
                ],
                dataScope: 'all',
            },
        ]);

        const roleMap = Object.fromEntries(
            roles.map((role) => [role.name, role._id]),
        );

        // 3. Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 4. Create five users
        await User.insertMany([
            {
                name: 'Sales Executive Dubai',
                email: 'sales1@dealdesk.com',
                password: hashedPassword,
                roleId: roleMap.sales_exec,
                branchId: dubaiBranch._id,
            },
            {
                name: 'Sales Manager Dubai',
                email: 'manager1@dealdesk.com',
                password: hashedPassword,
                roleId: roleMap.sales_manager,
                branchId: dubaiBranch._id,
            },
            {
                name: 'Sales Executive Abu Dhabi',
                email: 'sales2@dealdesk.com',
                password: hashedPassword,
                roleId: roleMap.sales_exec,
                branchId: abuDhabiBranch._id,
            },
            {
                name: 'Finance User',
                email: 'finance@dealdesk.com',
                password: hashedPassword,
                roleId: roleMap.finance,
                branchId: dubaiBranch._id,
            },
            {
                name: 'System Admin',
                email: 'admin@dealdesk.com',
                password: hashedPassword,
                roleId: roleMap.admin,
                branchId: dubaiBranch._id,
            },
        ]);

        // 5. Create three customers
        await Customer.insertMany([
            {
                name: 'ABC Trading LLC',
                email: 'abc@example.com',
                phone: '971500000001',
                outstandingBalance: 0,
            },
            {
                name: 'Global Equipment LLC',
                email: 'global@example.com',
                phone: '971500000002',
                outstandingBalance: 0,
            },
            {
                name: 'Modern Business LLC',
                email: 'modern@example.com',
                phone: '971500000003',
                outstandingBalance: 0,
            },
        ]);

        // 6. Create three products
        await Product.insertMany([
            {
                name: 'Industrial Generator',
                sku: 'GEN-001',
                price: 15000,
            },
            {
                name: 'Heavy Duty Compressor',
                sku: 'COM-001',
                price: 25000,
            },
            {
                name: 'Hydraulic Equipment',
                sku: 'HYD-001',
                price: 35000,
            },
        ]);

        const seededUsers = await User.find();

        const salesDubai = seededUsers.find(
            (user) => user.email === 'sales1@dealdesk.com',
        );

        const salesAbuDhabi = seededUsers.find(
            (user) => user.email === 'sales2@dealdesk.com',
        );

        const customers = await Customer.find();
        const products = await Product.find();

        await Deal.insertMany([
            {
                title: 'Dubai Generator Deal',
                customerId: customers[0]._id,
                productId: products[0]._id,
                quantity: 2,
                amount: 30000,
                discountPercent: 0,
                ownerId: salesDubai!._id,
                branchId: dubaiBranch._id,
                status: 'open',
            },
            {
                title: 'Dubai Compressor Deal',
                customerId: customers[1]._id,
                productId: products[1]._id,
                quantity: 1,
                amount: 25000,
                discountPercent: 0,
                ownerId: salesDubai!._id,
                branchId: dubaiBranch._id,
                status: 'open',
            },
            {
                title: 'Abu Dhabi Equipment Deal',
                customerId: customers[2]._id,
                productId: products[2]._id,
                quantity: 1,
                amount: 35000,
                discountPercent: 0,
                ownerId: salesAbuDhabi!._id,
                branchId: abuDhabiBranch._id,
                status: 'open',
            },
        ]);

        console.log('Database seeded successfully');
        console.log('Login password for all users: password123');

    } catch (error) {
        console.error('Seed error:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();

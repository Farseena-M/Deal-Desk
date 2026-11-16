import { useEffect, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, getErrorMessage, unwrap } from '../lib/api';
import type { Deal } from '../types';
import {
    Button,
    Card,
    EmptyState,
    ErrorNotice,
    Field,
    Loading,
    PageHeader,
    StatusBadge,
} from '../components/ui';
import { money } from './Dashboard';

interface Customer {
    _id: string;
    name: string;
}

interface Product {
    _id: string;
    name: string;
}

const schema = z.object({
    title: z.string().trim().min(2, 'Enter a deal title.'),

    customerId: z.string().min(1, 'Please select a customer.'),

    productId: z.string().min(1, 'Please select a product.'),

    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),

    amount: z.coerce.number().min(0, 'Amount cannot be negative.'),

    discountPercent: z.coerce
        .number()
        .min(0, 'Discount cannot be negative.')
        .max(100, 'Discount cannot exceed 100%.'),
});

type FormValues = z.input<typeof schema>;
type SubmitValues = z.output<typeof schema>;

export default function Deals() {
    const [items, setItems] = useState<Deal[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues, unknown, SubmitValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            customerId: '',
            productId: '',
            quantity: 1,
            amount: 0,
            discountPercent: 0,
        },
    });

    async function load() {
        setBusy(true);
        setError('');

        try {
            const [dealResponse, customerResponse, productResponse] =
                await Promise.all([
                    api.get('/deals'),
                    api.get('/customers'),
                    api.get('/products'),
                ]);

            setItems(unwrap<Deal[]>(dealResponse) || []);
            setCustomers(unwrap<Customer[]>(customerResponse) || []);
            setProducts(unwrap<Product[]>(productResponse) || []);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function submit(values: SubmitValues) {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/deals', {
                title: values.title,
                customerId: values.customerId,
                productId: values.productId,
                quantity: values.quantity,
                amount: values.amount,
                discountPercent: values.discountPercent,
            });

            setSuccess('Deal created successfully!');
            setModal(false);
            form.reset();

            await load();
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    function getCustomerName(customer: Deal['customerId']) {
        if (customer && typeof customer === 'object') {
            return customer.name || 'Unknown customer';
        }

        return (
            customers.find((c) => c._id === customer)?.name ||
            'Unknown customer'
        );
    }

    return (
        <>
            <PageHeader
                title="Deals"
                description="Track opportunities and create new deals."
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={load}>
                            <RefreshCw size={15} />
                            Refresh
                        </Button>

                        <Button onClick={() => setModal(true)}>
                            <Plus size={16} />
                            New deal
                        </Button>
                    </div>
                }
            />

            {error && (
                <div className="mb-5">
                    <ErrorNotice message={error} />
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    {success}
                </div>
            )}

            <Card>
                {busy ? (
                    <Loading />
                ) : items.length === 0 ? (
                    <EmptyState
                        title="No deals found"
                        message="Create your first deal to get started."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                                    <th className="pb-3">Deal</th>
                                    <th className="pb-3">Customer</th>
                                    <th className="pb-3">Quantity</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Discount</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((d) => (
                                    <tr
                                        key={d._id}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="py-4">
                                            <p className="font-semibold text-slate-800">
                                                {d.title}
                                            </p>
                                        </td>

                                        <td className="py-4 text-sm text-slate-600">
                                            {getCustomerName(d.customerId)}
                                        </td>

                                        <td className="py-4">
                                            {d.quantity}
                                        </td>

                                        <td className="py-4 font-semibold">
                                            {money(d.amount)}
                                        </td>

                                        <td className="py-4">
                                            {d.discountPercent || 0}%
                                        </td>

                                        <td className="py-4">
                                            <StatusBadge status={d.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setModal(false);
                        }
                    }}
                >
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-ink">
                                    Create a deal
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Enter deal details and select a customer and product.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModal(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={form.handleSubmit(submit)}
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <div className="sm:col-span-2">
                                <Field
                                    label="Deal title"
                                    placeholder="New Generator Deal"
                                    {...form.register('title')}
                                    error={form.formState.errors.title?.message}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Customer
                                </label>

                                <select
                                    {...form.register('customerId')}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                                >
                                    <option value="">
                                        Select customer
                                    </option>

                                    {customers.map((customer) => (
                                        <option
                                            key={customer._id}
                                            value={customer._id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>

                                {form.formState.errors.customerId && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.formState.errors.customerId.message}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Product
                                </label>

                                <select
                                    {...form.register('productId')}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                                >
                                    <option value="">
                                        Select product
                                    </option>

                                    {products.map((product) => (
                                        <option
                                            key={product._id}
                                            value={product._id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>

                                {form.formState.errors.productId && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.formState.errors.productId.message}
                                    </p>
                                )}
                            </div>

                            <Field
                                label="Quantity"
                                type="number"
                                min="1"
                                {...form.register('quantity')}
                                error={form.formState.errors.quantity?.message}
                            />

                            <Field
                                label="Amount (INR)"
                                type="number"
                                min="0"
                                step="0.01"
                                {...form.register('amount')}
                                error={form.formState.errors.amount?.message}
                            />

                            <div className="sm:col-span-2">
                                <Field
                                    label="Discount (%)"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    {...form.register('discountPercent')}
                                    error={form.formState.errors.discountPercent?.message}
                                />
                            </div>

                            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setModal(false);
                                        form.reset();
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit" loading={saving}>
                                    Create deal
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

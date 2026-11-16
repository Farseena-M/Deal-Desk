
import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';

import { api, getErrorMessage } from '../lib/api';
import type { Deal } from '../types';
import { useAuth } from '../context/AuthContext';

import {
    Card,
    EmptyState,
    ErrorNotice,
    Loading,
    PageHeader,
    StatusBadge,
    Button,
} from '../components/ui';

import { money } from './Dashboard';

interface Customer {
    _id: string;
    name: string;
    email?: string;
}

interface Product {
    _id: string;
    name: string;
    sku?: string;
    price?: number;
}

interface DealForm {
    title: string;
    customerId: string;
    productId: string;
    quantity: number;
    amount: number;
    discountPercent: number;
}

const initialForm: DealForm = {
    title: '',
    customerId: '',
    productId: '',
    quantity: 1,
    amount: 0,
    discountPercent: 0,
};

// Extract arrays from the API response
function extractList<T>(response: any): T[] {
    const data = response?.data?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}

export default function Deals() {
    const { user } = useAuth();

    const [items, setItems] = useState<Deal[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [busy, setBusy] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<DealForm>(initialForm);

    const canViewDeals =
        user?.role?.permissions?.includes('deal.view') ?? false;

    const canCreateDeal =
        user?.role?.permissions?.includes('deal.edit') ?? false;

    // Fetch deals, customers and products
    const load = useCallback(async () => {
        if (!canViewDeals) {
            setBusy(false);
            return;
        }

        setBusy(true);
        setError('');

        try {
            const [dealResponse, customerResponse, productResponse] =
                await Promise.all([
                    api.get('/deals'),
                    api.get('/customers'),
                    api.get('/products'),
                ]);

            setItems(extractList<Deal>(dealResponse));
            setCustomers(extractList<Customer>(customerResponse));
            setProducts(extractList<Product>(productResponse));

        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    }, [canViewDeals]);

    useEffect(() => {
        void load();
    }, [load]);

    // Handle form input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: [
                'quantity',
                'amount',
                'discountPercent',
            ].includes(name)
                ? Number(value)
                : value,
        }));
    };

    // Create deal
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!canCreateDeal) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/deals', {
                title: form.title.trim(),
                customerId: form.customerId,
                productId: form.productId,
                quantity: Number(form.quantity),
                amount: Number(form.amount),
                discountPercent: Number(form.discountPercent),
            });

            setSuccess('Deal created successfully!');
            setForm(initialForm);
            setShowForm(false);

            await load();

        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    };

    // Permission check
    if (!canViewDeals) {
        return (
            <div className="p-6">
                <ErrorNotice message="You do not have permission to view deals." />
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Deals"
                description="View and manage all your deals."
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={load}
                            disabled={busy}
                        >
                            <RefreshCw size={15} />
                            Refresh
                        </Button>

                        {canCreateDeal && (
                            <Button
                                onClick={() => {
                                    setError('');
                                    setSuccess('');
                                    setShowForm(true);
                                }}
                            >
                                <Plus size={16} />
                                Add Deal
                            </Button>
                        )}
                    </div>
                }
            />

            {error && (
                <div className="mb-5">
                    <ErrorNotice message={error} />
                </div>
            )}

            {success && (
                <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            {/* Add Deal Form */}
            {showForm && canCreateDeal && (
                <Card>
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Add New Deal
                        </h2>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="text-slate-500 hover:text-slate-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            {/* Deal Title */}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Deal Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Enter deal title"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Customer Dropdown */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Customer
                                </label>

                                <select
                                    name="customerId"
                                    value={form.customerId}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select Customer
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

                                {customers.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        No customers available.
                                    </p>
                                )}
                            </div>

                            {/* Product Dropdown */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Product
                                </label>

                                <select
                                    name="productId"
                                    value={form.productId}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select Product
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

                                {products.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        No products available.
                                    </p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Amount
                                </label>

                                <input
                                    type="number"
                                    name="amount"
                                    min="0"
                                    value={form.amount}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Discount Percentage (%)
                                </label>

                                <input
                                    type="number"
                                    name="discountPercent"
                                    min="0"
                                    max="100"
                                    value={form.discountPercent}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    saving ||
                                    customers.length === 0 ||
                                    products.length === 0
                                }
                            >
                                {saving ? 'Creating...' : 'Create Deal'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Deals Table */}
            <Card>
                {busy ? (
                    <Loading />
                ) : items.length === 0 ? (
                    <EmptyState
                        title="No deals found"
                        message="There are no deals available to display."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                                    <th className="pb-3">Deal</th>
                                    <th className="pb-3">Customer</th>
                                    <th className="pb-3">Product</th>
                                    <th className="pb-3">Quantity</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Discount</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((deal) => (
                                    <tr
                                        key={deal._id}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="py-4">
                                            <p className="font-semibold text-slate-800">
                                                {deal.title}
                                            </p>
                                        </td>

                                        <td className="py-4">
                                            {typeof deal.customerId === 'object'
                                                ? deal.customerId?.name ?? '-'
                                                : '-'}
                                        </td>

                                        <td className="py-4">
                                            {typeof deal.productId === 'object'
                                                ? deal.productId?.name ?? '-'
                                                : '-'}
                                        </td>

                                        <td className="py-4">
                                            {deal.quantity}
                                        </td>

                                        <td className="py-4 font-semibold">
                                            {money(deal.amount)}
                                        </td>

                                        <td className="py-4">
                                            {deal.discountPercent || 0}%
                                        </td>

                                        <td className="py-4">
                                            <StatusBadge status={deal.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
}

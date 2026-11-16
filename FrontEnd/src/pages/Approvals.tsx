
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
    Check,
    Edit,
    RefreshCw,
    X,
    Plus,
    Save,
} from 'lucide-react';

import { api, getErrorMessage, unwrap } from '../lib/api';

import {
    Button,
    Card,
    EmptyState,
    ErrorNotice,
    Loading,
    PageHeader,
    StatusBadge,
} from '../components/ui';

import { money } from './Dashboard';

// Types

interface ApprovalConfig {
    _id: string;
    minDiscount: number;
    maxDiscount: number;
    minInclusive: boolean;
    maxInclusive: boolean;
    autoApprove: boolean;
    approverRoles: string[];
}

interface ApprovalStep {
    step: number;
    approverRole: string;
    status: string;
}

interface Approval {
    _id: string;
    dealId: any;
    requestedBy?: any;
    discountPercent?: number;
    status?: string;
    currentStep?: number;
    approvalChain?: ApprovalStep[];
}

interface ConfigForm {
    minDiscount: string;
    maxDiscount: string;
    isActive: boolean;
}

const initialForm: ConfigForm = {
    minDiscount: '0',
    maxDiscount: '10',
    isActive: true,
};

// Automatically generate approval roles based on discount range.

const getApprovalRule = (min: number, max: number) => {
    if (min === 0 && max === 10) {
        return {
            minInclusive: true,
            maxInclusive: true,
            autoApprove: true,
            approverRoles: [] as string[],
        };
    }

    if (min === 10 && max === 25) {
        return {
            minInclusive: false,
            maxInclusive: true,
            autoApprove: false,
            approverRoles: ['sales_manager'],
        };
    }

    if (min === 25 && max === 40) {
        return {
            minInclusive: false,
            maxInclusive: true,
            autoApprove: false,
            approverRoles: ['sales_manager', 'finance'],
        };
    }

    if (min === 40 && max === 100) {
        return {
            minInclusive: false,
            maxInclusive: true,
            autoApprove: false,
            approverRoles: [
                'sales_manager',
                'finance',
                'admin',
            ],
        };
    }

    return null;
};

// Role display names.

const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
        sales_manager: 'Sales Manager',
        finance: 'Finance',
        admin: 'Admin',
    };

    return labels[role] || role.replaceAll('_', ' ');
};

// Display approval chain.

const getChainText = (config: ApprovalConfig) => {
    if (config.autoApprove) {
        return 'Automatically approved';
    }

    if (!config.approverRoles?.length) {
        return 'No approval chain';
    }

    return config.approverRoles.map(roleLabel).join(' → ');
};

export default function Approvals() {
    const [configs, setConfigs] = useState<ApprovalConfig[]>([]);
    const [approvals, setApprovals] = useState<Approval[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [remarks, setRemarks] = useState<Record<string, string>>({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<ConfigForm>(initialForm);

    // Fetch approval configurations and pending requests.

    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [pendingResponse, configResponse] = await Promise.all([
                api.get('/approvals/pending'),
                api.get('/approvals/config').catch(() => null),
            ]);

            const pendingData = unwrap<any>(pendingResponse);
            const configData = configResponse
                ? unwrap<any>(configResponse)
                : [];

            setApprovals(
                Array.isArray(pendingData)
                    ? pendingData
                    : pendingData?.data || [],
            );

            setConfigs(
                Array.isArray(configData)
                    ? configData
                    : configData?.data || [],
            );
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Open add form.

    const openAddForm = () => {
        setEditingId(null);
        setForm(initialForm);
        setShowForm(true);
        setError('');
    };

    // Open edit form.

    const openEditForm = (config: ApprovalConfig) => {
        setEditingId(config._id);


        setShowForm(true);
        setError('');
    };

    // Save configuration.

    const saveConfig = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const min = Number(form.minDiscount);
        const max = Number(form.maxDiscount);

        if (
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            min < 0 ||
            max > 100 ||
            min >= max
        ) {
            setError(
                'Enter a valid discount range between 0 and 100.',
            );
            return;
        }

        // Generate approval roles automatically.

        const rule = getApprovalRule(min, max);

        if (!rule) {
            setError(
                'Allowed ranges are 0–10, 10–25, 25–40, and 40–100.',
            );
            return;
        }

        // Request body.

        const payload = {
            minDiscount: min,
            maxDiscount: max,
            minInclusive: rule.minInclusive,
            maxInclusive: rule.maxInclusive,
            approverRoles: rule.approverRoles,
            autoApprove: rule.autoApprove,
            isActive: form.isActive,
        };

        setSaving(true);

        try {
            if (editingId) {
                await api.put(
                    `/approvals/config/${editingId}`,
                    payload,
                );
            } else {
                await api.post(
                    '/approvals/config',
                    payload,
                );
            }

            setShowForm(false);
            setEditingId(null);
            setForm(initialForm);

            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // Approve or reject request.

    const processApproval = async (
        requestId: string,
        action: 'approve' | 'reject',
    ) => {
        setError('');
        setSaving(true);

        try {
            await api.post(
                `/approvals/${requestId}/action`,
                {
                    action,
                    remarks: remarks[requestId] || '',
                },
            );

            setRemarks((previous) => ({
                ...previous,
                [requestId]: '',
            }));

            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // Loading state.

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">

            <PageHeader
                title="Approvals"
                description="Manage discount approval configurations and pending requests."
            />

            {error && (
                <EmptyState
                    title="No configurations"
                    message="No approval configurations found."
                />
            )}

            {/* Approval Configurations */}

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Approval Configurations
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Configure approval chains based on discount percentages.
                        </p>
                    </div>

                    <Button onClick={openAddForm}>
                        <Plus size={16} />
                        Add Configuration
                    </Button>
                </div>

                {/* Add/Edit Form */}

                {showForm && (
                    <form
                        onSubmit={saveConfig}
                        className="border border-slate-200 rounded-xl p-4 mb-5 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">
                                {editingId
                                    ? 'Edit Configuration'
                                    : 'Add Configuration'}
                            </h3>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Minimum Discount (%)
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                    value={form.minDiscount}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            minDiscount: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Maximum Discount (%)
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                    value={form.maxDiscount}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            maxDiscount: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>

                        {/* Automatic Approval Chain Preview */}

                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">

                            <p className="text-sm font-medium text-slate-700 mb-3">
                                Approval Chain Preview
                            </p>

                            {(() => {
                                const rule = getApprovalRule(
                                    Number(form.minDiscount),
                                    Number(form.maxDiscount),
                                );

                                if (!rule) {
                                    return (
                                        <p className="text-sm text-amber-600">
                                            Enter one of the supported discount ranges:
                                            0–10, 10–25, 25–40, or 40–100.
                                        </p>
                                    );
                                }

                                if (rule.autoApprove) {
                                    return (
                                        <p className="text-sm font-medium text-green-700">
                                            <Check
                                                size={16}
                                                className="inline mr-1"
                                            />
                                            Automatically Approved — No Approval Required
                                        </p>
                                    );
                                }

                                return (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {rule.approverRoles.map((role, index) => (
                                            <div
                                                key={role}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                                                    {roleLabel(role)}
                                                </span>

                                                {index < rule.approverRoles.length - 1 && (
                                                    <span className="text-slate-400 font-semibold">
                                                        →
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                        </div>

                        {/* Active Status */}

                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        isActive: e.target.checked,
                                    })
                                }
                                className="rounded border-slate-300"
                            />

                            Active Configuration
                        </label>

                        <div className="flex justify-end gap-2">

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                loading={saving}
                            >
                                <Save size={15} />
                                {editingId ? 'Update Configuration' : 'Save Configuration'}
                            </Button>

                        </div>
                    </form>
                )}

                {/* Configuration Table */}

                {configs.length === 0 ? (
                    <EmptyState
                        title="No configurations"
                        message="No approval configurations found."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">

                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="p-3 font-medium">
                                        Discount Range
                                    </th>

                                    <th className="p-3 font-medium">
                                        Approval Chain
                                    </th>



                                    <th className="p-3 font-medium text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {configs.map((config) => (
                                    <tr
                                        key={config._id}
                                        className="border-b border-slate-50"
                                    >
                                        <td className="p-3 font-medium text-slate-800">
                                            {config.minDiscount}% – {config.maxDiscount}%
                                        </td>

                                        <td className="p-3 text-slate-600">
                                            {getChainText(config)}
                                        </td>

                                        <td className="p-3 text-right">
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    openEditForm(config)
                                                }
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}
            </Card>

            {/* Pending Approvals */}

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Pending Approvals
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Review and process discount approval requests.
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => void load()}
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </Button>

                </div>

                {approvals.length === 0 ? (
                    <EmptyState
                        title="No pending approvals"
                        message="No pending approval requests."
                    />
                ) : (
                    <div className="space-y-4">

                        {approvals.map((approval) => {
                            const deal = approval.dealId || {};
                            const chain = approval.approvalChain || [];

                            return (
                                <div
                                    key={approval._id}
                                    className="border border-slate-200 rounded-xl p-4 space-y-4"
                                >

                                    {/* Deal Details */}

                                    <div className="flex flex-wrap items-start justify-between gap-3">

                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {deal.title || 'Untitled Deal'}
                                            </h3>

                                            <p className="text-sm text-slate-500 mt-1">
                                                {deal.companyName || deal.customerName || ''}
                                            </p>
                                        </div>

                                        <StatusBadge
                                            status={approval.status || 'PENDING'}
                                        />

                                    </div>

                                    {/* Deal Information */}

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Deal Value
                                            </p>

                                            <p className="font-medium text-slate-800">
                                                {money(
                                                    Number(deal.value || deal.amount || 0),
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Discount
                                            </p>

                                            <p className="font-medium text-slate-800">
                                                {approval.discountPercent ??
                                                    deal.discountPercent ??
                                                    0}%
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Current Step
                                            </p>

                                            <p className="font-medium text-slate-800">
                                                {chain.length > 0
                                                    ? `${Math.min(
                                                        (approval.currentStep || 0) + 1,
                                                        chain.length,
                                                    )} / ${chain.length}`
                                                    : '—'}
                                            </p>
                                        </div>

                                    </div>

                                    {/* Approval Chain */}

                                    {chain.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 mb-2">
                                                Approval Chain
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2">

                                                {chain.map((step, index) => (
                                                    <div
                                                        key={`${step.step}-${step.approverRole}`}
                                                        className="flex items-center gap-2"
                                                    >

                                                        <span
                                                            className={`rounded-lg border px-3 py-2 text-xs font-medium ${step.status === 'approved'
                                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                                : step.status === 'rejected'
                                                                    ? 'bg-red-50 border-red-200 text-red-700'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                                                }`}
                                                        >
                                                            {roleLabel(step.approverRole)}
                                                            {' · '}
                                                            {step.status}
                                                        </span>

                                                        {index < chain.length - 1 && (
                                                            <span className="text-slate-400">
                                                                →
                                                            </span>
                                                        )}

                                                    </div>
                                                ))}

                                            </div>
                                        </div>
                                    )}

                                    {/* Remarks */}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Remarks
                                        </label>

                                        <textarea
                                            rows={2}
                                            value={remarks[approval._id] || ''}
                                            onChange={(e) =>
                                                setRemarks((previous) => ({
                                                    ...previous,
                                                    [approval._id]: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter remarks..."
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Actions */}

                                    <div className="flex justify-end gap-2">

                                        <Button
                                            variant="danger"
                                            disabled={saving}
                                            onClick={() =>
                                                void processApproval(
                                                    approval._id,
                                                    'reject',
                                                )
                                            }
                                        >
                                            <X size={15} />
                                            Reject
                                        </Button>

                                        <Button
                                            disabled={saving}
                                            onClick={() =>
                                                void processApproval(
                                                    approval._id,
                                                    'approve',
                                                )
                                            }
                                        >
                                            <Check size={15} />
                                            Approve
                                        </Button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}
            </Card>

        </div>
    );
}

import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { api, getErrorMessage, unwrap } from '../lib/api';
import type { Approval, Deal } from '../types';
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

export default function Approvals() {
    const [items, setItems] = useState<Approval[]>([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState('');

    async function load() {
        setBusy(true);
        setError('');

        try {
            const response = await api.get('/approvals/pending');
            setItems(unwrap<Approval[]>(response) || []);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function action(
        id: string,
        actionType: 'approved' | 'rejected',
    ) {
        setSaving(id);
        setError('');

        try {
            await api.post(`/approvals/${id}/action`, {
                action: actionType,
                remarks: remarks[id] || '',
            });

            await load();
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setSaving('');
        }
    }

    return (
        <>
            <PageHeader
                title="Discount approvals"
                description="Review discount requests assigned to your role."
                action={
                    <Button variant="secondary" onClick={load}>
                        <RefreshCw size={15} />
                        Refresh
                    </Button>
                }
            />

            {error && (
                <div className="mb-5">
                    <ErrorNotice message={error} />
                </div>
            )}

            <Card>
                {busy ? (
                    <Loading />
                ) : items.length === 0 ? (
                    <EmptyState
                        title="No pending approvals"
                        message="New requests assigned to you will appear here."
                    />
                ) : (
                    <div className="space-y-4">
                        {items.map((a) => {
                            const deal =
                                typeof a.dealId === 'object'
                                    ? (a.dealId as Deal)
                                    : null;

                            return (
                                <div
                                    key={a._id}
                                    className="rounded-xl border border-slate-100 p-4 sm:p-5"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {deal?.title || 'Deal approval request'}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Request ID: {a._id}
                                            </p>

                                            {deal && (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Deal amount: {money(deal.amount)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                                                {a.discountPercent}% discount
                                            </span>

                                            <StatusBadge status={a.status} />
                                        </div>
                                    </div>

                                    {a.approvalChain &&
                                        a.approvalChain.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {a.approvalChain.map((step, i) => (
                                                    <span
                                                        key={i}
                                                        className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
                                                    >
                                                        {step.approverRole}: {step.status}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                                        <Field
                                            label="Remarks (optional)"
                                            placeholder="Add a short note"
                                            value={remarks[a._id] || ''}
                                            onChange={(e) =>
                                                setRemarks((v) => ({
                                                    ...v,
                                                    [a._id]: e.target.value,
                                                }))
                                            }
                                        />

                                        <div className="flex items-end gap-2">
                                            <Button
                                                variant="danger"
                                                disabled={!!saving}
                                                loading={saving === a._id}
                                                onClick={() =>
                                                    action(a._id, 'rejected')
                                                }
                                            >
                                                <X size={15} />
                                                Reject
                                            </Button>

                                            <Button
                                                disabled={!!saving}
                                                loading={saving === a._id}
                                                onClick={() =>
                                                    action(a._id, 'approved')
                                                }
                                            >
                                                <Check size={15} />
                                                Approve
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </>
    );
}

import { useEffect, useState } from 'react';
import { FilePlus2, RefreshCw } from 'lucide-react';
import { api, getErrorMessage, unwrap } from '../lib/api';
import type { Deal } from '../types';
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

export default function Invoices() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState('');

    async function load() {
        setBusy(true);
        setError('');

        try {
            setDeals(unwrap<Deal[]>(await api.get('/deals')) || []);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function issue(id: string) {
        setSaving(id);
        setError('');
        setSuccess('');

        try {
            const result = unwrap<Record<string, unknown>>(
                await api.post(`/invoices/from-deal/${id}`),
            );

            setSuccess(
                `Invoice request completed${
                    result
                        ? ` · Invoice ID: ${String(result._id || 'created')}`
                        : ''
                }. BillPort processing is handled by the backend queue.`,
            );
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setSaving('');
        }
    }

    return (
        <>
            <PageHeader
                title="Invoices"
                description="Create local invoices from eligible deals through the NestJS API."
                action={
                    <Button variant="secondary" onClick={load}>
                        <RefreshCw size={15} />
                        Refresh deals
                    </Button>
                }
            />

            {error && (
                <div className="mb-4">
                    <ErrorNotice message={error} />
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    {success}
                </div>
            )}

            <Card>
                {busy ? (
                    <Loading />
                ) : deals.length === 0 ? (
                    <EmptyState
                        title="No deals available"
                        message="Create a deal before issuing an invoice."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                                    <th className="pb-3">Deal</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Deal status</th>
                                    <th className="pb-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {deals.map((d) => (
                                    <tr
                                        key={d._id}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="py-4">
                                            <p className="font-semibold text-slate-800">
                                                {d.title}
                                            </p>
                                        </td>

                                        <td className="py-4 font-semibold">
                                            {money(d.amount)}
                                        </td>

                                        <td className="py-4">
                                            <StatusBadge status={d.status} />
                                        </td>

                                        <td className="py-4 text-right">
                                            <Button
                                                disabled={!!saving}
                                                loading={saving === d._id}
                                                onClick={() => issue(d._id)}
                                            >
                                                <FilePlus2 size={15} />
                                                Create invoice
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <p className="mt-4 text-xs leading-5 text-slate-400">
                The current backend exposes invoice creation from a deal, but no
                invoice-list or invoice-detail endpoint. This page therefore
                shows deals eligible for conversion and confirms the creation
                response.
            </p>
        </>
    );
}

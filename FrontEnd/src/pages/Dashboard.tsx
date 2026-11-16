import { useEffect, useState } from 'react';
import {
    ArrowUpRight,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    MessageCircle,
    Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, unwrap } from '../lib/api';
import type { Approval, ChatThread, Deal } from '../types';
import {
    Card,
    EmptyState,
    ErrorNotice,
    Loading,
    PageHeader,
    StatusBadge,
} from '../components/ui';

export default function Dashboard() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/deals'),
                    api.get('/approvals/pending'),
                    api.get('/chat/my-threads'),
                ]);

                if (!active) return;

                const [d, a, c] = results;

                if (d.status === 'fulfilled') {
                    setDeals(unwrap<Deal[]>(d.value) || []);
                } else {
                    setError(getErrorMessage(d.reason));
                }

                if (a.status === 'fulfilled') {
                    setApprovals(unwrap<Approval[]>(a.value) || []);
                }

                if (c.status === 'fulfilled') {
                    setThreads(unwrap<ChatThread[]>(c.value) || []);
                }
            } catch (e) {
                if (active) {
                    setError(getErrorMessage(e));
                }
            } finally {
                if (active) {
                    setBusy(false);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const total = deals.reduce(
        (sum, deal) => sum + Number(deal.amount || 0),
        0,
    );

    return (
        <>
            <PageHeader
                title="Good to see you"
                description="Here's what's happening across your sales workspace."
                action={
                    <Link
                        to="/deals"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                        <Plus size={16} />
                        View deals
                    </Link>
                }
            />

            {error && (
                <div className="mb-5">
                    <ErrorNotice message={error} />
                </div>
            )}

            {busy ? (
                <Loading label="Loading your workspace..." />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Metric
                            icon={BriefcaseBusiness}
                            label="Total deals"
                            value={deals.length.toString()}
                            hint="Visible in your access scope"
                        />

                        <Metric
                            icon={CheckCircle2}
                            label="Won deals"
                            value={deals
                                .filter((d) => d.status === 'won')
                                .length.toString()}
                            hint="Successfully closed"
                        />

                        <Metric
                            icon={Clock3}
                            label="Pending approvals"
                            value={approvals.length.toString()}
                            hint="Awaiting your review"
                        />

                        <Metric
                            icon={MessageCircle}
                            label="Chat threads"
                            value={threads.length.toString()}
                            hint="Your conversations"
                        />
                    </div>

                    <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                        <Card>
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-ink">
                                        Recent deals
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Your latest opportunities
                                    </p>
                                </div>

                                <Link
                                    to="/deals"
                                    className="text-sm font-semibold text-brand-600"
                                >
                                    View all{' '}
                                    <ArrowUpRight
                                        className="inline"
                                        size={15}
                                    />
                                </Link>
                            </div>

                            {deals.length === 0 ? (
                                <EmptyState
                                    title="No deals yet"
                                    message="Deals created through your API will appear here."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[520px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                                                <th className="pb-3 font-semibold">
                                                    Deal
                                                </th>
                                                <th className="pb-3 font-semibold">
                                                    Amount
                                                </th>
                                                <th className="pb-3 font-semibold">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {deals.slice(0, 6).map((d) => (
                                                <tr
                                                    key={d._id}
                                                    className="border-b border-slate-50 last:border-0"
                                                >
                                                    <td className="py-4">
                                                        <p className="font-semibold text-slate-800">
                                                            {d.title}
                                                        </p>
                                                    </td>

                                                    <td className="py-4 font-semibold text-slate-700">
                                                        {money(d.amount)}
                                                    </td>

                                                    <td className="py-4">
                                                        <StatusBadge
                                                            status={d.status}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        <Card>
                            <div className="mb-5">
                                <h2 className="font-bold text-ink">
                                    Approval queue
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Requests that need attention
                                </p>
                            </div>

                            {approvals.length === 0 ? (
                                <EmptyState
                                    title="You're all caught up"
                                    message="No pending approvals are assigned to you."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {approvals.slice(0, 5).map((a) => (
                                        <div
                                            key={a._id}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {typeof a.dealId === 'object'
                                                        ? a.dealId.title
                                                        : 'Discount approval'}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Discount: {a.discountPercent}%
                                                </p>
                                            </div>

                                            <StatusBadge status={a.status} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                to="/approvals"
                                className="mt-4 inline-flex text-sm font-semibold text-brand-600"
                            >
                                Open approvals{' '}
                                <ArrowUpRight size={15} />
                            </Link>
                        </Card>
                    </div>

                    <p className="mt-6 text-xs text-slate-400">
                        Visible deal value:{' '}
                        <strong className="text-slate-600">
                            {money(total)}
                        </strong>{' '}
                        · Calculated from deals returned by your backend.
                    </p>
                </>
            )}
        </>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: typeof BriefcaseBusiness;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
                        {value}
                    </p>
                </div>

                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                    <Icon size={19} />
                </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
                {hint}
            </p>
        </Card>
    );
}

export function money(v: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(v || 0);
}

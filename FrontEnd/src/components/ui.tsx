import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
} from 'react';
import { LoaderCircle } from 'lucide-react';

// Button Component
export function Button({
    children,
    className = '',
    variant = 'primary',
    loading = false,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    loading?: boolean;
}) {
    const styles = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        secondary:
            'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        ghost: 'text-slate-600 hover:bg-slate-100',
    };

    return (
        <button
            {...props}
            disabled={props.disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
        >
            {loading && (
                <LoaderCircle size={16} className="animate-spin" />
            )}

            {children}
        </button>
    );
}

// Input Field Component
export function Field({
    label,
    error,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
                {label}
            </span>

            <input
                {...props}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${error ? 'border-rose-400' : 'border-slate-200'
                    }`}
            />

            {error && (
                <span className="text-xs text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}

// Card Component
export function Card({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft ${className}`}
        >
            {children}
        </section>
    );
}

// Page Header Component
export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                    {title}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </div>

            {action}
        </div>
    );
}

// Status Badge Component
export function StatusBadge({
    status,
}: {
    status?: string;
}) {
    const value = (status || 'unknown').toLowerCase();

    const cls =
        value.includes('approved') ||
            value === 'won' ||
            value === 'paid'
            ? 'bg-emerald-50 text-emerald-700'
            : value.includes('pending') || value === 'open'
                ? 'bg-amber-50 text-amber-700'
                : value === 'rejected' ||
                    value === 'lost' ||
                    value === 'failed'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600';

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}
        >
            {value.replaceAll('_', ' ')}
        </span>
    );
}

// Empty State Component
export function EmptyState({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    return (
        <div className="py-12 text-center">
            <p className="font-semibold text-slate-700">
                {title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
                {message}
            </p>
        </div>
    );
}

// Error Notice Component
export function ErrorNotice({
    message,
}: {
    message: string;
}) {
    return (
        <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
            {message}
        </div>
    );
}

// Loading Component
export function Loading({
    label = 'Loading...',
}: {
    label?: string;
}) {
    return (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={18} />
            {label}
        </div>
    );
}

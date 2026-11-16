import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BriefcaseBusiness,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Field, ErrorNotice } from '../components/ui';
import { getErrorMessage } from '../lib/api';

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must contain at least 6 characters.');
            return;
        }

        setBusy(true);

        try {
            await login(email.trim(), password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_.95fr]">
            {/* Left Branding Section */}
            <div className="hidden flex-col justify-between bg-[#172b55] p-12 text-white lg:flex">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-2.5">
                        <BriefcaseBusiness size={24} />
                    </div>
                    <span className="text-xl font-bold">DealDesk</span>
                </div>

                <div className="max-w-xl">
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[.22em] text-blue-200">
                        Sales operations, simplified
                    </p>

                    <h1 className="text-5xl font-bold leading-tight">
                        Move every deal forward with confidence.
                    </h1>

                    <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/80">
                        Manage opportunities, approvals and customer conversations in one
                        clear workspace.
                    </p>

                    <div className="mt-10 flex items-center gap-3 text-sm text-blue-100">
                        <ShieldCheck size={18} />
                        Secure workspace powered by your DealDesk account
                    </div>
                </div>

                <p className="text-xs text-blue-200/60">
                    © {new Date().getFullYear()} DealDesk
                </p>
            </div>

            {/* Right Login Section */}
            <div className="flex min-h-screen items-center justify-center px-5 py-12">
                <div className="w-full max-w-md">

                    <div className="mb-10 flex items-center gap-3 lg:hidden">
                        <div className="rounded-xl bg-brand-600 p-2.5 text-white">
                            <BriefcaseBusiness size={22} />
                        </div>
                        <span className="text-xl font-bold text-ink">DealDesk</span>
                    </div>

                    <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                        Welcome back
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                        Sign in to your account
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Enter your credentials to continue to your workspace.
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-5">
                        {error && <ErrorNotice message={error} />}

                        <Field
                            label="Email address"
                            type="email"
                            autoComplete="username"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Field
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full py-3"
                            loading={busy}
                        >
                            Sign in
                            <ArrowRight size={16} />
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Access is managed by your DealDesk administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Activity,
    BriefcaseBusiness,
    CheckCheck,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageCircle,
    X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/deals', label: 'Deals', icon: BriefcaseBusiness },
    { to: '/approvals', label: 'Approvals', icon: CheckCheck },
    { to: '/chat', label: 'Conversations', icon: MessageCircle },
    { to: '/invoices', label: 'Invoices', icon: FileText },
];

export default function AppLayout() {
    const [open, setOpen] = useState(false);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Sign out
    function signOut() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Desktop Sidebar */}
            <div className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-white px-4 py-6 shadow-soft lg:flex">
                <Brand />

                <nav className="mt-10 flex-1 space-y-1">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${isActive
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="truncate text-sm font-semibold text-slate-800">
                        {user?.name || 'Team member'}
                    </div>

                    <div className="truncate text-xs text-slate-500">
                        {user?.email}
                    </div>

                    <button
                        onClick={signOut}
                        className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rose-600"
                    >
                        <LogOut size={14} />
                        Sign out
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="flex h-full w-72 flex-col bg-white p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <Brand />

                            <button onClick={() => setOpen(false)}>
                                <X />
                            </button>
                        </div>

                        <nav className="mt-8 flex-1 space-y-1">
                            {links.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    onClick={() => setOpen(false)}
                                    key={to}
                                    to={to}
                                    end={to === '/'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold ${isActive
                                            ? 'bg-brand-50 text-brand-700'
                                            : 'text-slate-500'
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>

                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 p-3 text-sm text-rose-600"
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="lg:pl-64">

                {/* Header */}
                <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-8">

                    {/* Mobile Menu Button */}
                    <button
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        onClick={() => setOpen(true)}
                    >
                        <Menu />
                    </button>

                    {/* Workspace Breadcrumb */}
                    <div className="hidden text-sm text-slate-500 lg:block">
                        Workspace
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="font-semibold text-slate-800">
                            Deal management
                        </span>
                    </div>

                    {/* User Information */}
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.name || 'Team member'}
                            </p>

                            <p className="text-xs text-slate-500">
                                {String(
                                    user?.role?.name ||
                                    user?.role?.key ||
                                    'Workspace member'
                                )}
                            </p>
                        </div>

                        {/* User Avatar */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                            {user?.name?.slice(0, 1).toUpperCase() || 'U'}
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={signOut}
                            title="Sign out"
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// Brand Component
function Brand() {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="rounded-xl bg-brand-600 p-2.5 text-white">
                <Activity size={21} />
            </div>

            <div>
                <p className="text-lg font-bold tracking-tight text-ink">
                    DealDesk
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">
                    Sales workspace
                </p>
            </div>
        </div>
    );
}

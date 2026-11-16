import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { api, getErrorMessage, unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage, ChatThread, Deal } from '../types';
import {
    Button,
    Card,
    EmptyState,
    ErrorNotice,
    Loading,
    PageHeader,
} from '../components/ui';

const socketUrl =
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function Chat() {
    const { token, user } = useAuth();

    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selected, setSelected] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);

    const selectedId = selected?._id;

    // Socket.IO connection
    useEffect(() => {
        if (!token) return;

        const s = io(socketUrl, {
            transports: ['websocket', 'polling'],
            auth: { token },
        });

        setSocket(s);

        s.on('connect_error', (e) =>
            setError(
                `Live chat connection: ${e.message}. REST chat remains available.`
            )
        );

        s.on('newMessage', (m: ChatMessage) => {
            setMessages((prev) =>
                prev.some((x) => x._id === m._id) ? prev : [...prev, m]
            );
        });

        s.on('chat.error', (v: { message: string }) => setError(v.message));

        return () => {
            s.disconnect();
            setSocket(null);
        };
    }, [token]);

    // Load chat threads
    async function loadThreads() {
        setBusy(true);
        setError('');

        try {
            const data =
                unwrap<ChatThread[]>(await api.get('/chat/my-threads')) || [];

            setThreads(data);

            if (!selectedId && data.length) {
                setSelected(data[0]);
            }
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        void loadThreads();
    }, []);

    // Load messages for selected thread
    useEffect(() => {
        if (!selectedId) return;

        let active = true;

        (async () => {
            try {
                const t = await api.get(`/chat/deal/${dealId(selected!)}`);

                const thread = unwrap<{ _id: string }>(t);

                if (!active) return;

                const threadId = thread?._id || selectedId;

                const res = await api.get(`/chat/${threadId}/messages`);

                if (active) {
                    setMessages(unwrap<ChatMessage[]>(res) || []);
                }

                socket?.emit('joinDealChat', {
                    dealId: dealId(selected!),
                });

                await api.post(`/chat/${threadId}/read`);
            } catch (e) {
                if (active) {
                    setError(getErrorMessage(e));
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [selectedId, socket]);

    // Active deal name
    const activeDeal = useMemo(
        () =>
            selected && typeof selected.dealId === 'object'
                ? (selected.dealId as Deal).title
                : 'Deal conversation',
        [selected]
    );

    // Send message
    async function send(e: React.FormEvent) {
        e.preventDefault();

        if (!selected || !draft.trim()) return;

        const text = draft.trim();

        setDraft('');

        try {
            const threadId = selected._id;

            if (socket?.connected) {
                socket.emit('sendMessage', {
                    threadId,
                    message: text,
                });
            } else {
                const res = await api.post('/chat/message', {
                    dealId: dealId(selected),
                    message: text,
                });

                const sent = unwrap<ChatMessage>(res);

                setMessages((prev) => [...prev, sent]);
            }
        } catch (e) {
            setError(getErrorMessage(e));
            setDraft(text);
        }
    }

    return (
        <>
            <PageHeader
                title="Conversations"
                description="Keep deal discussions connected to the right opportunity."
                action={
                    <Button variant="secondary" onClick={loadThreads}>
                        <RefreshCw size={15} />
                        Refresh
                    </Button>
                }
            />

            {error && (
                <div className="mb-4">
                    <ErrorNotice message={error} />
                </div>
            )}

            <Card className="overflow-hidden !p-0">
                <div className="grid min-h-[560px] md:grid-cols-[280px_1fr]">

                    {/* Thread Sidebar */}
                    <aside className="border-b border-slate-100 md:border-b-0 md:border-r">
                        <div className="border-b border-slate-100 p-4">
                            <p className="font-bold text-ink">Your threads</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Conversations you can access
                            </p>
                        </div>

                        {busy ? (
                            <Loading />
                        ) : threads.length === 0 ? (
                            <EmptyState
                                title="No conversations"
                                message="Open a deal chat to start a thread."
                            />
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto p-2">
                                {threads.map((t) => (
                                    <button
                                        key={t._id}
                                        onClick={() => {
                                            setSelected(t);
                                            setMessages([]);
                                        }}
                                        className={`mb-1 w-full rounded-xl p-3 text-left transition ${selectedId === t._id
                                            ? 'bg-brand-50'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {typeof t.dealId === 'object'
                                                ? (t.dealId as Deal).title
                                                : 'Deal conversation'}
                                        </p>

                                        <p className="mt-1 truncate text-xs text-slate-400">
                                            Thread {t._id}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Chat Section */}
                    <section className="flex min-h-[560px] flex-col">

                        {/* Chat Header */}
                        <div className="border-b border-slate-100 p-4">
                            <p className="font-bold text-ink">
                                {selected ? activeDeal : 'Select a conversation'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {selected
                                    ? 'Messages are synced with your DealDesk backend.'
                                    : 'Choose a thread from the left.'}
                            </p>
                        </div>

                        {!selected ? (
                            <div className="flex flex-1 items-center justify-center">
                                <EmptyState
                                    title="Welcome to chat"
                                    message="Select a deal conversation to view messages."
                                />
                            </div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                                    {messages.length === 0 ? (
                                        <EmptyState
                                            title="No messages yet"
                                            message="Send the first message in this conversation."
                                        />
                                    ) : (
                                        messages.map((m) => {
                                            const sender =
                                                typeof m.senderId === 'object'
                                                    ? m.senderId.name
                                                    : 'Team member';

                                            const own =
                                                typeof m.senderId === 'object' &&
                                                m.senderId._id === user?.id;

                                            return (
                                                <div
                                                    key={m._id}
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${own
                                                        ? 'ml-auto bg-brand-600 text-white'
                                                        : 'bg-white text-slate-700 shadow-sm'
                                                        }`}
                                                >
                                                    <p>{m.message}</p>

                                                    <p
                                                        className={`mt-1 text-[10px] ${own ? 'text-blue-100' : 'text-slate-400'
                                                            }`}
                                                    >
                                                        {sender || 'Team member'} ·{' '}
                                                        {m.createdAt
                                                            ? new Date(m.createdAt).toLocaleString()
                                                            : ''}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Message Input */}
                                <form
                                    onSubmit={send}
                                    className="flex gap-2 border-t border-slate-100 p-3"
                                >
                                    <input
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="Write a message..."
                                        className="min-w-0 flex-1 rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-100"
                                    />

                                    <Button type="submit" disabled={!draft.trim()}>
                                        <ArrowUp size={16} />
                                        Send
                                    </Button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </Card>
        </>
    );
}

// Extract deal ID from chat thread
function dealId(t: ChatThread) {
    return typeof t.dealId === 'string'
        ? t.dealId
        : (t.dealId as Deal)?._id || '';
}

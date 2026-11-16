import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import Approvals from './pages/Approvals';
import Chat from './pages/Chat';
import Invoices from './pages/Invoices';

function Protected() {
    const { token } = useAuth();

    return token ? <AppLayout /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Protected />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/invoices" element={<Invoices />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
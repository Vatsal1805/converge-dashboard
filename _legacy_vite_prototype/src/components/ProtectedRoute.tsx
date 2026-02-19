import { useAuth } from '@/context/AuthContext';
import { Role } from '@/data/types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, currentRole } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
        // Determine fallback based on role to avoid infinite redirects
        // If a team lead tries to access founder page, send them to team lead dashboard (root)
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

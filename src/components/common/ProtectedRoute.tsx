import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext, type UserRole } from '../../contexts/AuthContext';

type ProtectedRouteProps = PropsWithChildren & {
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { role, isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role === null) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectPath = role === 'user' ? '/author' : '/reviewer';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
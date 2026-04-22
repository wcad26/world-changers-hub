import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function MemberProtectedRoute({ 
  children, 
  redirectTo = '/auth/member' 
}: MemberProtectedRouteProps) {
  const { user, loading, initialized, isMember, isRegionalAdmin } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!user || (!isMember() && !isRegionalAdmin())) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
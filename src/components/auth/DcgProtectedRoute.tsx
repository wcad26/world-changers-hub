import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DcgProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const NoDcgAssociation: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, getAvailablePortals } = useAuth();
  const portals = getAvailablePortals();
  const hasMultiplePortals = portals.length > 1;

  const handleBack = () => {
    if (hasMultiplePortals) {
      navigate('/portal-selector');
    } else if (portals[0] === 'super') {
      navigate('/admin/super/dashboard');
    } else if (portals[0] === 'regional') {
      navigate('/admin/regional/dashboard');
    } else if (portals[0] === 'member') {
      navigate('/member/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No DCG Association</CardTitle>
          <CardDescription>
            You don't belong to a DCG yet. Please ask your regional admin to add you to one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={handleBack} variant="default" className="w-full">
            Back to my portals
          </Button>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const DcgProtectedRoute: React.FC<DcgProtectedRouteProps> = ({
  children,
  redirectTo = '/dcg-auth'
}) => {
  const { user, loading, initialized, hasRole, userDcg } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Allow if user is a dcg_admin (with session) or has any DCG association
  if (!hasRole('dcg_admin') && !userDcg) {
    return <NoDcgAssociation />;
  }

  return <>{children}</>;
};

export default DcgProtectedRoute;

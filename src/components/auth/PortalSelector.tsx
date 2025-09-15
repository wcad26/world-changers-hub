import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Users, MessageSquare, UserCheck, ArrowRight } from 'lucide-react';

const PortalSelector = () => {
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  const portals = [
    {
      id: 'super',
      title: 'Super Admin Portal',
      description: 'Global administration and oversight',
      icon: Crown,
      path: '/admin/super/dashboard',
      requiredRole: 'super_admin',
      bgColor: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20',
      iconColor: 'text-purple-600'
    },
    {
      id: 'regional',
      title: 'Regional Admin Portal',
      description: 'Regional branch management and operations',
      icon: Users,
      path: '/admin/regional/dashboard',
      requiredRole: 'regional_admin',
      bgColor: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-600'
    },
    {
      id: 'dcg',
      title: 'DCG Portal',
      description: 'Digital Community Group leadership',
      icon: MessageSquare,
      path: '/dcg/dashboard',
      requiredRole: 'dcg_admin',
      bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-600'
    },
    {
      id: 'member',
      title: 'Member Portal',
      description: 'Personal member dashboard and resources',
      icon: UserCheck,
      path: '/member/dashboard',
      requiredRole: 'member',
      bgColor: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20',
      iconColor: 'text-orange-600'
    }
  ];

  const availablePortals = portals.filter(portal => hasRole(portal.requiredRole as 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin'));

  const handlePortalSelect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Portal</h1>
          <p className="text-muted-foreground">Select the portal you want to access based on your role</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {availablePortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card key={portal.id} className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${portal.bgColor} border-0`}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-background/80 flex items-center justify-center">
                    <Icon className={`w-8 h-8 ${portal.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{portal.title}</CardTitle>
                  <CardDescription className="text-sm">{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handlePortalSelect(portal.path)}
                    className="w-full group"
                    variant="default"
                  >
                    Enter Portal
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availablePortals.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground mb-4">No portals available for your account.</p>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortalSelector;
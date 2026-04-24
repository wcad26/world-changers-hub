import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';
import { generateSlug } from '@/utils/slugUtils';

const RegionalAuth = () => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useRegions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Select Your Regional Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose your region to access the admin portal
              </p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">
              Regional Admin Portals
            </CardTitle>
            <CardDescription>
              Select your region to access the login page
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 mb-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : regions && regions.length > 0 ? (
                regions.map((region) => (
                  <Button 
                    key={region.id}
                    variant="modern" 
                    className="justify-between h-14 p-4" 
                    onClick={() => navigate(`/auth/regions/${generateSlug(region.name)}`)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{region.name}</div>
                      <div className="text-sm text-muted-foreground">{region.name} Regional Portal</div>
                    </div>
                    <ArrowRight size={16} />
                  </Button>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No regions available
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
            ← Back to main site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegionalAuth;
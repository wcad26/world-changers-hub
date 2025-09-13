import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, ArrowRight } from 'lucide-react';

const RegionalAuth = () => {
  const navigate = useNavigate();

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
              <Button 
                variant="modern" 
                className="justify-between h-14 p-4" 
                onClick={() => navigate('/auth/regions/wca-douala')}
              >
                <div className="text-left">
                  <div className="font-medium">WCA Douala</div>
                  <div className="text-sm text-muted-foreground">Douala Regional Portal</div>
                </div>
                <ArrowRight size={16} />
              </Button>
              
              <Button 
                variant="modern" 
                className="justify-between h-14 p-4" 
                onClick={() => navigate('/auth/regions/wca-eu')}
              >
                <div className="text-left">
                  <div className="font-medium">WCA EU</div>
                  <div className="text-sm text-muted-foreground">Europe Regional Portal</div>
                </div>
                <ArrowRight size={16} />
              </Button>
              
              <Button 
                variant="modern" 
                className="justify-between h-14 p-4" 
                onClick={() => navigate('/auth/regions/wca-usa')}
              >
                <div className="text-left">
                  <div className="font-medium">WCA USA</div>
                  <div className="text-sm text-muted-foreground">USA Regional Portal</div>
                </div>
                <ArrowRight size={16} />
              </Button>
              
              <Button 
                variant="modern" 
                className="justify-between h-14 p-4" 
                onClick={() => navigate('/auth/regions/wca-yaounde')}
              >
                <div className="text-left">
                  <div className="font-medium">WCA Yaounde</div>
                  <div className="text-sm text-muted-foreground">Yaounde Regional Portal</div>
                </div>
                <ArrowRight size={16} />
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-center text-muted-foreground mb-3">
                Other portals:
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => navigate('/auth/super')}>
                  <Shield size={16} className="mr-2" />
                  Super Admin Portal
                </Button>
              </div>
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
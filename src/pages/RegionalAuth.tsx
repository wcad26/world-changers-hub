import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';
import { generateSlug } from '@/utils/slugUtils';

/**
 * Regional portal selector.
 *
 * Pure navigation page. No auth subscriptions, no session checks,
 * no login/logout side effects. Just lists active regions and routes
 * the visitor to the corresponding regional login page.
 */
const RegionalAuth = () => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useRegions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-4">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Choose your region</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Select a region to open its login page
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Regional portals</CardTitle>
            <CardDescription>Each region has its own dedicated login page.</CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : regions && regions.length > 0 ? (
              <div className="grid gap-3">
                {regions.map((region) => (
                  <Button
                    key={region.id}
                    variant="outline"
                    className="justify-between h-14 px-4"
                    onClick={() => navigate(`/auth/regions/${generateSlug(region.name)}`)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{region.name}</div>
                      <div className="text-xs text-muted-foreground">Open login page</div>
                    </div>
                    <ArrowRight size={16} />
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No regions available
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ← Back to main site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegionalAuth;

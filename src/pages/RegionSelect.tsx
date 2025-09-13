import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight } from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';

const RegionSelect = () => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useRegions();

  const getRegionSlug = (code: string): string => {
    switch (code) {
      case 'WCAD': return 'wca-douala';
      case 'WCAEU': return 'wca-eu';
      case 'WCAUSA': return 'wca-usa';
      case 'WCAYDE': return 'wca-yaounde';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-wca-teal to-wca-teal/80 text-white">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                Select Your Region
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose your regional portal to continue
              </p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle>Regional Portals</CardTitle>
            <CardDescription>
              Select your region to access the regional admin portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading regions...</div>
            ) : (
              <div className="grid gap-3">
                {regions?.map((region) => {
                  const slug = getRegionSlug(region.code);
                  return (
                    <Button
                      key={region.id}
                      variant="outline"
                      className="justify-between h-14 p-4 hover:bg-wca-teal/5 hover:border-wca-teal transition-all"
                      onClick={() => navigate(`/auth/regions/${slug}`)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{region.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {region.code}
                        </div>
                      </div>
                      <ArrowRight size={16} />
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="flex-1 max-w-xs"
                  onClick={() => navigate('/auth/super')}
                >
                  Super Admin Portal
                </Button>
              </div>
            </div>
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

export default RegionSelect;
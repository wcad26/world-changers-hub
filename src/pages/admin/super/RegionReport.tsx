import React from 'react';
import { useParams, Link } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import RegionalDashboardView from '@/components/admin/regional/dashboard/RegionalDashboardView';

const RegionReport: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();

  const { data: region, isLoading } = useQuery({
    queryKey: ['super-region', regionId],
    queryFn: async () => {
      if (!regionId) return null;
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, code, is_active, regional_president')
        .eq('id', regionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 md:px-6 py-4 border-b border-border/30 bg-background/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/super/locations" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Regions
            </Link>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base md:text-lg font-semibold truncate">
                    {region?.name || 'Region not found'}
                  </h1>
                  {region?.code && <Badge variant="outline">{region.code}</Badge>}
                  {region && (
                    <Badge variant={region.is_active ? 'default' : 'secondary'}>
                      {region.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              )}
              {region?.regional_president && (
                <p className="text-xs text-muted-foreground truncate">
                  Regional President: {region.regional_president}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <RegionalDashboardView region={region ?? null} missingRegionMessage="This region could not be loaded." />
      </div>
    </div>
  );
};

export default RegionReport;

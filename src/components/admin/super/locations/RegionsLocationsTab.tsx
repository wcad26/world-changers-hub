import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Search, CheckCircle2, Users, Home, Plus } from 'lucide-react';
import { useAllRegions } from '@/hooks/useAllRegions';
import { GlassSection, GlassSectionHeader, GlassKPICard, GlassTableSkeleton } from '@/components/ui/GlassSection';
import CreateRegionGlassDialog from '@/components/admin/super/regions/CreateRegionGlassDialog';

const RegionsLocationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: regions, isLoading } = useAllRegions({ includeInactive: true });

  const { data: dcgsByRegion } = useQuery({
    queryKey: ['locations', 'dcg-count-by-region'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dcgs').select('region_id');
      if (error) throw error;
      return (data || []).reduce((acc, d) => {
        if (d.region_id) acc[d.region_id] = (acc[d.region_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  const { data: membersByRegion } = useQuery({
    queryKey: ['locations', 'member-count-by-region'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('region_id').neq('status', 'inactive');
      if (error) throw error;
      return (data || []).reduce((acc, m) => {
        if (m.region_id) acc[m.region_id] = (acc[m.region_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  const filtered = useMemo(() => {
    const list = regions || [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.code?.toLowerCase().includes(q) ||
      r.regional_president?.toLowerCase().includes(q)
    );
  }, [regions, searchTerm]);

  const totalRegions = regions?.length || 0;
  const activeRegions = regions?.filter(r => r.is_active).length || 0;
  const totalDcgsAcrossRegions = Object.values(dcgsByRegion || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassKPICard icon={<Globe className="h-5 w-5" />} label="Total Regions" value={totalRegions} isLoading={isLoading} />
        <GlassKPICard icon={<CheckCircle2 className="h-5 w-5" />} label="Active Regions" value={activeRegions} isLoading={isLoading} />
        <GlassKPICard icon={<Home className="h-5 w-5" />} label="Total DCGs" value={totalDcgsAcrossRegions} isLoading={isLoading || !dcgsByRegion} />
      </div>

      <GlassSection>
        <GlassSectionHeader
          icon={<Globe className="h-5 w-5" />}
          title="Regions Directory"
          description="All WCA regional centers across the organization"
        />

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, code, or president..."
              className="pl-9 bg-background/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Regional President</TableHead>
                  <TableHead>DCGs</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <GlassTableSkeleton columns={6} rows={4} />
                ) : filtered.length > 0 ? (
                  filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="outline">{r.code}</Badge></TableCell>
                      <TableCell>{r.regional_president || 'N/A'}</TableCell>
                      <TableCell>{dcgsByRegion?.[r.id] || 0}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {membersByRegion?.[r.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? 'default' : 'secondary'}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? 'No regions match your search.' : 'No regions found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </GlassSection>
    </div>
  );
};

export default RegionsLocationsTab;

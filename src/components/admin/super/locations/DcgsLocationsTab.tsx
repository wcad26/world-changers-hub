import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Home, Users, BarChart3, Search } from 'lucide-react';
import { useAllDcgs, DcgWithRegionAndLeader } from '@/hooks/useAllDcgs';
import { GlassSection, GlassSectionHeader, GlassKPICard, GlassTableSkeleton } from '@/components/ui/GlassSection';

const formatMeetingTime = (time: string | null) => {
  if (!time) return 'N/A';
  const [hour, minute] = time.split(':');
  const d = new Date();
  d.setHours(parseInt(hour, 10));
  d.setMinutes(parseInt(minute, 10));
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getLeaderName = (dcg: DcgWithRegionAndLeader) => {
  if (dcg.leader?.profiles) {
    return `${dcg.leader.profiles.last_name || ''} ${dcg.leader.profiles.first_name || ''}`.trim() || 'N/A';
  }
  return 'N/A';
};

const DcgsLocationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: dcgs, isLoading } = useAllDcgs();

  const filtered = useMemo(() => {
    const list = dcgs || [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.regions?.name || '').toLowerCase().includes(q) ||
      getLeaderName(d).toLowerCase().includes(q)
    );
  }, [dcgs, searchTerm]);

  const totalDcgs = dcgs?.length || 0;
  const totalMembers = (dcgs || []).reduce((s, d) => s + (d.member_count || 0), 0);
  const regionsWithDcgs = new Set((dcgs || []).map(d => d.region_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassKPICard icon={<Home className="h-5 w-5" />} label="Total DCGs" value={totalDcgs} isLoading={isLoading} />
        <GlassKPICard icon={<Users className="h-5 w-5" />} label="Total DCG Members" value={totalMembers} isLoading={isLoading} />
        <GlassKPICard icon={<BarChart3 className="h-5 w-5" />} label="Regions with DCGs" value={regionsWithDcgs} isLoading={isLoading} />
      </div>

      <GlassSection>
        <GlassSectionHeader
          icon={<Home className="h-5 w-5" />}
          title="DCG Directory"
          description="All Deeper Christian Groups across every region"
        />

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, region, leader, or location..."
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
                  <TableHead>Region</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Meeting Schedule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <GlassTableSkeleton columns={6} rows={4} />
                ) : filtered.length > 0 ? (
                  filtered.map((dcg) => (
                    <TableRow key={dcg.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{dcg.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{dcg.regions?.name || 'N/A'}</span>
                          {dcg.regions?.code && <Badge variant="outline" className="text-xs">{dcg.regions.code}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{getLeaderName(dcg)}</TableCell>
                      <TableCell>{dcg.location || 'N/A'}</TableCell>
                      <TableCell>{dcg.member_count || 0}</TableCell>
                      <TableCell>{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? 'No DCGs match your search.' : 'No DCGs found.'}
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

export default DcgsLocationsTab;

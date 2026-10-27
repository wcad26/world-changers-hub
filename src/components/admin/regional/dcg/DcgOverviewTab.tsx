import React, { useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Users, Plus, Eye, Edit, Trash2, MoreVertical, AlertCircle, BarChart3, MapPin, Clock } from "lucide-react";
import { useDcgs, useDeleteDcg, DcgWithLeader } from "@/hooks/useDCGs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddDcgDialog } from "./AddDcgDialog";
import { EditDcgDialog } from "./EditDcgDialog";
import { useToast } from "@/hooks/use-toast";
import { useRegionalDcgStats } from "@/hooks/useRegionalStats";
import { useAuth } from "@/hooks/useAuth";
import { HeroCard, SearchBar, RoundButton, ChipRow, StatusPill } from "@/components/admin/regional/RegionalUI";

type StatusFilter = 'all' | 'active' | 'inactive';

const DcgOverviewTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isAddDcgDialogOpen, setAddDcgDialogOpen] = useState(false);
  const [isEditDcgDialogOpen, setEditDcgDialogOpen] = useState(false);
  const [selectedDcg, setSelectedDcg] = useState<DcgWithLeader | null>(null);
  const { data: dcgs, isLoading, isError, error } = useDcgs();
  const { data: regionalStats, isLoading: statsLoading } = useRegionalDcgStats();
  const deleteDcg = useDeleteDcg();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRegion } = useAuth();

  const dataLoading = isLoading || !userRegion;

  const filteredDcgs = (dcgs || []).filter(dcg => {
    const q = searchTerm.toLowerCase();
    const searchMatch = !q ||
      dcg.name.toLowerCase().includes(q) ||
      (dcg.leader?.profiles && `${dcg.leader.profiles.first_name} ${dcg.leader.profiles.last_name}`.toLowerCase().includes(q)) ||
      (dcg.location && dcg.location.toLowerCase().includes(q));
    const statusMatch = statusFilter === 'all' || (statusFilter === 'active' ? dcg.is_active : !dcg.is_active);
    return searchMatch && statusMatch;
  });

  const getLeaderName = (dcg: DcgWithLeader) => {
    if (dcg.leader?.profiles) {
      return `${dcg.leader.profiles.last_name || ''} ${dcg.leader.profiles.first_name || ''}`.trim() || 'N/A';
    }
    return "N/A";
  };

  const formatMeetingTime = (time: string | null) => {
    if (!time) return 'N/A';
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleDeleteDcg = async (dcgId: string, dcgName: string) => {
    if (window.confirm(`Are you sure you want to delete "${dcgName}"? This action cannot be undone.`)) {
      try {
        await deleteDcg.mutateAsync(dcgId);
        toast({ title: "DCG deleted", description: `${dcgName} has been successfully deleted.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete DCG. Please try again.", variant: "destructive" });
      }
    }
  };

  const totalDcgs = dcgs?.length || 0;
  const activeDcgs = (dcgs || []).filter(d => d.is_active).length;
  const totalMembers = regionalStats?.totalDcgMembers || 0;
  const avgAttendance = regionalStats?.averageAttendance || 0;
  const avgMembersPerDcg = totalDcgs > 0 ? Math.round(totalMembers / totalDcgs) : 0;

  const dcgMenu = (dcg: DcgWithLeader) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="DCG actions"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 border bg-popover shadow-md">
        <DropdownMenuItem onClick={() => navigate(`/admin/regional/dcg/${dcg.id}`)}>
          <Eye className="mr-2 h-4 w-4" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setSelectedDcg(dcg); setEditDcgDialogOpen(true); }}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => handleDeleteDcg(dcg.id, dcg.name)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5">
      {/* Search + add */}
      <div className="flex items-center gap-2">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search DCGs by name, leader, or location..." />
        <RoundButton icon={Plus} label="Add new DCG" primary onClick={() => setAddDcgDialogOpen(true)} />
      </div>

      {/* Status filter */}
      <ChipRow<StatusFilter>
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: 'all', label: 'All', count: totalDcgs },
          { value: 'active', label: 'Active', count: activeDcgs },
          { value: 'inactive', label: 'Inactive', count: totalDcgs - activeDcgs },
        ]}
      />

      {/* Hero summary */}
      <HeroCard
        eyebrow="DCG network"
        value={totalDcgs}
        sub={`${activeDcgs} active · ${totalMembers} members · avg ${avgMembersPerDcg} per group`}
        ring={avgAttendance}
        ringLabel="Avg attendance"
      />


      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to fetch DCGs."}
          </AlertDescription>
        </Alert>
      )}

      {/* Mobile / tablet card list */}
      <div className="space-y-3 lg:hidden">
        {dataLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))
        ) : !isError && filteredDcgs.length > 0 ? (
          filteredDcgs.map((dcg) => (
            <button
              key={dcg.id}
              type="button"
              onClick={() => navigate(`/admin/regional/dcg/${dcg.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 font-heading text-sm font-bold text-primary">
                {dcg.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{dcg.name}</p>
                  <StatusPill status={dcg.is_active ? 'active' : 'inactive'} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {getLeaderName(dcg)} · {dcg.member_count || 0} members
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {dcg.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{dcg.location}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}
                  </span>
                </div>
              </div>
              {dcgMenu(dcg)}
            </button>
          ))
        ) : !isError ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No DCGs match your search.' : 'No DCGs found. Create your first one!'}
          </div>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Meeting Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-5 w-full animate-pulse rounded-lg bg-muted" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !isError && filteredDcgs.length > 0 ? (
              filteredDcgs.map((dcg) => (
                <TableRow
                  key={dcg.id}
                  className="cursor-pointer transition-colors hover:bg-muted/20"
                  onClick={() => navigate(`/admin/regional/dcg/${dcg.id}`)}
                >
                  <TableCell className="font-medium">{dcg.name}</TableCell>
                  <TableCell>{getLeaderName(dcg)}</TableCell>
                  <TableCell>{dcg.location || 'N/A'}</TableCell>
                  <TableCell>{dcg.member_count || 0}</TableCell>
                  <TableCell>{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}</TableCell>
                  <TableCell><StatusPill status={dcg.is_active ? 'active' : 'inactive'} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>{dcgMenu(dcg)}</TableCell>
                </TableRow>
              ))
            ) : !isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {searchTerm ? 'No DCGs match your search.' : 'No DCGs found. Create your first one!'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AddDcgDialog open={isAddDcgDialogOpen} setOpen={setAddDcgDialogOpen} />
      <EditDcgDialog open={isEditDcgDialogOpen} setOpen={setEditDcgDialogOpen} dcg={selectedDcg} />
    </div>
  );
};

export default DcgOverviewTab;

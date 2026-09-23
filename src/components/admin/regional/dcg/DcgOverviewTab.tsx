
import React, { useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Users, PlusCircle, Search, Eye, Edit, Trash2, MoreHorizontal, AlertCircle, BarChart3 } from "lucide-react";
import { useDcgs, useDeleteDcg, DcgWithLeader } from "@/hooks/useDCGs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddDcgDialog } from "./AddDcgDialog";
import { EditDcgDialog } from "./EditDcgDialog";
import { useToast } from "@/hooks/use-toast";
import { useRegionalDcgStats, useRecentDcgActivity } from "@/hooks/useRegionalStats";
import { useAuth } from "@/hooks/useAuth";
import { GlassSection, GlassSectionHeader, GlassKPICard, GlassTableSkeleton } from "@/components/ui/GlassSection";

const DcgOverviewTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredDcgs = (dcgs || []).filter(dcg =>
    dcg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dcg.leader?.profiles && `${dcg.leader.profiles.first_name} ${dcg.leader.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dcg.location && dcg.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
  const totalMembers = regionalStats?.totalDcgMembers || 0;
  const avgAttendance = regionalStats?.averageAttendance || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassKPICard
          icon={<Home className="h-5 w-5" />}
          label="Total DCGs"
          value={totalDcgs}
          isLoading={dataLoading}
          tone="violet"
        />
        <GlassKPICard
          icon={<Users className="h-5 w-5" />}
          label="Total Members"
          value={totalMembers}
          isLoading={dataLoading || statsLoading}
          tone="primary"
        />
        <GlassKPICard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Avg Attendance"
          value={avgAttendance > 0 ? `${avgAttendance}%` : 'N/A'}
          isLoading={dataLoading || statsLoading}
          tone="blue"
        />
      </div>

      {/* DCG Directory */}
      <GlassSection>
        <GlassSectionHeader
          icon={<Home className="h-5 w-5" />}
          title="DCG Directory"
          description="Complete listing of all DCGs in your region"
          action={
            <Button onClick={() => setAddDcgDialogOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New DCG
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search DCGs by name, leader, or location..."
              className="pl-9 bg-background/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to fetch DCGs."}
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Meeting Schedule</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <GlassTableSkeleton columns={6} rows={4} />
                ) : !isError && filteredDcgs.length > 0 ? (
                  filteredDcgs.map((dcg) => (
                    <TableRow
                      key={dcg.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/regional/dcg/${dcg.id}`)}
                    >
                      <TableCell className="font-medium">{dcg.name}</TableCell>
                      <TableCell>{getLeaderName(dcg)}</TableCell>
                      <TableCell>{dcg.location || 'N/A'}</TableCell>
                      <TableCell>{dcg.member_count || 0}</TableCell>
                      <TableCell>{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                            <DropdownMenuItem onClick={() => navigate(`/admin/regional/dcg/${dcg.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDcg(dcg);
                              setEditDcgDialogOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteDcg(dcg.id, dcg.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : !isError && filteredDcgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? 'No DCGs match your search.' : 'No DCGs found. Create your first one!'}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </GlassSection>

      <AddDcgDialog open={isAddDcgDialogOpen} setOpen={setAddDcgDialogOpen} />
      <EditDcgDialog open={isEditDcgDialogOpen} setOpen={setEditDcgDialogOpen} dcg={selectedDcg} />
    </div>
  );
};
export default DcgOverviewTab;

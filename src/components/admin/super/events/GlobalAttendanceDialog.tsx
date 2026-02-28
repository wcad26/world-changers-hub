import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllMembers, MemberWithDetails } from "@/hooks/useAllMembers";
import { useCreateAttendanceEvent, useSaveAttendance } from "@/hooks/useAttendance";
import { useExistingEventAttendance } from "@/hooks/useExistingEventAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserCheck, Save, Loader2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface GlobalAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    start_datetime: string;
    region_id?: string | null;
  };
}

export function GlobalAttendanceDialog({ isOpen, onClose, event }: GlobalAttendanceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: members, isLoading: loadingMembers } = useAllMembers({ searchTerm });
  
  // Check for existing attendance using a custom query for global events
  const [existingAttendance, setExistingAttendance] = useState<{
    attendanceEventId: string | null;
    presentMemberIds: string[];
    totalPresentCount: number;
  }>({ attendanceEventId: null, presentMemberIds: [], totalPresentCount: 0 });
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!isOpen || !event.id) return;
    
    const fetchExisting = async () => {
      setLoadingExisting(true);
      try {
        // Find attendance_event linked to this source event
        const { data: attendanceEvents } = await supabase
          .from('attendance_events')
          .select('id')
          .eq('source_event_id', event.id);

        if (attendanceEvents && attendanceEvents.length > 0) {
          const aeId = attendanceEvents[0].id;
          const { data: records } = await supabase
            .from('attendance_records')
            .select('member_id, is_present')
            .eq('event_id', aeId)
            .eq('is_present', true);

          const presentIds = records?.map(r => r.member_id) || [];
          setExistingAttendance({
            attendanceEventId: aeId,
            presentMemberIds: presentIds,
            totalPresentCount: presentIds.length,
          });
        } else {
          setExistingAttendance({ attendanceEventId: null, presentMemberIds: [], totalPresentCount: 0 });
        }
      } catch (err) {
        console.error('Error fetching existing attendance:', err);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExisting();
  }, [isOpen, event.id]);

  useEffect(() => {
    if (isOpen && existingAttendance.presentMemberIds.length > 0 && !isInitialized) {
      setPresentMembers(new Set(existingAttendance.presentMemberIds));
      setIsInitialized(true);
    }
  }, [isOpen, existingAttendance, isInitialized]);

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setPresentMembers(new Set());
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredMembers = useMemo(() => {
    return members || [];
  }, [members]);

  const handleToggleMember = (memberId: string) => {
    const newSet = new Set(presentMembers);
    if (newSet.has(memberId)) newSet.delete(memberId);
    else newSet.add(memberId);
    setPresentMembers(newSet);
  };

  const handleSelectAll = () => {
    if (presentMembers.size === filteredMembers.length) {
      setPresentMembers(new Set());
    } else {
      setPresentMembers(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const handleRecordAttendance = async () => {
    if (!filteredMembers.length) return;

    setIsRecording(true);
    try {
      let attendanceEventId = existingAttendance.attendanceEventId;

      if (!attendanceEventId) {
        // Create attendance event - use null region_id for global events
        const { data: newAe, error: aeError } = await supabase
          .from('attendance_events')
          .insert({
            name: `Attendance - ${event.name}`,
            event_date: new Date(event.start_datetime).toISOString().split('T')[0],
            region_id: event.region_id || null,
            description: `Attendance tracking for ${event.name}`,
            source_event_id: event.id,
            created_by: user?.id,
          })
          .select()
          .single();

        if (aeError) throw aeError;
        attendanceEventId = newAe.id;
      }

      // Delete existing records for this attendance event, then re-insert
      await supabase.from('attendance_records').delete().eq('event_id', attendanceEventId);

      // Only create records for members who are marked present
      const presentMemberIds = Array.from(presentMembers);
      if (presentMemberIds.length > 0) {
        const records = presentMemberIds.map(memberId => ({
          event_id: attendanceEventId!,
          member_id: memberId,
          is_present: true,
          recorded_by: user?.id,
        }));

        // Insert in batches of 100
        for (let i = 0; i < records.length; i += 100) {
          const batch = records.slice(i, i + 100);
          const { error } = await supabase.from('attendance_records').insert(batch);
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: `Attendance recorded: ${presentMembers.size} members marked present.`,
      });
      onClose();
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      toast({ title: "Error", description: error.message || "Failed to record attendance.", variant: "destructive" });
    } finally {
      setIsRecording(false);
    }
  };

  const getDisplayName = (member: MemberWithDetails) => {
    if (member.profiles?.first_name && member.profiles?.last_name) {
      return `${member.profiles.last_name} ${member.profiles.first_name}`;
    }
    return member.profiles?.email || member.member_id || 'Unknown';
  };

  const isLoading = loadingMembers || loadingExisting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Record Attendance - {event.name}
          </DialogTitle>
          <DialogDescription>
            Select members from all regions who were present. Use the search to find specific members.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {existingAttendance.totalPresentCount > 0 && (
            <Alert className="bg-primary/10 border-primary/20">
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>{existingAttendance.totalPresentCount}</strong> attendee{existingAttendance.totalPresentCount !== 1 ? 's' : ''} already recorded.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by name, email, member ID..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" onClick={handleSelectAll} disabled={isLoading || !filteredMembers.length}>
              {presentMembers.size === filteredMembers.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">
              <strong>{presentMembers.size}</strong> members selected as present
              {filteredMembers.length > 0 && ` (showing ${filteredMembers.length} members)`}
            </p>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Present</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No members match your search" : "No members found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map(member => (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox checked={presentMembers.has(member.id)} onCheckedChange={() => handleToggleMember(member.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{getDisplayName(member)}</TableCell>
                      <TableCell className="text-sm">{member.member_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{member.regions?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{member.member_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isRecording}>Cancel</Button>
            <Button onClick={handleRecordAttendance} disabled={isRecording || isLoading}>
              {isRecording ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : <><Save className="mr-2 h-4 w-4" />{existingAttendance.totalPresentCount > 0 ? 'Update Attendance' : 'Record Attendance'}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

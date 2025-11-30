import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMembers, MemberWithProfile } from "@/hooks/useMembers";
import { useCreateAttendanceEvent, useSaveAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserCheck, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AttendanceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    start_datetime: string;
  };
}

export function AttendanceManagementDialog({ isOpen, onClose, event }: AttendanceManagementDialogProps) {
  const { userRegion } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);

  const { data: members, isLoading: loadingMembers, error: membersError } = useMembers(userRegion?.id);
  const createAttendanceEvent = useCreateAttendanceEvent();
  const saveAttendance = useSaveAttendance();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const searchLower = searchTerm.toLowerCase();
      const firstName = member.profiles?.first_name?.toLowerCase() || '';
      const lastName = member.profiles?.last_name?.toLowerCase() || '';
      const email = member.profiles?.email?.toLowerCase() || '';
      const memberId = member.member_id?.toLowerCase() || '';
      
      return firstName.includes(searchLower) || 
             lastName.includes(searchLower) || 
             email.includes(searchLower) ||
             memberId.includes(searchLower);
    });
  }, [members, searchTerm]);

  const handleToggleMember = (memberId: string) => {
    const newPresentMembers = new Set(presentMembers);
    if (newPresentMembers.has(memberId)) {
      newPresentMembers.delete(memberId);
    } else {
      newPresentMembers.add(memberId);
    }
    setPresentMembers(newPresentMembers);
  };

  const handleSelectAll = () => {
    if (presentMembers.size === filteredMembers.length) {
      setPresentMembers(new Set());
    } else {
      setPresentMembers(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const handleRecordAttendance = async () => {
    if (!userRegion || !members) return;

    setIsRecording(true);
    try {
      // First create an attendance event for this general event
      const attendanceEventData = {
        name: `Attendance - ${event.name}`,
        event_date: new Date(event.start_datetime).toISOString().split('T')[0],
        region_id: userRegion.id,
        description: `Attendance tracking for ${event.name}`,
        source_event_id: event.id,
      };

      const attendanceEvent = await createAttendanceEvent.mutateAsync(attendanceEventData);

      // Create attendance records for all members
      const attendanceRecords = members.map(member => ({
        event_id: attendanceEvent.id,
        member_id: member.id,
        is_present: presentMembers.has(member.id),
      }));

      await saveAttendance.mutateAsync(attendanceRecords);

      toast({
        title: "Success",
        description: `Attendance recorded for ${presentMembers.size} present members and ${members.length - presentMembers.size} absent members.`,
      });

      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
    }
  };

  const getDisplayName = (member: MemberWithProfile) => {
    if (member.profiles?.first_name && member.profiles?.last_name) {
      return `${member.profiles.first_name} ${member.profiles.last_name}`;
    }
    return member.profiles?.email || member.member_id || 'Unknown Member';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Record Attendance - {event.name}
          </DialogTitle>
          <DialogDescription>
            Select members who were present at this event. Members not selected will be marked as absent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search and controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={loadingMembers || !filteredMembers.length}
            >
              {presentMembers.size === filteredMembers.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">
              <strong>{presentMembers.size}</strong> of <strong>{filteredMembers.length}</strong> members selected as present
              {searchTerm && ` (filtered from ${members?.length || 0} total members)`}
            </p>
          </div>

          {/* Members table */}
          <div className="flex-1 overflow-auto border rounded-md">
            {membersError && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>
                  Error loading members: {membersError.message}
                </AlertDescription>
              </Alert>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Present</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMembers ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No members match your search" : "No members found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={presentMembers.has(member.id)}
                          onCheckedChange={() => handleToggleMember(member.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(member)}
                      </TableCell>
                      <TableCell>{member.member_id}</TableCell>
                      <TableCell>{member.profiles?.email || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isRecording}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordAttendance} 
              disabled={isRecording || loadingMembers || !members?.length}
            >
              {isRecording ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Record Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
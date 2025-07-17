import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDcgMembers, type DcgMemberWithDetails } from "@/hooks/useDcgMembers";
import { useSaveDcgAttendance } from "@/hooks/useDcgAttendance";
import { Search, UserCheck, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DcgAttendanceRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceEvent: {
    id: string;
    name: string;
    event_date: string;
  };
  dcgId: string;
}

export function DcgAttendanceRecordDialog({ 
  isOpen, 
  onClose, 
  attendanceEvent,
  dcgId 
}: DcgAttendanceRecordDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());
  
  const { data: dcgMembers, isLoading: loadingMembers, error: membersError } = useDcgMembers(dcgId);
  const saveAttendance = useSaveDcgAttendance();

  const filteredMembers = useMemo(() => {
    if (!dcgMembers) return [];
    return dcgMembers.filter(dcgMember => {
      if (!dcgMember.members) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const firstName = dcgMember.members.profiles?.first_name?.toLowerCase() || '';
      const lastName = dcgMember.members.profiles?.last_name?.toLowerCase() || '';
      const email = dcgMember.members.profiles?.email?.toLowerCase() || '';
      const memberId = dcgMember.members.member_id?.toLowerCase() || '';
      
      return firstName.includes(searchLower) || 
             lastName.includes(searchLower) || 
             email.includes(searchLower) ||
             memberId.includes(searchLower);
    });
  }, [dcgMembers, searchTerm]);

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
      setPresentMembers(new Set(filteredMembers.map(m => m.members!.id)));
    }
  };

  const handleRecordAttendance = async () => {
    if (!dcgMembers) return;

    try {
      // Create attendance records for all DCG members
      const attendanceRecords = dcgMembers
        .filter(dcgMember => dcgMember.members)
        .map(dcgMember => ({
          event_id: attendanceEvent.id,
          member_id: dcgMember.members!.id,
          is_present: presentMembers.has(dcgMember.members!.id),
        }));

      await saveAttendance.mutateAsync(attendanceRecords);
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  const getDisplayName = (dcgMember: DcgMemberWithDetails) => {
    if (!dcgMember.members) return 'Unknown Member';
    
    const member = dcgMember.members;
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
            Record Attendance - {attendanceEvent.name}
          </DialogTitle>
          <DialogDescription>
            Select DCG members who were present at this event. Members not selected will be marked as absent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search and controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search DCG members..."
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
              <strong>{presentMembers.size}</strong> of <strong>{filteredMembers.length}</strong> DCG members selected as present
              {searchTerm && ` (filtered from ${dcgMembers?.length || 0} total DCG members)`}
            </p>
          </div>

          {/* Members table */}
          <div className="flex-1 overflow-auto border rounded-md">
            {membersError && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>
                  Error loading DCG members: {membersError.message}
                </AlertDescription>
              </Alert>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Present</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>DCG Role</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No DCG members match your search" : "No DCG members found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((dcgMember) => (
                    <TableRow key={dcgMember.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={presentMembers.has(dcgMember.members!.id)}
                          onCheckedChange={() => handleToggleMember(dcgMember.members!.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(dcgMember)}
                      </TableCell>
                      <TableCell>{dcgMember.members?.member_id}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dcgMember.role === 'Leader' ? 'bg-primary/10 text-primary' :
                          dcgMember.role === 'Assistant' ? 'bg-secondary/10 text-secondary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {dcgMember.role}
                        </span>
                      </TableCell>
                      <TableCell>{dcgMember.members?.profiles?.email || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saveAttendance.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordAttendance} 
              disabled={saveAttendance.isPending || loadingMembers || !dcgMembers?.length}
            >
              {saveAttendance.isPending ? (
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
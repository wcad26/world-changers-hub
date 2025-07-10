import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useMembers } from "@/hooks/useMembers";
import { useSaveAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserCheck, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type AttendanceEvent = Database['public']['Tables']['attendance_events']['Row'];

interface RecordAttendanceDialogProps {
  event: AttendanceEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordAttendanceDialog({ event, open, onOpenChange }: RecordAttendanceDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [attendanceRecords, setAttendanceRecords] = React.useState<Record<string, boolean>>({});
  
  const { userRegion, user } = useAuth();
  const { data: members, isLoading } = useMembers(userRegion?.id);
  const saveAttendance = useSaveAttendance();
  const { toast } = useToast();

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
      const email = member.profiles?.email?.toLowerCase() || '';
      return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    });
  }, [members, searchTerm]);

  const handleAttendanceChange = (memberId: string, isPresent: boolean) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: isPresent
    }));
  };

  const handleBulkAction = (isPresent: boolean) => {
    const newRecords: Record<string, boolean> = {};
    filteredMembers.forEach(member => {
      newRecords[member.id] = isPresent;
    });
    setAttendanceRecords(prev => ({ ...prev, ...newRecords }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    const records = Object.entries(attendanceRecords).map(([memberId, isPresent]) => ({
      event_id: event.id,
      member_id: memberId,
      is_present: isPresent,
      recorded_by: user.id,
    }));

    if (records.length === 0) {
      toast({
        title: "No Records",
        description: "Please mark attendance for at least one member",
        variant: "destructive",
      });
      return;
    }

    saveAttendance.mutate(records, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Attendance recorded successfully",
        });
        onOpenChange(false);
        setAttendanceRecords({});
        setSearchTerm("");
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const presentCount = Object.values(attendanceRecords).filter(Boolean).length;
  const totalMarked = Object.keys(attendanceRecords).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Record Attendance - {event.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Date: {new Date(event.event_date).toLocaleDateString()}
          </p>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Search and Stats */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">
                  Present: {presentCount}
                </Badge>
                <Badge variant="outline">
                  Total Marked: {totalMarked}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction(true)}
                >
                  <UserCheck className="mr-1 h-3 w-3" />
                  Mark All Present
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction(false)}
                >
                  <UserX className="mr-1 h-3 w-3" />
                  Mark All Absent
                </Button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 min-h-0 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No members found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredMembers.map((member) => {
                  const isPresent = attendanceRecords[member.id] ?? false;
                  const isAbsent = attendanceRecords[member.id] === false;
                  
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        isPresent ? 'bg-green-50 border-green-200' : 
                        isAbsent ? 'bg-red-50 border-red-200' : 
                        'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </p>
                          {member.profiles?.email && (
                            <p className="text-sm text-muted-foreground">
                              {member.profiles.email}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={(checked) => 
                              handleAttendanceChange(member.id, checked === true)
                            }
                          />
                          <span className="text-sm">Present</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveAttendance.isPending || totalMarked === 0}
            >
              {saveAttendance.isPending ? "Saving..." : `Save Attendance (${totalMarked})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
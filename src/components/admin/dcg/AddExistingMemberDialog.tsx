import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Phone, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useAvailableRegionalMembers, useAddMemberToDcg } from '@/hooks/useDcgMembers';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

interface AddExistingMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
}

const AddExistingMemberDialog: React.FC<AddExistingMemberDialogProps> = ({
  open,
  onOpenChange,
  dcgId,
}) => {
  const { userRegion, userDcg } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<DcgMemberRole>('Member');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const regionId = userRegion?.id || userDcg?.region_id;
  const { data: availableMembers, isLoading } = useAvailableRegionalMembers(dcgId, regionId);
  const addMemberToDcg = useAddMemberToDcg();

  // Filter members based on search term
  const filteredMembers = availableMembers?.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const firstName = member.profiles?.first_name || '';
    const lastName = member.profiles?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    const email = member.profiles?.email?.toLowerCase() || '';
    const memberId = member.member_id?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) || 
           memberId.includes(searchLower) ||
           firstName.toLowerCase().includes(searchLower) ||
           lastName.toLowerCase().includes(searchLower);
  }) || [];

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedMembers.size === 0) return;

    const promises = Array.from(selectedMembers).map(memberId =>
      addMemberToDcg.mutateAsync({
        dcgId,
        memberId,
        role: selectedRole,
      })
    );

    try {
      await Promise.all(promises);
      setSelectedMembers(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

  // Show error if dcgId is missing
  if (!dcgId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Existing Members to DCG</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              DCG information not available. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Existing Members to DCG</DialogTitle>
          <DialogDescription>
            Select regional members to add to this DCG. These members are already registered in the regional portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Search and Role Selection */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as DcgMemberRole)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
                <SelectItem value="Leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Count and Actions */}
          {selectedMembers.size > 0 && (
            <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border">
              <span className="text-sm font-medium">
                {selectedMembers.size} member(s) selected
              </span>
              <Button
                onClick={handleAddSelected}
                disabled={addMemberToDcg.isPending}
                size="sm"
              >
                {addMemberToDcg.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Selected
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Members Table */}
          <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading available members...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {searchTerm ? 'No members found matching your search.' : 'No available members to add.'}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member.id)}
                            onChange={() => handleMemberToggle(member.id)}
                            className="rounded border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {member.profiles?.first_name && member.profiles?.last_name 
                              ? `${member.profiles.last_name} ${member.profiles.first_name}`
                              : member.profiles?.last_name || member.profiles?.first_name || 'Unknown Member'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.profiles?.phone ? (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-3 w-3 flex-shrink-0" />
                              {member.profiles.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.profiles?.address ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-2 h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{member.profiles.address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.member_type === 'member' ? 'default' : 'secondary'}>
                            {member.member_type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingMemberDialog;
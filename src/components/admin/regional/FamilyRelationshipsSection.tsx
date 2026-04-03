import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Plus, Trash2, Search, Users } from 'lucide-react';
import { useMemberRelationships, useCreateMemberRelationship, useDeleteMemberRelationship, FamilyRelationshipType } from '@/hooks/useMemberRelationships';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface FamilyRelationshipsSectionProps {
  memberId: string;
  readOnly?: boolean;
}

const relationshipLabels: Record<FamilyRelationshipType, string> = {
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  guardian: 'Guardian',
  other: 'Other',
};

const relationshipColors: Record<FamilyRelationshipType, string> = {
  spouse: 'bg-pink-100 text-pink-800 border-pink-200',
  parent: 'bg-blue-100 text-blue-800 border-blue-200',
  child: 'bg-green-100 text-green-800 border-green-200',
  sibling: 'bg-purple-100 text-purple-800 border-purple-200',
  guardian: 'bg-amber-100 text-amber-800 border-amber-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const FamilyRelationshipsSection: React.FC<FamilyRelationshipsSectionProps> = ({ memberId, readOnly = false }) => {
  const { userRegion } = useAuth();
  const { data: relationships, isLoading } = useMemberRelationships(memberId);
  const { data: allMembers } = useMembers(userRegion?.id);
  const createRelationship = useCreateMemberRelationship();
  const deleteRelationship = useDeleteMemberRelationship();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedType, setSelectedType] = useState<FamilyRelationshipType>('spouse');
  const [notes, setNotes] = useState('');

  const existingRelatedIds = relationships?.map(r => r.related_member_id) || [];
  const availableMembers = allMembers?.filter(m =>
    m.id !== memberId &&
    !existingRelatedIds.includes(m.id) &&
    (searchTerm === '' ||
      `${m.profiles?.last_name} ${m.profiles?.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.member_id.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleAdd = async () => {
    if (!selectedMemberId) return;
    await createRelationship.mutateAsync({
      memberId,
      relatedMemberId: selectedMemberId,
      relationshipType: selectedType,
      notes: notes || undefined,
    });
    setIsDialogOpen(false);
    setSelectedMemberId('');
    setSearchTerm('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this family relationship?')) {
      await deleteRelationship.mutateAsync({ id, memberId });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Family Relationships
          </CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(!relationships || relationships.length === 0) ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No family relationships recorded
          </div>
        ) : (
          <div className="space-y-2">
            {relationships.map(rel => (
              <div key={rel.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <Badge className={relationshipColors[rel.relationship_type as FamilyRelationshipType] || relationshipColors.other}>
                    {relationshipLabels[rel.relationship_type as FamilyRelationshipType] || rel.relationship_type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {rel.related_member?.profiles?.last_name} {rel.related_member?.profiles?.first_name}
                    </p>
                    {rel.related_member?.profiles?.phone && (
                      <p className="text-xs text-muted-foreground">{rel.related_member.profiles.phone}</p>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rel.id)}
                    disabled={deleteRelationship.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Family Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as FamilyRelationshipType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(relationshipLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search Member</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md">
                {availableMembers.slice(0, 20).map(member => (
                  <div
                    key={member.id}
                    className={`p-2 cursor-pointer hover:bg-accent text-sm border-b last:border-b-0 ${
                      selectedMemberId === member.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    <span className="font-medium">
                      {member.profiles?.last_name} {member.profiles?.first_name}
                    </span>
                    <span className="text-muted-foreground ml-2">({member.member_id})</span>
                  </div>
                ))}
                {availableMembers.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground text-center">No members found</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this relationship..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedMemberId || createRelationship.isPending}
              >
                {createRelationship.isPending ? 'Adding...' : 'Add Relationship'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FamilyRelationshipsSection;

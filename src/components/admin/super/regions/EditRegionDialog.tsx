
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Region } from '@/hooks/useAllRegions';

interface EditRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: Region | null;
}

interface MemberOption {
  id: string;
  name: string;
  member_id: string;
  profile_id: string | null;
}

const EditRegionDialog: React.FC<EditRegionDialogProps> = ({ open, onOpenChange, region }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    regional_president: '',
    established_date: ''
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [presidentPopoverOpen, setPresidentPopoverOpen] = useState(false);

  const { updateRegion } = useRegionMutations();

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name || '',
        code: region.code || '',
        description: region.description || '',
        address: region.address || '',
        contact_phone: region.contact_phone || '',
        contact_email: region.contact_email || '',
        regional_president: region.regional_president || '',
        established_date: region.established_date || ''
      });
    }
  }, [region]);

  // Fetch members for this region
  useEffect(() => {
    if (!region?.id || !open) return;
    
    const fetchMembers = async () => {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('members')
        .select('id, member_id, profile_id, profiles:profile_id(first_name, last_name)')
        .eq('region_id', region.id)
        .eq('member_type', 'member')
        .neq('status', 'inactive')
        .limit(5000);

      if (!error && data) {
        setMembers(
          data
            .map((m: any) => ({
              id: m.id,
              member_id: m.member_id,
              profile_id: m.profile_id,
              name: `${m.profiles?.last_name || ''} ${m.profiles?.first_name || ''}`.trim() || m.member_id,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [region?.id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region) return;
    
    const updates = {
      ...formData,
      code: formData.code.toUpperCase(),
      established_date: formData.established_date || null,
      updated_at: new Date().toISOString()
    };

    updateRegion.mutate({ id: region.id, updates }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.member_id.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (!region) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Region</DialogTitle>
          <DialogDescription>
            Update the details for {region.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Region Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., North America"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Region Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., NA"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the region..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Regional office address..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="region@wca.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Regional President</Label>
              <Popover open={presidentPopoverOpen} onOpenChange={setPresidentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                    type="button"
                  >
                    <span className="truncate">
                      {formData.regional_president || 'Select member...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search members..." 
                      value={memberSearch}
                      onValueChange={setMemberSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingMembers ? 'Loading...' : 'No members found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredMembers.slice(0, 50).map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.name}
                            onSelect={() => {
                              handleInputChange('regional_president', member.name);
                              setPresidentPopoverOpen(false);
                              setMemberSearch('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.regional_president === member.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">{member.name}</span>
                              <span className="text-xs text-muted-foreground">{member.member_id}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="established_date">Established Date</Label>
              <Input
                id="established_date"
                type="date"
                value={formData.established_date}
                onChange={(e) => handleInputChange('established_date', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRegion.isPending}>
              {updateRegion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Region
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRegionDialog;
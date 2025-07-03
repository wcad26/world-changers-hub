
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { Loader2 } from 'lucide-react';
import type { Region } from '@/hooks/useAllRegions';

interface EditRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: Region | null;
}

const EditRegionDialog: React.FC<EditRegionDialogProps> = ({ open, onOpenChange, region }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    regional_pastor: '',
    established_date: ''
  });

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
        regional_pastor: region.regional_pastor || '',
        established_date: region.established_date || ''
      });
    }
  }, [region]);

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
              <Label htmlFor="regional_pastor">Regional Pastor</Label>
              <Input
                id="regional_pastor"
                value={formData.regional_pastor}
                onChange={(e) => handleInputChange('regional_pastor', e.target.value)}
                placeholder="Pastor John Doe"
              />
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

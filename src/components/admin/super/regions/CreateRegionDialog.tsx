import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Loader2 } from 'lucide-react';

interface CreateRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateRegionDialog: React.FC<CreateRegionDialogProps> = ({ open, onOpenChange }) => {
  const { data: currencies } = useCurrencies();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency_code: 'XAF',
    description: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    regional_president: '',
    established_date: '',
  });

  const { createRegion } = useRegionMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const regionData = {
      ...formData,
      code: formData.code.toUpperCase(),
      currency_code: formData.currency_code || 'XAF',
      established_date: formData.established_date || null,
      is_active: true,
    };

    createRegion.mutate(regionData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          name: '',
          code: '',
          currency_code: 'XAF',
          description: '',
          address: '',
          contact_phone: '',
          contact_email: '',
          regional_president: '',
          established_date: '',
        });
      },
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Region</DialogTitle>
          <DialogDescription>
            Add a new regional branch to the WCA network. An isolated multi-tenant payment gateway profile is automatically provisioned for this region.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Region Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., WCA North America"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Region Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., WCANA"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency_code">Default Currency *</Label>
            <Select
              value={formData.currency_code}
              onValueChange={(val) => handleInputChange('currency_code', val)}
            >
              <SelectTrigger id="currency_code">
                <SelectValue placeholder="Select regional currency" />
              </SelectTrigger>
              <SelectContent>
                {(currencies?.length
                  ? currencies
                  : [
                      { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
                      { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
                      { code: 'USD', name: 'US Dollar', symbol: '$' },
                      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
                      { code: 'EUR', name: 'Euro', symbol: '€' },
                      { code: 'GBP', name: 'British Pound', symbol: '£' },
                    ]
                ).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the region..."
              rows={2}
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
              <Label htmlFor="regional_president">Regional President</Label>
              <Input
                id="regional_president"
                value={formData.regional_president}
                onChange={(e) => handleInputChange('regional_president', e.target.value)}
                placeholder="Assign after creation"
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
            <Button type="submit" disabled={createRegion.isPending}>
              {createRegion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Region
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRegionDialog;

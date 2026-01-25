import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CertificatePositionPicker } from './CertificatePositionPicker';
import { getCertificateTypeOptions } from '@/utils/certificateUtils';
import { useUpdateCertificateTemplate, type CertificateTemplate } from '@/hooks/useCertificates';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, ImageIcon } from 'lucide-react';

interface Position {
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface QRPosition {
  x: number;
  y: number;
  size: number;
}

interface EditCertificateTemplateDialogProps {
  template: CertificateTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCertificateTemplateDialog = ({
  template,
  open,
  onOpenChange
}: EditCertificateTemplateDialogProps) => {
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [namePosition, setNamePosition] = useState<Position>({ 
    x: 400, 
    y: 477, 
    fontSize: 38, 
    fontFamily: 'Georgia, serif', 
    color: '#1a365d' 
  });
  const [qrPosition, setQRPosition] = useState<QRPosition>({ x: 708, y: 591, size: 100 });
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string | null>(null);
  const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null);
  const [newTemplatePreviewUrl, setNewTemplatePreviewUrl] = useState<string | null>(null);

  const updateTemplate = useUpdateCertificateTemplate();

  // Load template data when dialog opens
  useEffect(() => {
    if (template && open) {
      setTemplateName(template.template_name);
      setTemplateType(template.template_type);
      
      // Parse position data from JSON
      if (template.name_position && typeof template.name_position === 'object' && !Array.isArray(template.name_position)) {
        const pos = template.name_position as unknown as Position;
        setNamePosition({
          x: pos.x || 400,
          y: pos.y || 477,
          fontSize: pos.fontSize || 38,
          fontFamily: pos.fontFamily || 'Georgia, serif',
          color: pos.color || '#1a365d'
        });
      }
      
      if (template.qr_position && typeof template.qr_position === 'object' && !Array.isArray(template.qr_position)) {
        const qr = template.qr_position as unknown as QRPosition;
        setQRPosition({
          x: qr.x || 708,
          y: qr.y || 591,
          size: qr.size || 100
        });
      }

      // Get public URL for template image
      if (template.template_url) {
        const { data } = supabase.storage
          .from('certificate-templates')
          .getPublicUrl(template.template_url);
        setTemplatePreviewUrl(data.publicUrl);
      }
      
      // Reset new file selection
      setNewTemplateFile(null);
      setNewTemplatePreviewUrl(null);
    }
  }, [template, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewTemplateFile(file);
      const url = URL.createObjectURL(file);
      setNewTemplatePreviewUrl(url);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    await updateTemplate.mutateAsync({
      templateId: template.id,
      file: newTemplateFile || undefined,
      templateData: {
        template_name: templateName,
        template_type: templateType,
        name_position: JSON.parse(JSON.stringify(namePosition)),
        qr_position: JSON.parse(JSON.stringify(qrPosition))
      }
    });

    onOpenChange(false);
  };

  const handleClose = () => {
    // Cleanup preview URLs
    if (newTemplatePreviewUrl) {
      URL.revokeObjectURL(newTemplatePreviewUrl);
    }
    setNewTemplateFile(null);
    setNewTemplatePreviewUrl(null);
    onOpenChange(false);
  };

  // Use new template preview if a new file is selected, otherwise use existing
  const displayUrl = newTemplatePreviewUrl || templatePreviewUrl;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Certificate Template</DialogTitle>
          <DialogDescription>
            Update the template settings, positions, and optionally replace the template image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-name">Template Name</Label>
            <Input
              id="edit-template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Foundation School 2025"
            />
          </div>

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-type">Certificate Type</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger id="edit-template-type">
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                {getCertificateTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Replace Template Image */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-file">Replace Template Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="edit-template-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              {newTemplateFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newTemplatePreviewUrl) {
                      URL.revokeObjectURL(newTemplatePreviewUrl);
                    }
                    setNewTemplateFile(null);
                    setNewTemplatePreviewUrl(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            {newTemplateFile && (
              <p className="text-sm text-muted-foreground">
                New image selected: {newTemplateFile.name}
              </p>
            )}
          </div>

          {/* Position Picker */}
          {displayUrl ? (
            <CertificatePositionPicker
              templateUrl={displayUrl}
              namePosition={namePosition}
              qrPosition={qrPosition}
              onNamePositionChange={setNamePosition}
              onQRPositionChange={setQRPosition}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/50">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading template image...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!templateName || !templateType || updateTemplate.isPending}
          >
            {updateTemplate.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
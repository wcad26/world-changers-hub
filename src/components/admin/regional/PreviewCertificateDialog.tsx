import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateCertificateImage } from '@/utils/certificateUtils';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { NamePosition } from '@/utils/certificateUtils';

interface QRPosition {
  x: number;
  y: number;
  size: number;
}

interface PreviewCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateUrl: string;
  namePosition: NamePosition;
  qrPosition: QRPosition;
  outputType?: 'certificate' | 'badge';
}

export const PreviewCertificateDialog = ({
  open,
  onOpenChange,
  templateUrl,
  namePosition,
  qrPosition,
  outputType = 'certificate'
}: PreviewCertificateDialogProps) => {
  const [sampleName, setSampleName] = useState('John Doe');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCertificateImage(
        templateUrl,
        sampleName,
        'CERT-PREVIEW-2025-ABC12',
        'PREVIEW123',
        window.location.origin,
        namePosition,
        qrPosition,
        { outputType, memberId: 'preview-member-id' }
      );

      
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      toast({
        title: 'Preview Generated',
        description: 'Certificate preview has been generated successfully'
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Preview Failed',
        description: 'Failed to generate certificate preview',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = 'certificate-preview.png';
    link.click();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Certificate</DialogTitle>
          <DialogDescription>
            Generate a sample certificate to verify positioning before bulk generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sample Recipient Name</Label>
            <Input
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              placeholder="Enter a name to preview"
            />
          </div>

          <Button 
            onClick={generatePreview} 
            disabled={isGenerating || !sampleName}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : (
              'Generate Preview'
            )}
          </Button>

          {previewUrl && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-muted/50">
                <img 
                  src={previewUrl} 
                  alt="Certificate Preview" 
                  className="w-full h-auto"
                />
              </div>
              <Button 
                onClick={downloadPreview}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Preview
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

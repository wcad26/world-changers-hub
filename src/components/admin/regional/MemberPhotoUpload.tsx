import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface MemberPhotoUploadProps {
  memberId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated?: (photoUrl: string) => void;
}

const MemberPhotoUpload: React.FC<MemberPhotoUploadProps> = ({
  memberId,
  currentPhotoUrl,
  onPhotoUpdated
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile || !userRegion) return;

    setIsUploading(true);
    try {
      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${memberId}_${Date.now()}.${fileExt}`;
      const filePath = `${userRegion.id}/${fileName}`;

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('member-photos')
            .remove([`${userRegion.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      // Update member record
      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: publicUrl })
        .eq('id', memberId);

      if (updateError) throw updateError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      
      onPhotoUpdated?.(publicUrl);
      setIsDialogOpen(false);
      setSelectedFile(null);

      toast({
        title: "Photo uploaded",
        description: "Member photo has been updated successfully"
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Member Photo</DialogTitle>
            <DialogDescription>
              Upload a new photo for this member. Supported formats: JPG, PNG, GIF (max 5MB).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {currentPhotoUrl && (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
                  <img 
                    src={currentPhotoUrl} 
                    alt="Current photo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button asChild variant="outline" className="w-full cursor-pointer">
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? selectedFile.name : 'Choose Photo'}
                    </span>
                  </Button>
                </label>
              </div>

              {selectedFile && (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={uploadPhoto}
                disabled={!selectedFile || isUploading}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberPhotoUpload;
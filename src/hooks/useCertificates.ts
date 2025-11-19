import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Certificate = Database['public']['Tables']['certificates']['Row'];
export type CertificateTemplate = Database['public']['Tables']['certificate_templates']['Row'];
export type NewCertificateTemplate = Database['public']['Tables']['certificate_templates']['Insert'];

// Fetch certificate templates
export const useCertificateTemplates = (regionId?: string) => {
  return useQuery({
    queryKey: ['certificate-templates', regionId],
    queryFn: async () => {
      let query = supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (regionId) {
        query = query.or(`region_id.eq.${regionId},region_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CertificateTemplate[];
    }
  });
};

// Upload certificate template
export const useUploadCertificateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      file, 
      templateData 
    }: { 
      file: File; 
      templateData: Omit<NewCertificateTemplate, 'template_url'> 
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${templateData.region_id || 'global'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create template record with position data
      const { data, error } = await supabase
        .from('certificate_templates')
        .insert({
          ...templateData,
          template_url: filePath
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({
        title: 'Template uploaded',
        description: 'Certificate template has been uploaded successfully with position configuration',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Generate certificates (client-side)
export const useGenerateCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      // This is now handled in the component with client-side generation
      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
};

// Fetch issued certificates
export const useIssuedCertificates = (regionId: string) => {
  return useQuery({
    queryKey: ['certificates', regionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          members (
            member_id,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Certificate[];
    }
  });
};

// Fetch certificate by verification code (public)
export const useCertificateByCode = (verificationCode: string) => {
  return useQuery({
    queryKey: ['certificate', verificationCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          regions (
            name,
            code
          )
        `)
        .eq('verification_code', verificationCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!verificationCode
  });
};

// Send certificate emails with automatic batching
export const useSendCertificateEmails = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      certificate_ids, 
      onProgress 
    }: { 
      certificate_ids: string[]; 
      onProgress?: (current: number, total: number) => void 
    }) => {
      const BATCH_SIZE = 20;
      const batches: string[][] = [];
      
      // Split into batches
      for (let i = 0; i < certificate_ids.length; i += BATCH_SIZE) {
        batches.push(certificate_ids.slice(i, i + BATCH_SIZE));
      }

      let totalSent = 0;
      let totalFailed = 0;
      const allResults: any[] = [];

      // Process each batch sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Update progress
        if (onProgress) {
          onProgress(i + 1, batches.length);
        }

        try {
          const { data: result, error } = await supabase.functions.invoke('send-certificate-emails', {
            body: { certificate_ids: batch }
          });

          if (error) throw error;

          totalSent += result.totalSent || 0;
          totalFailed += result.totalFailed || 0;
          allResults.push(...(result.results || []));
        } catch (error) {
          console.error(`Error processing batch ${i + 1}:`, error);
          totalFailed += batch.length;
          allResults.push(...batch.map(id => ({ id, error: 'Batch processing failed' })));
        }
      }

      return {
        totalSent,
        totalFailed,
        results: allResults,
        totalBatches: batches.length
      };
    },
    onSuccess: (data) => {
      if (data.totalFailed > 0) {
        toast({
          title: 'Emails sent with some failures',
          description: `Successfully sent ${data.totalSent} emails. ${data.totalFailed} failed. Check logs for details.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'All emails sent successfully',
          description: `Successfully sent ${data.totalSent} emails in ${data.totalBatches} batch${data.totalBatches > 1 ? 'es' : ''}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Email sending failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Delete certificate
export const useDeleteCertificate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .update({ is_active: false })
        .eq('id', certificateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({
        title: 'Certificate revoked',
        description: 'Certificate has been revoked successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Revocation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Reinstate certificate
export const useReinstateCertificate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .update({ is_active: true })
        .eq('id', certificateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({
        title: 'Certificate reinstated',
        description: 'Certificate has been reinstated and is now active',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reinstatement failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Permanently delete certificate (remove from database and storage)
export const usePermanentlyDeleteCertificate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificate: { id: string; certificate_url: string }) => {
      // Extract storage path from public URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/certificates/{path}
      const urlParts = certificate.certificate_url.split('/certificates/');
      const storagePath = urlParts[1];

      // Delete file from storage first
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('certificates')
          .remove([storagePath]);

        if (storageError) {
          console.error('Failed to delete certificate file from storage:', storageError);
          // Continue even if storage delete fails - we still want to remove the DB record
        }
      }

      // Delete certificate record from database
      const { error: dbError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificate.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({
        title: 'Certificate deleted permanently',
        description: 'Certificate has been permanently removed from the system',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Delete certificate template
export const useDeleteCertificateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // First, get the template to find the file path
      const { data: template, error: fetchError } = await supabase
        .from('certificate_templates')
        .select('template_url')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the file from storage
      if (template?.template_url) {
        const { error: storageError } = await supabase.storage
          .from('certificate-templates')
          .remove([template.template_url]);

        if (storageError) {
          console.error('Failed to delete template file from storage:', storageError);
        }
      }

      // Soft delete the template record
      const { error: deleteError } = await supabase
        .from('certificate_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({
        title: 'Template deleted',
        description: 'Certificate template has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Fetch member certificates
export const useMemberCertificates = (memberId: string) => {
  return useQuery({
    queryKey: ['member-certificates', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!memberId
  });
};

import { useState } from 'react';
import { Award, Upload, FileCheck, Send, Trash2, MoreHorizontal, Download, Eye, RotateCcw, XCircle, ImageIcon, Pencil } from 'lucide-react';
import { CertificatePositionPicker } from '@/components/admin/regional/CertificatePositionPicker';
import { PreviewCertificateDialog } from '@/components/admin/regional/PreviewCertificateDialog';
import { EditCertificateTemplateDialog } from '@/components/admin/regional/EditCertificateTemplateDialog';
import EnhancedRegionalAdminLayout from '@/components/admin/EnhancedRegionalAdminLayout';
import type { CertificateTemplate } from '@/hooks/useCertificates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { 
  useCertificateTemplates, 
  useUploadCertificateTemplate,
  useGenerateCertificates,
  useIssuedCertificates,
  useUnsentCertificates,
  useSentCertificates,
  useSendCertificateEmails,
  useDeleteCertificate,
  useDeleteCertificateTemplate,
  useReinstateCertificate,
  usePermanentlyDeleteCertificate
} from '@/hooks/useCertificates';
import { useMembers } from '@/hooks/useMembers';
import { useRegionalEvents } from '@/hooks/useEvents';
import { useEventAttendees } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCertificateTypeOptions, 
  downloadCertificate, 
  downloadCertificatesAsZip, 
  formatCertificateType,
  generateCertificateNumber,
  generateVerificationCode,
  getVerificationUrl,
  generateCertificateImage
} from '@/utils/certificateUtils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const Certificates = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string | null>(null);
  const [namePosition, setNamePosition] = useState<{ x: number; y: number; fontSize?: number; fontFamily?: string; color?: string }>({ 
    x: 400, 
    y: 477, 
    fontSize: 38, 
    fontFamily: 'Georgia, serif', 
    color: '#1a365d' 
  });
  const [qrPosition, setQRPosition] = useState({ x: 708, y: 591, size: 100 });
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Certificate generation state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [certificateType, setCertificateType] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  
  // Loading state for certificate generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  
  // Issued certificates state
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [selectedSentCertificates, setSelectedSentCertificates] = useState<string[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<CertificateTemplate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('all');
  const [certificateStatusFilter, setCertificateStatusFilter] = useState<string>('all');
  
  // Email sending progress state
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ current: 0, total: 0 });
  const [certificateToDeletePermanently, setCertificateToDeletePermanently] = useState<{
    id: string;
    certificate_url: string;
    certificate_number: string;
    recipient_name: string;
    certificate_type: string;
  } | null>(null);
  
  // Search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [sentCertificateSearchTerm, setSentCertificateSearchTerm] = useState('');
  
  // Queries
  const { data: templates, isLoading: templatesLoading } = useCertificateTemplates(profile?.region_id || undefined);
  const { data: members, isLoading: membersLoading } = useMembers(profile?.region_id || '');
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: issuedCertificates, isLoading: certificatesLoading } = useIssuedCertificates(profile?.region_id || '');
  const { data: unsentCertificates, isLoading: unsentCertificatesLoading } = useUnsentCertificates(profile?.region_id || '');
  const { data: sentCertificates, isLoading: sentCertificatesLoading } = useSentCertificates(profile?.region_id || '');
  const { data: eventAttendees, isLoading: attendeesLoading } = useEventAttendees(
    selectedEventId && selectedEventId !== 'none' ? selectedEventId : undefined,
    profile?.region_id || undefined
  );

  // Filter members based on event selection, search term, and certificate status
  const baseMembers = selectedEventId && selectedEventId !== 'none' ? eventAttendees || [] : members || [];
  
  // Get member IDs who already have certificates for the selected event
  const membersWithCertificatesForEvent = new Set(
    issuedCertificates
      ?.filter(cert => 
        selectedEventId && 
        selectedEventId !== 'none' && 
        cert.event_name === eventName
      )
      .map(cert => cert.member_id)
      .filter(Boolean) || []
  );
  
  const filteredMembers = baseMembers.filter((member) => {
    // Search filter
    const fullName = member.profiles?.first_name && member.profiles?.last_name
      ? `${member.profiles.last_name} ${member.profiles.first_name}`.toLowerCase()
      : (member.profiles?.email || '').toLowerCase();
    const memberId = (member.member_id || '').toLowerCase();
    const searchLower = memberSearchTerm.toLowerCase();
    const matchesSearch = !memberSearchTerm || fullName.includes(searchLower) || memberId.includes(searchLower);
    
    // Certificate status filter (only applies when an event is selected)
    if (selectedEventId && selectedEventId !== 'none' && certificateStatusFilter !== 'all') {
      const hasCertificate = membersWithCertificatesForEvent.has(member.id);
      if (certificateStatusFilter === 'pending' && hasCertificate) return false;
      if (certificateStatusFilter === 'generated' && !hasCertificate) return false;
    }

    return matchesSearch;
  });

  // Filter sent certificates by email status and search term
  const filteredSentCertificates = sentCertificates?.filter(cert => {
    const matchesStatus = emailStatusFilter === 'all' || cert.email_status === emailStatusFilter;
    const matchesSearch = !sentCertificateSearchTerm || 
      cert.recipient_name.toLowerCase().includes(sentCertificateSearchTerm.toLowerCase()) ||
      cert.recipient_email?.toLowerCase().includes(sentCertificateSearchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];
  
  // Mutations
  const uploadTemplate = useUploadCertificateTemplate();
  const generateCertificates = useGenerateCertificates();
  const sendEmails = useSendCertificateEmails();
  const deleteCertificate = useDeleteCertificate();
  const reinstateCertificate = useReinstateCertificate();
  const deleteTemplate = useDeleteCertificateTemplate();
  const permanentlyDeleteCertificate = usePermanentlyDeleteCertificate();

  const handleTemplateUpload = async () => {
    if (!templateFile || !templateName || !templateType) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    uploadTemplate.mutate(
      {
        file: templateFile,
        templateData: {
          template_name: templateName,
          template_type: templateType,
          region_id: profile?.region_id || null,
          created_by: profile?.id || null,
          name_position: namePosition,
          qr_position: qrPosition,
        },
      },
      {
        onSuccess: () => {
          setTemplateFile(null);
          setTemplateName('');
          setTemplateType('');
          setTemplatePreviewUrl(null);
        },
      }
    );
  };

  const handleTemplateFileChange = (file: File | null) => {
    setTemplateFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setTemplatePreviewUrl(url);
    } else {
      if (templatePreviewUrl) {
        URL.revokeObjectURL(templatePreviewUrl);
      }
      setTemplatePreviewUrl(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate.mutateAsync(templateId);
    setTemplateToDelete(null);
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    await deleteCertificate.mutateAsync(certificateId);
    setCertificateToDelete(null);
  };

  const handlePermanentDelete = async () => {
    if (!certificateToDeletePermanently) return;
    
    await permanentlyDeleteCertificate.mutateAsync({
      id: certificateToDeletePermanently.id,
      certificate_url: certificateToDeletePermanently.certificate_url
    });
    
    setCertificateToDeletePermanently(null);
  };

  const generateUniqueCode = async (type: 'certificate' | 'verification', regionId: string): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = type === 'certificate' 
        ? generateCertificateNumber(regionId)
        : generateVerificationCode();
      
      const { data, error } = await supabase
        .from('certificates')
        .select('id')
        .eq(type === 'certificate' ? 'certificate_number' : 'verification_code', code)
        .maybeSingle();
      
      if (!data && !error) return code;
    }
    
    throw new Error(`Failed to generate unique ${type} code after 5 attempts`);
  };

  const handleGenerateCertificates = async () => {
    if (!selectedTemplate || selectedMembers.length === 0 || !certificateType || !profile?.region_id) {
      toast({
        title: 'Missing information',
        description: 'Please select a template, members, and certificate type',
        variant: 'destructive',
      });
      return;
    }

    setShowGenerateDialog(false);
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedMembers.length });

    try {
      // Get template with public URL and positioning data
      const { data: template } = await supabase
        .from('certificate_templates')
        .select('template_url, name_position, qr_position')
        .eq('id', selectedTemplate)
        .single();

      if (!template) {
        toast({
          title: 'Error',
          description: 'Template not found',
          variant: 'destructive',
        });
        return;
      }

      // Get public URL for template
      const { data: { publicUrl: templatePublicUrl } } = supabase.storage
        .from('certificate-templates')
        .getPublicUrl(template.template_url);

      // Best-effort template accessibility check (doesn't abort on failure)
      console.debug('Using certificate template URL:', templatePublicUrl);
      try {
        const response = await fetch(templatePublicUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn('Template HEAD check failed, proceeding anyway:', response.status);
        }
      } catch (error) {
        console.warn('Template HEAD request failed, proceeding anyway:', error);
      }

      const baseUrl = window.location.origin;
      let successCount = 0;
      let failCount = 0;
      const failedMembers: Array<{ memberId: string; name: string; error: string }> = [];

      // Generate certificates one by one
      for (let i = 0; i < selectedMembers.length; i++) {
        const memberId = selectedMembers[i];
        let recipientName = 'Unknown';
        
        try {
          // Get member details
          const { data: member } = await supabase
            .from('members')
            .select('profiles(first_name, last_name, email)')
            .eq('id', memberId)
            .single();

          if (!member?.profiles) {
            failCount++;
            continue;
          }

          recipientName = `${member.profiles.last_name} ${member.profiles.first_name}`;
          const certificateNumber = await generateUniqueCode('certificate', profile.region_id);
          const verificationCode = await generateUniqueCode('verification', profile.region_id);

          // Get template positions
          const namePos = template.name_position as any || undefined;
          const qrPos = template.qr_position as any || undefined;

          // Generate certificate image using canvas with template positions
          const blob = await generateCertificateImage(
            templatePublicUrl,
            recipientName,
            certificateNumber,
            verificationCode,
            baseUrl,
            namePos,
            qrPos
          );

          // Upload to storage with organized path structure
          const filePath = `${profile.region_id}/${memberId}/${certificateNumber}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(filePath, blob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('certificates')
            .getPublicUrl(uploadData.path);

          // Create certificate record
          const { error: insertError } = await supabase
            .from('certificates')
            .insert({
              certificate_number: certificateNumber,
              certificate_type: certificateType,
              certificate_url: publicUrl,
              verification_code: verificationCode,
              recipient_name: recipientName,
              recipient_email: member.profiles.email,
              event_name: eventName || null,
              event_date: eventDate || null,
              issued_date: new Date().toISOString().split('T')[0],
              region_id: profile.region_id,
              member_id: memberId,
              issued_by: profile.id,
              qr_code_data: getVerificationUrl(verificationCode, baseUrl),
            });

          if (insertError) throw insertError;

          successCount++;
          setGenerationProgress({ current: i + 1, total: selectedMembers.length });
        } catch (error) {
          console.error(`Failed to generate certificate for member ${memberId}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedMembers.push({
            memberId,
            name: recipientName,
            error: errorMessage
          });
          failCount++;
        }
      }

      // Show final result
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Successfully generated ${successCount} certificate${successCount > 1 ? 's' : ''}`,
        });
        
        // Refresh certificate data
        await queryClient.invalidateQueries({ queryKey: ['certificates'] });
        
        // Switch to issued certificates tab
        setActiveTab('issued');
      }
      if (failCount > 0) {
        console.error('Certificate generation errors:', failedMembers);
        toast({
          title: 'Partial failure',
          description: `Failed to generate ${failCount} certificate(s). Check console for details.`,
          variant: 'destructive',
        });
      }

      // Reset form
      setSelectedMembers([]);
      setCertificateType('');
      setEventName('');
      setEventDate('');
      setSelectedEventId('');
    } catch (error) {
      console.error("Error generating certificates:", error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificates',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCertificates.length === 0) {
      toast({
        title: 'No certificates selected',
        description: 'Please select certificates to download',
        variant: 'destructive',
      });
      return;
    }

    const certificatesToDownload = issuedCertificates?.filter(cert => 
      selectedCertificates.includes(cert.id)
    ).map(cert => ({
      url: cert.certificate_url,
      filename: `${cert.certificate_number}.png`
    })) || [];

    await downloadCertificatesAsZip(certificatesToDownload);
  };

  const handleBulkEmail = async () => {
    if (selectedCertificates.length === 0) {
      toast({
        title: 'No certificates selected',
        description: 'Please select certificates to email',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmails(true);
    setEmailProgress({ current: 0, total: 0 });

    try {
      await sendEmails.mutateAsync({
        certificate_ids: selectedCertificates,
        onProgress: (current, total) => {
          setEmailProgress({ current, total });
        }
      });
      setSelectedCertificates([]);
    } catch (error) {
      console.error('Error sending emails:', error);
    } finally {
      setIsSendingEmails(false);
      setEmailProgress({ current: 0, total: 0 });
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleSelectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id) || []);
    }
  };

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificates(prev => 
      prev.includes(certificateId) 
        ? prev.filter(id => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const toggleSentCertificateSelection = (certificateId: string) => {
    setSelectedSentCertificates(prev => 
      prev.includes(certificateId) 
        ? prev.filter(id => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const handleResendEmails = async () => {
    if (selectedSentCertificates.length === 0) {
      toast({
        title: 'No certificates selected',
        description: 'Please select certificates to resend',
        variant: 'destructive',
      });
      return;
    }

    // Filter only active certificates with resendable statuses
    const resendableCertificates = sentCertificates?.filter(cert => 
      selectedSentCertificates.includes(cert.id) && 
      cert.is_active &&
      ['pending', 'failed', 'bounced'].includes(cert.email_status || 'pending')
    ).map(c => c.id) || [];

    if (resendableCertificates.length === 0) {
      toast({
        title: 'No resendable certificates',
        description: 'Selected certificates cannot be resent (already delivered or inactive)',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmails(true);
    setEmailProgress({ current: 0, total: 0 });

    try {
      await sendEmails.mutateAsync({
        certificate_ids: resendableCertificates,
        onProgress: (current, total) => {
          setEmailProgress({ current, total });
        }
      });
      setSelectedSentCertificates([]);
      toast({
        title: 'Success',
        description: `Resent ${resendableCertificates.length} certificate(s)`,
      });
    } catch (error) {
      console.error('Error resending emails:', error);
    } finally {
      setIsSendingEmails(false);
      setEmailProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadSentCertificates = async () => {
    if (selectedSentCertificates.length === 0) {
      toast({
        title: 'No certificates selected',
        description: 'Please select certificates to download',
        variant: 'destructive',
      });
      return;
    }

    const certificatesToDownload = sentCertificates?.filter(cert => 
      selectedSentCertificates.includes(cert.id)
    ).map(cert => ({
      url: cert.certificate_url,
      filename: `${cert.certificate_number}.png`
    })) || [];

    await downloadCertificatesAsZip(certificatesToDownload);
  };

  return (
    <EnhancedRegionalAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            Certificate Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate, manage, and distribute certificates for events and training programs
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => !isGenerating && setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" disabled={isGenerating}>Generate Certificates</TabsTrigger>
            <TabsTrigger value="templates" disabled={isGenerating}>Templates</TabsTrigger>
            <TabsTrigger value="issued" disabled={isGenerating}>Issued Certificates</TabsTrigger>
            <TabsTrigger value="sent" disabled={isGenerating}>Sent Certificates</TabsTrigger>
          </TabsList>

          {/* Generate Certificates Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Generate Certificates</CardTitle>
                <CardDescription>
                  Select a template, choose members, and generate certificates in bulk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template">Certificate Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.template_name} ({template.template_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cert-type">Certificate Type</Label>
                  <Select value={certificateType} onValueChange={setCertificateType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select certificate type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCertificateTypeOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="event-select">Associated Event (Optional)</Label>
                    <Select 
                      value={selectedEventId} 
                      onValueChange={(value) => {
                        setSelectedEventId(value);
                        setCertificateStatusFilter('all');
                        setSelectedMembers([]);
                        if (value === 'none') {
                          setEventName('');
                          setEventDate('');
                        } else {
                          const selectedEvent = events?.find(e => e.id === value);
                          if (selectedEvent) {
                            setEventName(selectedEvent.name);
                            setEventDate(format(new Date(selectedEvent.start_datetime), 'yyyy-MM-dd'));
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event or none" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Event</SelectItem>
                        {eventsLoading ? (
                          <SelectItem value="loading" disabled>Loading events...</SelectItem>
                        ) : events && events.length > 0 ? (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name} - {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-events" disabled>No events available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-date">Event Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-populated from event"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Certificate Status</Label>
                    <Select 
                      value={certificateStatusFilter} 
                      onValueChange={setCertificateStatusFilter}
                      disabled={!selectedEventId || selectedEventId === 'none'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Attendees</SelectItem>
                        <SelectItem value="pending">Pending Generation</SelectItem>
                        <SelectItem value="generated">Already Generated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Recipients</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAllMembers}
                      disabled={filteredMembers.length === 0}
                    >
                      {selectedMembers.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Search by name or member ID..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {selectedEventId && selectedEventId !== 'none' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <FileCheck className="h-4 w-4" />
                      <span>
                        {certificateStatusFilter === 'pending' 
                          ? `Showing ${filteredMembers.length} attendee${filteredMembers.length !== 1 ? 's' : ''} without certificates`
                          : certificateStatusFilter === 'generated'
                          ? `Showing ${filteredMembers.length} attendee${filteredMembers.length !== 1 ? 's' : ''} with certificates already generated`
                          : `Showing ${filteredMembers.length} attendee${filteredMembers.length !== 1 ? 's' : ''} marked present for this event`
                        }
                      </span>
                    </div>
                  )}
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {(membersLoading || attendeesLoading) ? (
                      <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                    ) : filteredMembers && filteredMembers.length > 0 ? (
                      <div className="divide-y">
                        {filteredMembers.map((member) => {
                          const fullName = member.profiles?.first_name && member.profiles?.last_name
                            ? `${member.profiles.last_name} ${member.profiles.first_name}`
                            : member.profiles?.email || 'Unknown';
                          
                          return (
                            <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                              <Checkbox
                                checked={selectedMembers.includes(member.id)}
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.member_id} • {member.member_type}
                                  {member.profiles?.email && (
                                    <> • {member.profiles.email}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedEventId && selectedEventId !== 'none' ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No attendees marked present for this event
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">No members found</div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedMembers.length} of {filteredMembers.length} selected
                  </p>
                </div>

                <Button 
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={!selectedTemplate || selectedMembers.length === 0 || !certificateType || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  <FileCheck className={cn("mr-2 h-5 w-5", isGenerating && "animate-spin")} />
                  {isGenerating 
                    ? `Generating... (${generationProgress.current}/${generationProgress.total})`
                    : `Generate ${selectedMembers.length} Certificate(s)`
                  }
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Template</CardTitle>
                <CardDescription>
                  Upload a certificate template image (PNG, JPG recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Conference Certificate 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCertificateTypeOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-file">Template File</Label>
                  <Input
                    id="template-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTemplateFileChange(e.target.files?.[0] || null)}
                  />
                </div>

                {templatePreviewUrl && (
                  <>
                    <CertificatePositionPicker
                      templateUrl={templatePreviewUrl}
                      namePosition={namePosition}
                      qrPosition={qrPosition}
                      onNamePositionChange={setNamePosition}
                      onQRPositionChange={setQRPosition}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreviewDialog(true)}
                      className="w-full"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Preview Certificate
                    </Button>
                  </>
                )}

                <Button 
                  onClick={handleTemplateUpload}
                  disabled={!templateFile || !templateName || !templateType || uploadTemplate.isPending}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadTemplate.isPending ? 'Uploading...' : 'Upload Template'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <p className="text-muted-foreground">Loading templates...</p>
                ) : templates && templates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.template_name}</CardTitle>
                      <CardDescription>{formatCertificateType(template.template_type)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setTemplateToEdit(template)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => setTemplateToDelete(template.id)}
                          disabled={deleteTemplate.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No templates found. Upload a template to get started.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unsent Certificates Tab */}
          <TabsContent value="issued" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>
                      View and manage certificates that have been issued but not yet sent via email
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleBulkDownload}
                      disabled={selectedCertificates.length === 0}
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      Download Selected ({selectedCertificates.length})
                    </Button>
                    <Button 
                      onClick={() => {
                        const activeCertificates = selectedCertificates.filter(id => 
                          unsentCertificates?.find(c => c.id === id)?.is_active
                        );
                        if (activeCertificates.length > 0) {
                          handleBulkEmail();
                        } else {
                          toast({
                            title: 'No active certificates selected',
                            description: 'Please select at least one active certificate',
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={selectedCertificates.length === 0 || isSendingEmails}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSendingEmails 
                        ? `Sending batch ${emailProgress.current}/${emailProgress.total}...` 
                        : `Email Selected (${selectedCertificates.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isSendingEmails && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sending emails in batches...</span>
                      <span>Batch {emailProgress.current} of {emailProgress.total}</span>
                    </div>
                    <Progress value={(emailProgress.current / emailProgress.total) * 100} />
                  </div>
                )}
                {certificatesLoading ? (
                  <p className="text-muted-foreground">Loading certificates...</p>
                ) : unsentCertificates && unsentCertificates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCertificates.length === unsentCertificates.length}
                            onCheckedChange={(checked) => {
                              setSelectedCertificates(checked ? unsentCertificates.map(c => c.id) : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unsentCertificates.map((cert) => (
                        <TableRow 
                          key={cert.id}
                          className={cn(
                            !cert.is_active && "opacity-60 bg-muted/50"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCertificates.includes(cert.id)}
                              onCheckedChange={() => toggleCertificateSelection(cert.id)}
                              disabled={!cert.is_active}
                            />
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {cert.recipient_name}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {formatCertificateType(cert.certificate_type)}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {cert.event_name || '-'}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {new Date(cert.issued_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.is_active ? "default" : "destructive"}>
                              {cert.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => downloadCertificate(cert.certificate_url, `${cert.certificate_number}.png`)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {cert.is_active ? (
                          <DropdownMenuItem
                            onClick={() => setCertificateToDelete(cert.id)}
                            disabled={deleteCertificate.isPending}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke (mark invalid)
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => reinstateCertificate.mutate(cert.id)}
                            disabled={reinstateCertificate.isPending}
                            className="text-green-600 focus:text-green-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reinstate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setCertificateToDeletePermanently({
                            id: cert.id,
                            certificate_url: cert.certificate_url,
                            certificate_number: cert.certificate_number,
                            recipient_name: cert.recipient_name,
                            certificate_type: cert.certificate_type
                          })}
                          disabled={permanentlyDeleteCertificate.isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No unsent certificates.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Certificates Tab */}
          <TabsContent value="sent" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Sent Certificates</CardTitle>
                    <CardDescription>
                      View and resend certificates that have been sent via email
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      placeholder="Search by name or email..."
                      value={sentCertificateSearchTerm}
                      onChange={(e) => setSentCertificateSearchTerm(e.target.value)}
                      className="w-[220px]"
                    />
                    <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Email Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="sent">📤 Sent</SelectItem>
                        <SelectItem value="delivered">✅ Delivered</SelectItem>
                        <SelectItem value="bounced">❌ Bounced</SelectItem>
                        <SelectItem value="failed">⚠️ Failed</SelectItem>
                        <SelectItem value="complained">⚠️ Complained</SelectItem>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline"
                      onClick={handleDownloadSentCertificates}
                      disabled={selectedSentCertificates.length === 0}
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      Download Selected ({selectedSentCertificates.length})
                    </Button>
                    <Button 
                      onClick={handleResendEmails}
                      disabled={selectedSentCertificates.length === 0 || isSendingEmails}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSendingEmails 
                        ? `Sending batch ${emailProgress.current}/${emailProgress.total}...` 
                        : `Resend Selected (${selectedSentCertificates.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isSendingEmails && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sending emails in batches...</span>
                      <span>Batch {emailProgress.current} of {emailProgress.total}</span>
                    </div>
                    <Progress value={(emailProgress.current / emailProgress.total) * 100} />
                  </div>
                )}
                {certificatesLoading ? (
                  <p className="text-muted-foreground">Loading certificates...</p>
                ) : filteredSentCertificates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedSentCertificates.length === filteredSentCertificates.filter(c => c.is_active).length && filteredSentCertificates.filter(c => c.is_active).length > 0}
                            onCheckedChange={(checked) => {
                              setSelectedSentCertificates(checked ? filteredSentCertificates.filter(c => c.is_active).map(c => c.id) : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Certificate Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSentCertificates.map((cert) => {
                        const emailStatus = cert.email_status || 'pending';
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'delivered': return 'default';
                            case 'sent': return 'secondary';
                            case 'bounced': return 'destructive';
                            case 'failed': return 'destructive';
                            case 'complained': return 'destructive';
                            default: return 'outline';
                          }
                        };
                        const getStatusLabel = (status: string) => {
                          switch (status) {
                            case 'delivered': return '✅ Delivered';
                            case 'sent': return '📤 Sent';
                            case 'bounced': return '❌ Bounced';
                            case 'failed': return '⚠️ Failed';
                            case 'complained': return '⚠️ Complained';
                            default: return '⏳ Pending';
                          }
                        };
                        
                        return (
                        <TableRow 
                          key={cert.id}
                          className={cn(
                            !cert.is_active && "opacity-60 bg-muted/50"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedSentCertificates.includes(cert.id)}
                              onCheckedChange={() => toggleSentCertificateSelection(cert.id)}
                              disabled={!cert.is_active}
                            />
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {cert.recipient_name}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {formatCertificateType(cert.certificate_type)}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {cert.event_name || '-'}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {new Date(cert.issued_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className={cn(!cert.is_active && "text-muted-foreground")}>
                            {cert.email_sent_at 
                              ? new Date(cert.email_sent_at).toLocaleDateString() + ' ' + new Date(cert.email_sent_at).toLocaleTimeString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(emailStatus)}>
                              {getStatusLabel(emailStatus)}
                            </Badge>
                            {cert.email_delivery_details && 
                             typeof cert.email_delivery_details === 'object' &&
                             'bounce' in cert.email_delivery_details && 
                             cert.email_delivery_details.bounce && 
                             typeof cert.email_delivery_details.bounce === 'object' &&
                             'message' in cert.email_delivery_details.bounce && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {String(cert.email_delivery_details.bounce.message)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.is_active ? "default" : "destructive"}>
                              {cert.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => downloadCertificate(cert.certificate_url, `${cert.certificate_number}.png`)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {cert.is_active ? (
                                  <DropdownMenuItem
                                    onClick={() => setCertificateToDelete(cert.id)}
                                    disabled={deleteCertificate.isPending}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Revoke (mark invalid)
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => reinstateCertificate.mutate(cert.id)}
                                    disabled={reinstateCertificate.isPending}
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reinstate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setCertificateToDeletePermanently({
                                    id: cert.id,
                                    certificate_url: cert.certificate_url,
                                    certificate_number: cert.certificate_number,
                                    recipient_name: cert.recipient_name,
                                    certificate_type: cert.certificate_type
                                  })}
                                  disabled={permanentlyDeleteCertificate.isPending}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No certificates sent yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Confirmation Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Certificate Generation</DialogTitle>
              <DialogDescription>
                You are about to generate {selectedMembers.length} certificate(s). This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <p><strong>Template:</strong> {templates?.find(t => t.id === selectedTemplate)?.template_name}</p>
              <p><strong>Certificate Type:</strong> {formatCertificateType(certificateType)}</p>
              {eventName && <p><strong>Event:</strong> {eventName}</p>}
              <p><strong>Recipients:</strong> {selectedMembers.length} member(s)</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateCertificates}>
                Generate Certificates
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Template Confirmation Dialog */}
        <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Certificate Template?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The template will be permanently deleted and you won't be able to use it to generate new certificates.
              </DialogDescription>
            </DialogHeader>
            {templates?.find(t => t.id === templateToDelete) && (
              <div className="py-4">
                <p className="font-semibold">
                  Template: {templates.find(t => t.id === templateToDelete)?.template_name}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => templateToDelete && handleDeleteTemplate(templateToDelete)}
              >
                Delete Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Certificate Confirmation Dialog */}
        <Dialog open={!!certificateToDelete} onOpenChange={(open) => !open && setCertificateToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Certificate?</DialogTitle>
              <DialogDescription>
                This action will revoke the certificate and make it invalid. The certificate will no longer be verifiable and the recipient will not be able to use it.
              </DialogDescription>
            </DialogHeader>
            {issuedCertificates?.find(c => c.id === certificateToDelete) && (
              <div className="space-y-2 py-4">
                <p><strong>Certificate:</strong> {issuedCertificates.find(c => c.id === certificateToDelete)?.certificate_number}</p>
                <p><strong>Recipient:</strong> {issuedCertificates.find(c => c.id === certificateToDelete)?.recipient_name}</p>
                <p><strong>Type:</strong> {formatCertificateType(issuedCertificates.find(c => c.id === certificateToDelete)?.certificate_type || '')}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => certificateToDelete && handleDeleteCertificate(certificateToDelete)}
                disabled={deleteCertificate.isPending}
              >
                {deleteCertificate.isPending ? 'Revoking...' : 'Revoke Certificate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permanent Delete Confirmation Dialog */}
        <Dialog open={!!certificateToDeletePermanently} onOpenChange={(open) => !open && setCertificateToDeletePermanently(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Certificate Permanently?</DialogTitle>
              <DialogDescription>
                This action <strong>cannot be undone</strong>. The certificate will be permanently removed from the database and storage. 
                Use this only for certificates that were issued by mistake.
              </DialogDescription>
            </DialogHeader>
            {certificateToDeletePermanently && (
              <div className="space-y-2 py-4 bg-destructive/10 p-4 rounded-md">
                <p><strong>Certificate:</strong> {certificateToDeletePermanently.certificate_number}</p>
                <p><strong>Recipient:</strong> {certificateToDeletePermanently.recipient_name}</p>
                <p><strong>Type:</strong> {formatCertificateType(certificateToDeletePermanently.certificate_type)}</p>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> This will permanently delete the certificate file and database record. 
              This action cannot be reversed.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateToDeletePermanently(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={permanentlyDeleteCertificate.isPending}
              >
                {permanentlyDeleteCertificate.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Certificate Dialog */}
        {templatePreviewUrl && (
          <PreviewCertificateDialog
            open={showPreviewDialog}
            onOpenChange={setShowPreviewDialog}
            templateUrl={templatePreviewUrl}
            namePosition={namePosition}
            qrPosition={qrPosition}
          />
        )}

        {/* Edit Certificate Template Dialog */}
        <EditCertificateTemplateDialog
          template={templateToEdit}
          open={!!templateToEdit}
          onOpenChange={(open) => !open && setTemplateToEdit(null)}
        />
      </div>
    </EnhancedRegionalAdminLayout>
  );
};

export default Certificates;

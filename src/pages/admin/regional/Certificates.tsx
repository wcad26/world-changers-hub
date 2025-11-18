import { useState } from 'react';
import { Award, Upload, FileCheck, Send, Trash2, MoreHorizontal, Download, Eye } from 'lucide-react';
import EnhancedRegionalAdminLayout from '@/components/admin/EnhancedRegionalAdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { 
  useCertificateTemplates, 
  useUploadCertificateTemplate,
  useGenerateCertificates,
  useIssuedCertificates,
  useSendCertificateEmails,
  useDeleteCertificate,
  useDeleteCertificateTemplate
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const Certificates = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Template upload state
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  
  // Certificate generation state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [certificateType, setCertificateType] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  
  // Issued certificates state
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  
  // Queries
  const { data: templates, isLoading: templatesLoading } = useCertificateTemplates(profile?.region_id || undefined);
  const { data: members, isLoading: membersLoading } = useMembers(profile?.region_id || '');
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: issuedCertificates, isLoading: certificatesLoading } = useIssuedCertificates(profile?.region_id || '');
  const { data: eventAttendees, isLoading: attendeesLoading } = useEventAttendees(
    selectedEventId && selectedEventId !== 'none' ? selectedEventId : undefined,
    profile?.region_id || undefined
  );

  // Filter members based on event selection
  const filteredMembers = selectedEventId && selectedEventId !== 'none' ? eventAttendees || [] : members || [];
  
  // Mutations
  const uploadTemplate = useUploadCertificateTemplate();
  const generateCertificates = useGenerateCertificates();
  const sendEmails = useSendCertificateEmails();
  const deleteCertificate = useDeleteCertificate();
  const deleteTemplate = useDeleteCertificateTemplate();

  const handleTemplateUpload = async () => {
    if (!templateFile || !templateName || !templateType) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields and select a file',
        variant: 'destructive',
      });
      return;
    }

    await uploadTemplate.mutateAsync({
      file: templateFile,
      templateData: {
        template_name: templateName,
        template_type: templateType,
        region_id: profile?.region_id || undefined,
        is_active: true,
      }
    });

    setTemplateFile(null);
    setTemplateName('');
    setTemplateType('');
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate.mutateAsync(templateId);
    setTemplateToDelete(null);
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    await deleteCertificate.mutateAsync(certificateId);
    setCertificateToDelete(null);
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

    try {
      // Get template with public URL
      const { data: template } = await supabase
        .from('certificate_templates')
        .select('template_url')
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

          recipientName = `${member.profiles.first_name} ${member.profiles.last_name}`;
          const certificateNumber = await generateUniqueCode('certificate', profile.region_id);
          const verificationCode = await generateUniqueCode('verification', profile.region_id);

          // Generate certificate image using canvas
      const blob = await generateCertificateImage(
        templatePublicUrl,
        recipientName,
        certificateNumber,
        verificationCode,
        baseUrl
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
          
          // Show progress toast
          if (selectedMembers.length > 1) {
            toast({
              title: 'Progress',
              description: `Generated ${i + 1} of ${selectedMembers.length} certificates`,
            });
          }
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
          description: `Successfully generated ${successCount} certificate(s)`,
        });
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

    await sendEmails.mutateAsync(selectedCertificates);
    setSelectedCertificates([]);
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Certificates</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="issued">Issued Certificates</TabsTrigger>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event-select">Associated Event (Optional)</Label>
                    <Select 
                      value={selectedEventId} 
                      onValueChange={(value) => {
                        setSelectedEventId(value);
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
                  {selectedEventId && selectedEventId !== 'none' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <FileCheck className="h-4 w-4" />
                      <span>
                        Showing {filteredMembers.length} attendee{filteredMembers.length !== 1 ? 's' : ''} marked present for this event
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
                            ? `${member.profiles.first_name} ${member.profiles.last_name}`
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
                  disabled={!selectedTemplate || selectedMembers.length === 0 || !certificateType || generateCertificates.isPending}
                  className="w-full"
                  size="lg"
                >
                  <FileCheck className="mr-2 h-5 w-5" />
                  {generateCertificates.isPending ? 'Generating...' : `Generate ${selectedMembers.length} Certificate(s)`}
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
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  />
                </div>

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
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setTemplateToDelete(template.id)}
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
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

          {/* Issued Certificates Tab */}
          <TabsContent value="issued" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>
                      View and manage all issued certificates
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
                      onClick={handleBulkEmail}
                      disabled={selectedCertificates.length === 0 || sendEmails.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendEmails.isPending ? 'Sending...' : `Email Selected (${selectedCertificates.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {certificatesLoading ? (
                  <p className="text-muted-foreground">Loading certificates...</p>
                ) : issuedCertificates && issuedCertificates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCertificates.length === issuedCertificates.length}
                            onCheckedChange={(checked) => {
                              setSelectedCertificates(checked ? issuedCertificates.map(c => c.id) : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issuedCertificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCertificates.includes(cert.id)}
                              onCheckedChange={() => toggleCertificateSelection(cert.id)}
                            />
                          </TableCell>
                          <TableCell>{cert.recipient_name}</TableCell>
                          <TableCell>{formatCertificateType(cert.certificate_type)}</TableCell>
                          <TableCell>{cert.event_name || '-'}</TableCell>
                          <TableCell>{new Date(cert.issued_date).toLocaleDateString()}</TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => setCertificateToDelete(cert.id)}
                                  disabled={deleteCertificate.isPending}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Revoke
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No certificates issued yet.</p>
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
      </div>
    </EnhancedRegionalAdminLayout>
  );
};

export default Certificates;

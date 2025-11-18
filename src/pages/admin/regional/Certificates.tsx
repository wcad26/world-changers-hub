import { useState } from 'react';
import { Award, Upload, FileCheck, Send } from 'lucide-react';
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
  useDeleteCertificate
} from '@/hooks/useCertificates';
import { useMembers } from '@/hooks/useMembers';
import { useRegionalEvents } from '@/hooks/useEvents';
import { getCertificateTypeOptions, downloadCertificate, downloadCertificatesAsZip, formatCertificateType } from '@/utils/certificateUtils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  
  // Queries
  const { data: templates, isLoading: templatesLoading } = useCertificateTemplates(profile?.region_id || undefined);
  const { data: members, isLoading: membersLoading } = useMembers(profile?.region_id || '');
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: issuedCertificates, isLoading: certificatesLoading } = useIssuedCertificates(profile?.region_id || '');
  
  // Mutations
  const uploadTemplate = useUploadCertificateTemplate();
  const generateCertificates = useGenerateCertificates();
  const sendEmails = useSendCertificateEmails();
  const deleteCertificate = useDeleteCertificate();

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

  const handleGenerateCertificates = async () => {
    if (!selectedTemplate || selectedMembers.length === 0 || !certificateType) {
      toast({
        title: 'Missing information',
        description: 'Please select a template, members, and certificate type',
        variant: 'destructive',
      });
      return;
    }

    setShowGenerateDialog(false);

    await generateCertificates.mutateAsync({
      template_id: selectedTemplate,
      member_ids: selectedMembers,
      certificate_type: certificateType,
      event_name: eventName || undefined,
      event_date: eventDate || undefined,
      region_id: profile?.region_id || '',
    });

    // Reset form
    setSelectedMembers([]);
    setCertificateType('');
    setEventName('');
    setEventDate('');
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

                <div className="space-y-3">
                  <Label>Select Recipients ({selectedMembers.length} selected)</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                    {membersLoading ? (
                      <p className="text-muted-foreground">Loading members...</p>
                    ) : members && members.length > 0 ? (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMemberSelection(member.id)}
                          />
                          <Label className="cursor-pointer flex-1">
                            {member.profiles?.first_name} {member.profiles?.last_name} ({member.member_id})
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No members found</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMembers(members?.map(m => m.id) || [])}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMembers([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
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
                        <CardContent>
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
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
                        <TableHead>Certificate #</TableHead>
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
                          <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                          <TableCell>{cert.recipient_name}</TableCell>
                          <TableCell>{formatCertificateType(cert.certificate_type)}</TableCell>
                          <TableCell>{cert.event_name || '-'}</TableCell>
                          <TableCell>{new Date(cert.issued_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadCertificate(cert.certificate_url, `${cert.certificate_number}.png`)}
                              >
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}
                              >
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteCertificate.mutate(cert.id)}
                              >
                                Revoke
                              </Button>
                            </div>
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
      </div>
    </EnhancedRegionalAdminLayout>
  );
};

export default Certificates;

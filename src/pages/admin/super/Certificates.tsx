import { useState } from 'react';
import { Award, Upload, FileCheck, Send, Trash2, MoreHorizontal, Download, Eye, RotateCcw, XCircle, ImageIcon, Pencil } from 'lucide-react';
import { CertificatePositionPicker } from '@/components/admin/regional/CertificatePositionPicker';
import { PreviewCertificateDialog } from '@/components/admin/regional/PreviewCertificateDialog';
import { EditCertificateTemplateDialog } from '@/components/admin/regional/EditCertificateTemplateDialog';
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
  useGlobalCertificateTemplates,
  useUploadCertificateTemplate,
  useGenerateCertificates,
  useGlobalIssuedCertificates,
  useGlobalUnsentCertificates,
  useGlobalSentCertificates,
  useSendCertificateEmails,
  useDeleteCertificate,
  useDeleteCertificateTemplate,
  useReinstateCertificate,
  usePermanentlyDeleteCertificate
} from '@/hooks/useCertificates';
import { useAllMembers } from '@/hooks/useAllMembers';
import { useGlobalEvents } from '@/hooks/useGlobalEvents';
import { useEventAttendees } from '@/hooks/useAttendance';
import { useEventPreRegistrants } from '@/hooks/useEventPreRegistrants';
import { useAllRegions } from '@/hooks/useAllRegions';
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

const SuperCertificates = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string | null>(null);
  const [namePosition, setNamePosition] = useState<{ x: number; y: number; fontSize?: number; fontFamily?: string; color?: string }>({ 
    x: 400, y: 477, fontSize: 38, fontFamily: 'Georgia, serif', color: '#1a365d' 
  });
  const [qrPosition, setQRPosition] = useState({ x: 708, y: 591, size: 100 });
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [certificateType, setCertificateType] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [selectedSentCertificates, setSelectedSentCertificates] = useState<string[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<CertificateTemplate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('all');
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [certificateStatusFilter, setCertificateStatusFilter] = useState<string>('all');
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ current: 0, total: 0 });
  const [certificateToDeletePermanently, setCertificateToDeletePermanently] = useState<{
    id: string; certificate_url: string; certificate_number: string; recipient_name: string; certificate_type: string;
  } | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [sentCertificateSearchTerm, setSentCertificateSearchTerm] = useState('');
  const [issuedEventFilter, setIssuedEventFilter] = useState('all');
  const [issuedTypeFilter, setIssuedTypeFilter] = useState('all');
  const [issuedOutputFilter, setIssuedOutputFilter] = useState<'all' | 'certificate' | 'badge'>('all');

  // New: output type + recipient source
  const [outputType, setOutputType] = useState<'certificate' | 'badge'>('certificate');
  const [recipientSource, setRecipientSource] = useState<'members' | 'attendees' | 'preregs'>('members');
  const [selectedPreRegIds, setSelectedPreRegIds] = useState<string[]>([]);
  const [preRegPrimaryOnly, setPreRegPrimaryOnly] = useState(false);
  const [preRegLodgingOnly, setPreRegLodgingOnly] = useState(false);
  const [preRegAttendeeType, setPreRegAttendeeType] = useState<'all' | 'adult' | 'child'>('all');
  const [preRegRegionFilter, setPreRegRegionFilter] = useState<string>('all');
  const [templateOutputType, setTemplateOutputType] = useState<'certificate' | 'badge'>('certificate');

  // Global queries - no region filter
  const { data: templates, isLoading: templatesLoading } = useGlobalCertificateTemplates();
  const { data: members, isLoading: membersLoading } = useAllMembers({ searchTerm: memberSearchTerm });
  const { data: events, isLoading: eventsLoading } = useGlobalEvents();
  const { data: issuedCertificates, isLoading: certificatesLoading } = useGlobalIssuedCertificates();
  const { data: unsentCertificates } = useGlobalUnsentCertificates();
  const { data: sentCertificates } = useGlobalSentCertificates();
  const { data: allRegions } = useAllRegions();
  const { data: eventAttendees, isLoading: attendeesLoading } = useEventAttendees(
    recipientSource === 'attendees' && selectedEventId && selectedEventId !== 'none' ? selectedEventId : undefined,
    undefined // No region filter for global
  );
  const { data: preRegistrants, isLoading: preRegsLoading } = useEventPreRegistrants(
    recipientSource === 'preregs' ? selectedEventId : undefined,
    {
      search: memberSearchTerm,
      primaryOnly: preRegPrimaryOnly,
      needsLodging: preRegLodgingOnly,
      attendeeType: preRegAttendeeType,
      regionId: preRegRegionFilter,
    }
  );

  // Filter templates by output type for dropdown
  const templatesForOutput = (templates || []).filter(
    (t: any) => (t.output_type || 'certificate') === outputType
  );

  const baseMembers = selectedEventId && selectedEventId !== 'none' ? eventAttendees || [] : members || [];
  
  const membersWithCertificatesForEvent = new Set(
    issuedCertificates?.filter(cert => selectedEventId && selectedEventId !== 'none' && cert.event_name === eventName)
      .map(cert => cert.member_id).filter(Boolean) || []
  );
  
  const filteredMembers = baseMembers.filter((member) => {
    const fullName = member.profiles?.first_name && member.profiles?.last_name
      ? `${member.profiles.last_name} ${member.profiles.first_name}`.toLowerCase()
      : (member.profiles?.email || '').toLowerCase();
    const memberId = (member.member_id || '').toLowerCase();
    const searchLower = memberSearchTerm.toLowerCase();
    const matchesSearch = !memberSearchTerm || fullName.includes(searchLower) || memberId.includes(searchLower);
    
    if (selectedEventId && selectedEventId !== 'none' && certificateStatusFilter !== 'all') {
      const hasCertificate = membersWithCertificatesForEvent.has(member.id);
      if (certificateStatusFilter === 'pending' && hasCertificate) return false;
      if (certificateStatusFilter === 'generated' && !hasCertificate) return false;
    }
    return matchesSearch;
  });

  const filteredSentCertificates = sentCertificates?.filter(cert => {
    const matchesStatus = emailStatusFilter === 'all' || cert.email_status === emailStatusFilter;
    const matchesSearch = !sentCertificateSearchTerm || 
      cert.recipient_name.toLowerCase().includes(sentCertificateSearchTerm.toLowerCase()) ||
      cert.recipient_email?.toLowerCase().includes(sentCertificateSearchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];
  
  const uploadTemplate = useUploadCertificateTemplate();
  const sendEmails = useSendCertificateEmails();
  const deleteCertificate = useDeleteCertificate();
  const reinstateCertificate = useReinstateCertificate();
  const deleteTemplate = useDeleteCertificateTemplate();
  const permanentlyDeleteCertificate = usePermanentlyDeleteCertificate();

  const handleTemplateUpload = async () => {
    if (!templateFile || !templateName || !templateType) {
      toast({ title: 'Missing information', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    uploadTemplate.mutate({
      file: templateFile,
      templateData: {
        template_name: templateName, template_type: templateType,
        region_id: null, // Global template
        created_by: profile?.id || null,
        name_position: namePosition, qr_position: qrPosition,
        output_type: templateOutputType,
      } as any,
    }, {
      onSuccess: () => { setTemplateFile(null); setTemplateName(''); setTemplateType(''); setTemplatePreviewUrl(null); },
    });
  };

  const handleTemplateFileChange = (file: File | null) => {
    setTemplateFile(file);
    if (file) { setTemplatePreviewUrl(URL.createObjectURL(file)); }
    else { if (templatePreviewUrl) URL.revokeObjectURL(templatePreviewUrl); setTemplatePreviewUrl(null); }
  };

  const generateUniqueCode = async (type: 'certificate' | 'verification'): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = type === 'certificate' ? generateCertificateNumber('GLOBAL', outputType) : generateVerificationCode();
      const { data } = await supabase.from('certificates').select('id')
        .eq(type === 'certificate' ? 'certificate_number' : 'verification_code', code).maybeSingle();
      if (!data) return code;
    }
    throw new Error(`Failed to generate unique ${type} code`);
  };

  const handleGenerateCertificates = async () => {
    const isPreReg = recipientSource === 'preregs';
    const ids = isPreReg ? selectedPreRegIds : selectedMembers;
    if (!selectedTemplate || ids.length === 0 || !certificateType) {
      toast({ title: 'Missing information', description: 'Please select a template, recipients, and type', variant: 'destructive' });
      return;
    }

    setShowGenerateDialog(false);
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: ids.length });

    try {
      const { data: template } = await supabase.from('certificate_templates')
        .select('template_url, name_position, qr_position').eq('id', selectedTemplate).single();
      if (!template) { toast({ title: 'Error', description: 'Template not found', variant: 'destructive' }); return; }

      const { data: { publicUrl: templatePublicUrl } } = supabase.storage
        .from('certificate-templates').getPublicUrl(template.template_url);

      const baseUrl = window.location.origin;
      let successCount = 0, failCount = 0;
      const namePos = template.name_position as any || undefined;
      const qrPos = template.qr_position as any || undefined;

      for (let i = 0; i < ids.length; i++) {
        const rowId = ids[i];
        let recipientName = 'Unknown';
        try {
          let recipientEmail: string | null = null;
          let memberId: string | null = null;
          let regionId: string | null = null;
          let preRegistrationId: string | null = null;

          if (isPreReg) {
            const row = (preRegistrants || []).find((r) => r.id === rowId);
            if (!row) { failCount++; continue; }
            recipientName = row.full_name;
            recipientEmail = row.email;
            memberId = row.member_id;
            regionId = row.region_id;
            preRegistrationId = row.id;
          } else {
            const { data: member } = await supabase.from('members')
              .select('profiles(first_name, last_name, email), region_id').eq('id', rowId).single();
            if (!member?.profiles) { failCount++; continue; }
            recipientName = `${(member.profiles as any).last_name} ${(member.profiles as any).first_name}`;
            recipientEmail = (member.profiles as any).email || null;
            memberId = rowId;
            regionId = (member as any).region_id;
          }

          const certificateNumber = await generateUniqueCode('certificate');
          const verificationCode = await generateUniqueCode('verification');

          const blob = await generateCertificateImage(templatePublicUrl, recipientName, certificateNumber, verificationCode, baseUrl, namePos, qrPos);

          const folderKey = memberId || preRegistrationId || 'anon';
          const filePath = `${regionId || 'global'}/${folderKey}/${certificateNumber}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates').upload(filePath, blob, { contentType: 'image/png', upsert: true });
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(uploadData.path);

          const { error: insertError } = await supabase.from('certificates').insert({
            certificate_number: certificateNumber, certificate_type: certificateType,
            certificate_url: publicUrl, verification_code: verificationCode,
            recipient_name: recipientName, recipient_email: recipientEmail,
            event_name: eventName || null, event_date: eventDate || null,
            issued_date: new Date().toISOString().split('T')[0],
            region_id: regionId,
            member_id: memberId, issued_by: profile?.id,
            qr_code_data: getVerificationUrl(verificationCode, baseUrl),
            output_type: outputType,
            pre_registration_id: preRegistrationId,
          } as any);
          if (insertError) throw insertError;

          successCount++;
          setGenerationProgress({ current: i + 1, total: ids.length });
        } catch (error) {
          console.error(`Failed for ${rowId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({ title: 'Success', description: `Generated ${successCount} ${outputType}(s)` });
        await queryClient.invalidateQueries({ queryKey: ['certificates'] });
        await queryClient.invalidateQueries({ queryKey: ['event-pre-registrants'] });
        setActiveTab('issued');
      }
      if (failCount > 0) {
        toast({ title: 'Partial failure', description: `${failCount} ${outputType}(s) failed`, variant: 'destructive' });
      }

      setSelectedMembers([]); setSelectedPreRegIds([]); setCertificateType(''); setEventName(''); setEventDate(''); setSelectedEventId('');
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to generate ${outputType}s`, variant: 'destructive' });
    } finally {
      setIsGenerating(false); setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCertificates.length === 0) return;
    const certs = issuedCertificates?.filter(cert => selectedCertificates.includes(cert.id))
      .map(cert => ({ url: cert.certificate_url, filename: `${cert.certificate_number}.png` })) || [];
    await downloadCertificatesAsZip(certs);
  };

  const handleBulkDelete = async () => {
    if (selectedCertificates.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const certsToDelete = issuedCertificates?.filter(cert => selectedCertificates.includes(cert.id)) || [];
      let successCount = 0;
      let failCount = 0;
      for (const cert of certsToDelete) {
        try {
          await permanentlyDeleteCertificate.mutateAsync({ id: cert.id, certificate_url: cert.certificate_url });
          successCount++;
        } catch {
          failCount++;
        }
      }
      if (successCount > 0) {
        toast({ title: 'Bulk delete complete', description: `${successCount} certificate(s) deleted permanently${failCount > 0 ? `, ${failCount} failed` : ''}` });
      }
      setSelectedCertificates([]);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const handleBulkEmail = async () => {
    if (selectedCertificates.length === 0) return;
    setIsSendingEmails(true);
    try {
      await sendEmails.mutateAsync({ certificate_ids: selectedCertificates, onProgress: (c, t) => setEmailProgress({ current: c, total: t }) });
      setSelectedCertificates([]);
    } finally { setIsSendingEmails(false); setEmailProgress({ current: 0, total: 0 }); }
  };

  const toggleMemberSelection = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAllMembers = () => setSelectedMembers(prev => prev.length === filteredMembers.length ? [] : filteredMembers.map(m => m.id));
  const toggleCertificateSelection = (id: string) => setSelectedCertificates(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSentCertificateSelection = (id: string) => setSelectedSentCertificates(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            Global Certificate Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate, manage, and distribute certificates for inter-regional events and programs
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => !isGenerating && setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" disabled={isGenerating}>Generate</TabsTrigger>
            <TabsTrigger value="templates" disabled={isGenerating}>Templates</TabsTrigger>
            <TabsTrigger value="issued" disabled={isGenerating}>Issued</TabsTrigger>
            <TabsTrigger value="sent" disabled={isGenerating}>Sent</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Generate {outputType === 'badge' ? 'Badges' : 'Certificates'}</CardTitle>
                <CardDescription>
                  Choose an output type, pick a recipient source, and generate in bulk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Output Type</Label>
                    <Select value={outputType} onValueChange={(v: 'certificate' | 'badge') => {
                      setOutputType(v);
                      setSelectedTemplate('');
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="badge">Badge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipient Source</Label>
                    <Select value={recipientSource} onValueChange={(v: 'members' | 'attendees' | 'preregs') => {
                      setRecipientSource(v);
                      setSelectedMembers([]);
                      setSelectedPreRegIds([]);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="members">All Members</SelectItem>
                        <SelectItem value="attendees">Event Attendees</SelectItem>
                        <SelectItem value="preregs">Event Pre-registrations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{outputType === 'badge' ? 'Badge' : 'Certificate'} Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger><SelectValue placeholder={`Select a ${outputType} template`} /></SelectTrigger>
                    <SelectContent>
                      {templatesForOutput.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          No {outputType} templates yet. Upload one in the Templates tab.
                        </div>
                      ) : templatesForOutput.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.template_name} ({t.template_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{outputType === 'badge' ? 'Badge' : 'Certificate'} Type</Label>
                  <Select value={certificateType} onValueChange={setCertificateType}>
                    <SelectTrigger><SelectValue placeholder={`Select ${outputType} type`} /></SelectTrigger>
                    <SelectContent>
                      {getCertificateTypeOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>
                      Associated Event {(recipientSource === 'preregs' || recipientSource === 'attendees') ? '' : '(Optional)'}
                    </Label>
                    <Select value={selectedEventId} onValueChange={(value) => {
                      setSelectedEventId(value);
                      setCertificateStatusFilter('all');
                      setSelectedMembers([]);
                      setSelectedPreRegIds([]);
                      if (value === 'none') { setEventName(''); setEventDate(''); }
                      else {
                        const ev = events?.find(e => e.id === value);
                        if (ev) { setEventName(ev.name); setEventDate(format(new Date(ev.start_datetime), 'yyyy-MM-dd')); }
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Event</SelectItem>
                        {events?.map(ev => (
                          <SelectItem key={ev.id} value={ev.id}>
                            {ev.name} - {format(new Date(ev.start_datetime), 'MMM dd, yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Date</Label>
                    <Input type="date" value={eventDate} readOnly className="bg-muted" />
                  </div>
                  {recipientSource !== 'preregs' && (
                    <div className="space-y-2">
                      <Label>Status Filter</Label>
                      <Select value={certificateStatusFilter} onValueChange={setCertificateStatusFilter} disabled={!selectedEventId || selectedEventId === 'none'}>
                        <SelectTrigger><SelectValue placeholder="Filter" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="generated">Generated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {recipientSource === 'preregs' ? (
                  <div className="space-y-4">
                    {(!selectedEventId || selectedEventId === 'none') ? (
                      <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                        Select an event above to load its pre-registrations.
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3 md:grid-cols-4">
                          <Select value={preRegAttendeeType} onValueChange={(v: 'all' | 'adult' | 'child') => setPreRegAttendeeType(v)}>
                            <SelectTrigger><SelectValue placeholder="Attendee type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All ages</SelectItem>
                              <SelectItem value="adult">Adults (15+)</SelectItem>
                              <SelectItem value="child">Children (&lt;15)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={preRegRegionFilter} onValueChange={setPreRegRegionFilter}>
                            <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All regions</SelectItem>
                              {(allRegions || []).map((r: any) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-2 text-sm border rounded-md px-3">
                            <Checkbox checked={preRegPrimaryOnly} onCheckedChange={(c) => setPreRegPrimaryOnly(!!c)} />
                            Primary registrants only
                          </label>
                          <label className="flex items-center gap-2 text-sm border rounded-md px-3">
                            <Checkbox checked={preRegLodgingOnly} onCheckedChange={(c) => setPreRegLodgingOnly(!!c)} />
                            Needs lodging
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Select Pre-registrants</Label>
                          <Button type="button" variant="outline" size="sm"
                            onClick={() => setSelectedPreRegIds(
                              selectedPreRegIds.length === (preRegistrants || []).length ? [] : (preRegistrants || []).map(r => r.id)
                            )}
                            disabled={!preRegistrants || preRegistrants.length === 0}>
                            {selectedPreRegIds.length === (preRegistrants || []).length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <Input placeholder="Search by name, email or phone..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} />
                        <div className="border rounded-lg max-h-72 overflow-y-auto">
                          {preRegsLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                          ) : (preRegistrants && preRegistrants.length > 0) ? (
                            <div className="divide-y">
                              {preRegistrants.map(row => {
                                const alreadyIssued = outputType === 'badge' ? row.has_badge : row.has_certificate;
                                return (
                                  <div key={row.id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                                    <Checkbox
                                      checked={selectedPreRegIds.includes(row.id)}
                                      onCheckedChange={() => setSelectedPreRegIds(prev =>
                                        prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium flex items-center gap-2">
                                        {row.full_name}
                                        {row.is_primary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                                        <Badge variant="outline" className="text-[10px] capitalize">{row.age_category}</Badge>
                                        {row.needs_lodging && <Badge variant="outline" className="text-[10px]">Lodging</Badge>}
                                        {alreadyIssued && <Badge className="text-[10px]">Already issued</Badge>}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {row.email || row.phone || '—'}
                                        {row.region_name && <> • {row.region_name}</>}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-muted-foreground">No pre-registrations match these filters</div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedPreRegIds.length} of {(preRegistrants || []).length} selected
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Recipients</Label>
                      <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllMembers} disabled={filteredMembers.length === 0}>
                        {selectedMembers.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <Input placeholder="Search by name or member ID..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} />
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {(membersLoading || attendeesLoading) ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                      ) : filteredMembers.length > 0 ? (
                        <div className="divide-y">
                          {filteredMembers.map(member => {
                            const fullName = member.profiles?.first_name && member.profiles?.last_name
                              ? `${member.profiles.last_name} ${member.profiles.first_name}` : member.profiles?.email || 'Unknown';
                            return (
                              <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                                <Checkbox checked={selectedMembers.includes(member.id)} onCheckedChange={() => toggleMemberSelection(member.id)} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{fullName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.member_id} • {member.member_type}
                                    {(member as any).regions?.name && <> • {(member as any).regions.name}</>}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">No members found</div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedMembers.length} of {filteredMembers.length} selected</p>
                  </div>
                )}

                {(() => {
                  const count = recipientSource === 'preregs' ? selectedPreRegIds.length : selectedMembers.length;
                  const label = outputType === 'badge' ? 'Badge' : 'Certificate';
                  return (
                    <Button onClick={() => setShowGenerateDialog(true)}
                      disabled={!selectedTemplate || count === 0 || !certificateType || isGenerating}
                      className="w-full" size="lg">
                      <FileCheck className={cn("mr-2 h-5 w-5", isGenerating && "animate-spin")} />
                      {isGenerating ? `Generating... (${generationProgress.current}/${generationProgress.total})` : `Generate ${count} ${label}(s)`}
                    </Button>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Template</CardTitle>
                <CardDescription>Upload a certificate template image (PNG, JPG recommended)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Global Conference Certificate 2024" />
                </div>
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{getCertificateTypeOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template File</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleTemplateFileChange(e.target.files?.[0] || null)} />
                </div>
                {templatePreviewUrl && (
                  <>
                    <CertificatePositionPicker templateUrl={templatePreviewUrl} namePosition={namePosition} qrPosition={qrPosition}
                      onNamePositionChange={setNamePosition} onQRPositionChange={setQRPosition} />
                    <Button type="button" variant="outline" onClick={() => setShowPreviewDialog(true)} className="w-full">
                      <ImageIcon className="mr-2 h-4 w-4" />Preview Certificate
                    </Button>
                  </>
                )}
                <Button onClick={handleTemplateUpload} disabled={!templateFile || !templateName || !templateType || uploadTemplate.isPending} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />{uploadTemplate.isPending ? 'Uploading...' : 'Upload Template'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Existing Templates</CardTitle></CardHeader>
              <CardContent>
                {templatesLoading ? <p className="text-muted-foreground">Loading...</p> : templates && templates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                      <Card key={template.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{template.template_name}</CardTitle>
                          <CardDescription>{formatCertificateType(template.template_type)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>{template.is_active ? 'Active' : 'Inactive'}</Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setTemplateToEdit(template)}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => setTemplateToDelete(template.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No templates found.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issued Tab */}
          <TabsContent value="issued" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>Certificates issued but not yet sent via email</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBulkDownload} disabled={selectedCertificates.length === 0}>
                      <Download className="mr-2 h-4 w-4" />Download ({selectedCertificates.length})
                    </Button>
                    <Button onClick={handleBulkEmail} disabled={selectedCertificates.length === 0 || isSendingEmails}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSendingEmails ? `Sending ${emailProgress.current}/${emailProgress.total}...` : `Email (${selectedCertificates.length})`}
                    </Button>
                    <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={selectedCertificates.length === 0 || isBulkDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isBulkDeleting ? 'Deleting...' : `Delete (${selectedCertificates.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isSendingEmails && (
                  <div className="mb-4 space-y-2">
                    <Progress value={(emailProgress.current / emailProgress.total) * 100} />
                  </div>
                )}
              <div className="flex gap-3 mb-4 flex-wrap">
                  <div className="w-48">
                    <Select value={issuedEventFilter} onValueChange={setIssuedEventFilter}>
                      <SelectTrigger><SelectValue placeholder="Filter by event" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="none">No Event</SelectItem>
                        {[...new Set(unsentCertificates?.map(c => c.event_name).filter(Boolean))].map(name => (
                          <SelectItem key={name} value={name!}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Select value={issuedTypeFilter} onValueChange={setIssuedTypeFilter}>
                      <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {[...new Set(unsentCertificates?.map(c => c.certificate_type).filter(Boolean))].map(type => (
                          <SelectItem key={type} value={type}>{formatCertificateType(type)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(() => {
                  const filteredUnsent = unsentCertificates?.filter(cert => {
                    const matchesEvent = issuedEventFilter === 'all' || (issuedEventFilter === 'none' ? !cert.event_name : cert.event_name === issuedEventFilter);
                    const matchesType = issuedTypeFilter === 'all' || cert.certificate_type === issuedTypeFilter;
                    return matchesEvent && matchesType;
                  }) || [];
                  return certificatesLoading ? <p className="text-muted-foreground">Loading...</p> : filteredUnsent.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={selectedCertificates.length === filteredUnsent.length && filteredUnsent.length > 0}
                            onCheckedChange={(checked) => setSelectedCertificates(checked ? filteredUnsent.map(c => c.id) : [])} />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnsent.map(cert => (
                        <TableRow key={cert.id} className={cn(!cert.is_active && "opacity-60 bg-muted/50")}>
                          <TableCell><Checkbox checked={selectedCertificates.includes(cert.id)} onCheckedChange={() => toggleCertificateSelection(cert.id)} disabled={!cert.is_active} /></TableCell>
                          <TableCell>{cert.recipient_name}</TableCell>
                          <TableCell>{formatCertificateType(cert.certificate_type)}</TableCell>
                          <TableCell>{cert.event_name || '-'}</TableCell>
                          <TableCell>{new Date(cert.issued_date).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant={cert.is_active ? "default" : "destructive"}>{cert.is_active ? "Active" : "Revoked"}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadCertificate(cert.certificate_url, `${cert.certificate_number}.png`)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {cert.is_active ? (
                                  <DropdownMenuItem onClick={() => setCertificateToDelete(cert.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Revoke</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => reinstateCertificate.mutate(cert.id)}><RotateCcw className="mr-2 h-4 w-4" />Reinstate</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setCertificateToDeletePermanently({ id: cert.id, certificate_url: cert.certificate_url, certificate_number: cert.certificate_number, recipient_name: cert.recipient_name, certificate_type: cert.certificate_type })} className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Delete Permanently</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">No unsent certificates.</p>;
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Sent Certificates</CardTitle>
                    <CardDescription>Certificates sent via email</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input placeholder="Search..." value={sentCertificateSearchTerm} onChange={(e) => setSentCertificateSearchTerm(e.target.value)} className="w-[200px]" />
                    <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="sent">📤 Sent</SelectItem>
                        <SelectItem value="delivered">✅ Delivered</SelectItem>
                        <SelectItem value="bounced">❌ Bounced</SelectItem>
                        <SelectItem value="failed">⚠️ Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSentCertificates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={selectedSentCertificates.length === filteredSentCertificates.filter(c => c.is_active).length && filteredSentCertificates.filter(c => c.is_active).length > 0}
                            onCheckedChange={(checked) => setSelectedSentCertificates(checked ? filteredSentCertificates.filter(c => c.is_active).map(c => c.id) : [])} />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSentCertificates.map(cert => (
                        <TableRow key={cert.id} className={cn(!cert.is_active && "opacity-60 bg-muted/50")}>
                          <TableCell><Checkbox checked={selectedSentCertificates.includes(cert.id)} onCheckedChange={() => toggleSentCertificateSelection(cert.id)} disabled={!cert.is_active} /></TableCell>
                          <TableCell>{cert.recipient_name}</TableCell>
                          <TableCell>{formatCertificateType(cert.certificate_type)}</TableCell>
                          <TableCell>{cert.event_name || '-'}</TableCell>
                          <TableCell>{cert.email_sent_at ? new Date(cert.email_sent_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell><Badge variant={cert.email_status === 'delivered' ? 'default' : cert.email_status === 'failed' || cert.email_status === 'bounced' ? 'destructive' : 'outline'}>{cert.email_status || 'pending'}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadCertificate(cert.certificate_url, `${cert.certificate_number}.png`)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">No sent certificates.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Certificate Generation</DialogTitle>
              <DialogDescription>You are about to generate {selectedMembers.length} certificate(s).</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <p><strong>Template:</strong> {templates?.find(t => t.id === selectedTemplate)?.template_name}</p>
              <p><strong>Type:</strong> {formatCertificateType(certificateType)}</p>
              {eventName && <p><strong>Event:</strong> {eventName}</p>}
              <p><strong>Recipients:</strong> {selectedMembers.length}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
              <Button onClick={handleGenerateCertificates}>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Template?</DialogTitle></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { if (templateToDelete) { deleteTemplate.mutateAsync(templateToDelete); setTemplateToDelete(null); } }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!certificateToDelete} onOpenChange={(open) => !open && setCertificateToDelete(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Revoke Certificate?</DialogTitle></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { if (certificateToDelete) { deleteCertificate.mutateAsync(certificateToDelete); setCertificateToDelete(null); } }}>Revoke</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!certificateToDeletePermanently} onOpenChange={(open) => !open && setCertificateToDeletePermanently(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Permanently Delete Certificate?</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateToDeletePermanently(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { if (certificateToDeletePermanently) { permanentlyDeleteCertificate.mutateAsync({ id: certificateToDeletePermanently.id, certificate_url: certificateToDeletePermanently.certificate_url }); setCertificateToDeletePermanently(null); } }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Permanently Delete {selectedCertificates.length} Certificate(s)?</DialogTitle>
              <DialogDescription>This action cannot be undone. All selected certificates will be permanently removed from the system and storage.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} disabled={isBulkDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showPreviewDialog && templatePreviewUrl && (
          <PreviewCertificateDialog
            open={showPreviewDialog}
            onOpenChange={setShowPreviewDialog}
            templateUrl={templatePreviewUrl}
            namePosition={namePosition}
            qrPosition={qrPosition}
          />
        )}

        {templateToEdit && (
          <EditCertificateTemplateDialog
            template={templateToEdit}
            open={!!templateToEdit}
            onOpenChange={(open) => !open && setTemplateToEdit(null)}
          />
        )}
      </div>
    </>
  );
};

export default SuperCertificates;

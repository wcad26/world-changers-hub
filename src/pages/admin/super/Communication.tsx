import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuperAdminCommunications, useSuperAdminCreateCommunication } from "@/hooks/useCommunications";
import { useRegions, type Region } from "@/hooks/useRegions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { superAdminCommunicationFormSchema, type SuperAdminCommunicationFormSchema as CommunicationFormSchema } from '@/schemas/communicationSchema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsManager } from '@/components/admin/news/NewsManager';
import { CommsHero, commsTabsList, commsTabsTrigger } from '@/components/admin/news/CommsHero';

interface CreateCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regions: Region[];
}

const CreateCommunicationDialog: React.FC<CreateCommunicationDialogProps> = ({ open, onOpenChange, regions }) => {
  const { toast } = useToast();
  const createCommunicationMutation = useSuperAdminCreateCommunication();

  const form = useForm<CommunicationFormSchema>({
    resolver: zodResolver(superAdminCommunicationFormSchema),
    defaultValues: {
      title: '',
      messageType: 'announcement',
      content: '',
      audience: 'all_members',
      channels: ['email'],
      targetRegionIds: [],
      sendNow: true,
    },
  });
  
  const onSubmit = async (values: CommunicationFormSchema) => {
    const { targetRegionIds, ...rest } = values;
    
    const finalTargetRegionIds = targetRegionIds.includes('all') ? regions.map(r => r.id) : targetRegionIds;
    
    try {
        await createCommunicationMutation.mutateAsync({ values: rest, targetRegionIds: finalTargetRegionIds });
        toast({ title: 'Success', description: 'Communication sent successfully.' });
        onOpenChange(false);
        form.reset();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to send communication.'
        });
    }
  };
  
  const messageTypes = ['announcement', 'invitation', 'reminder', 'update', 'urgent'];
  const audiences = [{id: 'all_members', name: 'All Members'}, {id: 'dcg_leaders', name: 'DCG Leaders'}, {id: 'regional_admins', name: 'Regional Admins'}];
  const channels = [{id: 'email', name: 'Email'}, {id: 'sms', name: 'SMS (coming soon)'}, {id: 'app_notification', name: 'App Notification (coming soon)'}];
  const isAllRegions = form.watch('targetRegionIds').includes('all');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Global Announcement</DialogTitle>
          <DialogDescription>Compose and send a message to selected regions or the entire organization.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            <FormField
              control={form.control}
              name="targetRegionIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Regions</FormLabel>
                   <FormControl>
                        <div className="space-y-2 p-1">
                             <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="all_regions"
                                    checked={isAllRegions}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked ? ['all', ...regions.map(r => r.id)] : [])
                                    }}
                                />
                                <label htmlFor="all_regions" className="font-medium">All Regions</label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t pt-2">
                                {regions.map((region) => (
                                    <div key={region.id} className="flex flex-row items-start space-x-3 space-y-0">
                                        <Checkbox
                                            checked={field.value?.includes(region.id) || isAllRegions}
                                            disabled={isAllRegions}
                                            onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            return checked
                                                ? field.onChange([...currentValue, region.id])
                                                : field.onChange(currentValue.filter((value) => value !== region.id))
                                            }}
                                        />
                                        <label className="font-normal text-sm">{region.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input placeholder="e.g., Annual Conference Announcement" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="messageType" render={({ field }) => ( <FormItem> <FormLabel>Message Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger> </FormControl> <SelectContent> {messageTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="audience" render={({ field }) => ( <FormItem> <FormLabel>Audience</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger> </FormControl> <SelectContent> {audiences.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="content" render={({ field }) => ( <FormItem> <FormLabel>Content</FormLabel> <FormControl><Textarea placeholder="Type your message here." rows={5} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField
              control={form.control}
              name="channels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channels</FormLabel>
                   <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                        {channels.map((channel) => (
                            <div key={channel.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <Checkbox
                                    checked={field.value?.includes(channel.id)}
                                    disabled={channel.id !== 'email'}
                                    onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                            ? field.onChange([...currentValue, channel.id])
                                            : field.onChange(currentValue.filter((value) => value !== channel.id))
                                    }}
                                />
                                <label className="font-normal text-sm">{channel.name}</label>
                            </div>
                        ))}
                        </div>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="sendNow" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2"> <FormControl> <Checkbox checked={field.value} onCheckedChange={field.onChange} /> </FormControl> <FormLabel>Send Immediately</FormLabel> </FormItem> )}/>
            {!form.watch('sendNow') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="scheduledDate" render={({ field }) => ( <FormItem> <FormLabel>Schedule Date</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="scheduledTime" render={({ field }) => ( <FormItem> <FormLabel>Schedule Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createCommunicationMutation.isPending}>
                {createCommunicationMutation.isPending ? 'Sending...' : 'Send Communication'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


const SuperCommunication: React.FC = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: communications, isLoading, isError, error } = useSuperAdminCommunications();
  const { data: regions, isLoading: isLoadingRegions } = useRegions();

  const sent = communications?.filter((c: any) => c.status === 'sent').length ?? 0;
  const scheduled = communications?.filter((c: any) => c.status === 'scheduled').length ?? 0;

  return (
    <>
      <div className="space-y-6">
        <CommsHero
          title="Global Communication"
          subtitle="Send organisation-wide announcements and publish news & stories across every region."
          stats={[
            { label: 'Messages', value: communications?.length ?? 0 },
            { label: 'Sent', value: sent },
            { label: 'Scheduled', value: scheduled },
            { label: 'Regions', value: regions?.length ?? 0 },
          ]}
          action={<Button onClick={() => setCreateDialogOpen(true)} disabled={isLoadingRegions || !regions} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><PlusCircle className="mr-2 h-4 w-4" />New Announcement</Button>}
        />

        <Tabs defaultValue="messages">
          <TabsList className={commsTabsList}>
            <TabsTrigger value="messages" className={commsTabsTrigger}>Messages</TabsTrigger>
            <TabsTrigger value="news" className={commsTabsTrigger}>News & Blog</TabsTrigger>
          </TabsList>
          <TabsContent value="news" className="mt-5">
            <NewsManager scope="all" regions={regions?.map((r) => ({ id: r.id, name: r.name }))} />
          </TabsContent>
          <TabsContent value="messages" className="mt-5">
        <Card className="rounded-2xl border-border bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Sent Communications</CardTitle>
            <CardDescription>A log of all communications sent across all regions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading communications</AlertTitle>
                    <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
                </Alert>
            ) : communications && communications.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Audience</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {communications.map((comm) => (
                            <TableRow key={comm.id}>
                                <TableCell className="font-medium">{comm.title}</TableCell>
                                <TableCell>{comm.region?.name ?? 'N/A'}</TableCell>
                                <TableCell><Badge variant="outline" className="capitalize">{comm.message_type}</Badge></TableCell>
                                <TableCell className="capitalize">{comm.audience?.replace(/_/g, ' ')}</TableCell>
                                <TableCell>
                                    <Badge className="capitalize" variant={comm.status === 'sent' ? 'default' : comm.status === 'scheduled' ? 'secondary' : 'destructive'}>
                                        {comm.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(comm.created_at), 'PPP')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">No Communications Sent</h3>
                  <p className="text-muted-foreground mt-1">Click "New Announcement" to send your first message.</p>
                </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
      {regions && (
        <CreateCommunicationDialog 
            open={isCreateDialogOpen}
            onOpenChange={setCreateDialogOpen}
            regions={regions}
        />
      )}
    </>
  );
};

export default SuperCommunication;

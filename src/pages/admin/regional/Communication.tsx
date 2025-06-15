
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Mail, Phone, Send, Users, Bell, Calendar, Filter, Search, CheckCircle2, PlusCircle } from "lucide-react";
import { useCommunications, useCreateCommunication, useCommunicationTemplates, CommunicationFormValues } from "@/hooks/useCommunications";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const mockMessages = [
  { id: 1, title: "Sunday Service Reminder", type: "Announcement", sentTo: "All Members", sentVia: "Email, SMS", date: "2023-10-25", status: "Sent", opens: 145, clicks: 87 },
  { id: 2, title: "Prayer Meeting Update", type: "Update", sentTo: "Prayer Team", sentVia: "WhatsApp", date: "2023-10-20", status: "Sent", opens: 32, clicks: 18 },
  { id: 3, title: "Youth Event Invitation", type: "Invitation", sentTo: "Youth Group", sentVia: "Email", date: "2023-10-15", status: "Sent", opens: 67, clicks: 54 },
  { id: 4, title: "Thanksgiving Service", type: "Announcement", sentTo: "All Members", sentVia: "Email, SMS, WhatsApp", date: "2023-11-01", status: "Scheduled", opens: 0, clicks: 0 },
];

const messageSchema = z.object({
  title: z.string().min(3, { message: "Message title must be at least 3 characters." }),
  messageType: z.string().min(1, { message: "Please select a message type." }),
  content: z.string().min(10, { message: "Message content must be at least 10 characters." }),
  audience: z.string().min(1, { message: "Please select a recipient group." }),
  channels: z.array(z.string()).min(1, { message: "Please select at least one channel." }),
  sendNow: z.boolean().default(true),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

const RegionalCommunication: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [messagePreview, setMessagePreview] = useState(false);
  
  const { data: communications, isLoading: isLoadingCommunications, error: communicationsError } = useCommunications();
  const createCommunication = useCreateCommunication();
  const { data: templates, isLoading: isLoadingTemplates, error: templatesError } = useCommunicationTemplates();

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: "",
      messageType: "",
      content: "",
      audience: "",
      channels: ["email"],
      sendNow: true,
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  const filteredMessages = communications?.filter(message => 
    message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.message_type && message.message_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    message.audience.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
    
    form.setValue("channels", [...selectedChannels]);
  };

  function onSubmit(values: CommunicationFormValues) {
    toast.promise(createCommunication.mutateAsync(values), {
      loading: values.sendNow ? "Sending message..." : "Scheduling message...",
      success: () => {
        form.reset();
        setMessagePreview(false);
        return `Message ${values.sendNow ? 'sent' : 'scheduled'} successfully!`;
      },
      error: (err) => `Failed to send message: ${err.message}`,
    });
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Communication Center</h2>
        <p className="text-muted-foreground">
          Manage all communication with members in your region.
        </p>
        
        <Tabs defaultValue="compose">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="history">Message History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose">
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Create and send messages to members through multiple channels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!messagePreview ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Message Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Sunday Service Reminder" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="messageType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message Type</FormLabel>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                {...field}
                              >
                                <option value="">Select type</option>
                                <option value="announcement">Announcement</option>
                                <option value="invitation">Invitation</option>
                                <option value="reminder">Reminder</option>
                                <option value="update">Update</option>
                                <option value="urgent">Urgent Message</option>
                              </select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="audience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Send To</FormLabel>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                {...field}
                              >
                                <option value="">Select audience</option>
                                <option value="all">All Members</option>
                                <option value="leaders">Leaders Only</option>
                                <option value="youth">Youth Group</option>
                                <option value="worship">Worship Team</option>
                                <option value="dcg">DCG Leaders</option>
                                <option value="new">New Members</option>
                              </select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Message Content</FormLabel>
                              <FormControl>
                                <textarea 
                                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                  placeholder="Enter your message content here..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="channels"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Send Via</FormLabel>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button 
                                  type="button"
                                  variant={selectedChannels.includes("email") ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => toggleChannel("email")}
                                >
                                  <Mail className="mr-1 h-4 w-4" />
                                  Email
                                </Button>
                                <Button 
                                  type="button"
                                  variant={selectedChannels.includes("sms") ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => toggleChannel("sms")}
                                >
                                  <MessageSquare className="mr-1 h-4 w-4" />
                                  SMS
                                </Button>
                                <Button 
                                  type="button"
                                  variant={selectedChannels.includes("whatsapp") ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => toggleChannel("whatsapp")}
                                >
                                  <Phone className="mr-1 h-4 w-4" />
                                  WhatsApp
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="sendNow"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                  }}
                                  className="h-4 w-4 mt-1"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Send Now</FormLabel>
                                <FormDescription>
                                  Uncheck to schedule for later
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {!form.watch("sendNow") && (
                          <>
                            <FormField
                              control={form.control}
                              name="scheduledDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Schedule Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="scheduledTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Schedule Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => form.reset()}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setMessagePreview(true)}
                          disabled={!form.formState.isValid}
                        >
                          Preview
                        </Button>
                        <Button type="submit" disabled={createCommunication.isPending}>
                          <Send className="mr-2 h-4 w-4" />
                          {createCommunication.isPending 
                            ? (form.watch("sendNow") ? 'Sending...' : 'Scheduling...')
                            : (form.watch("sendNow") ? "Send Message" : "Schedule Message")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-md border p-4">
                      <h3 className="text-lg font-medium mb-2">{form.watch("title")}</h3>
                      <div className="flex gap-2 mb-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          {form.watch("messageType")}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
                          To: {form.watch("audience")}
                        </span>
                      </div>
                      <div className="border-t pt-4 whitespace-pre-wrap">
                        {form.watch("content")}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <p>Sending via: {form.watch("channels").join(", ")}</p>
                          {!form.watch("sendNow") && form.watch("scheduledDate") && (
                            <p>Scheduled for: {form.watch("scheduledDate")} at {form.watch("scheduledTime")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setMessagePreview(false)}
                      >
                        Edit
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)} disabled={createCommunication.isPending}>
                        <Send className="mr-2 h-4 w-4" />
                        {createCommunication.isPending 
                            ? (form.watch("sendNow") ? 'Confirming & Sending...' : 'Confirming & Scheduling...')
                            : (form.watch("sendNow") ? "Confirm & Send" : "Confirm & Schedule")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
                <CardDescription>
                  View all sent and scheduled messages.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search messages..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Sent To</TableHead>
                          <TableHead>Via</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingCommunications ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                          ))
                        ) : communicationsError ? (
                           <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-destructive">
                              Error: {communicationsError.message}
                            </TableCell>
                          </TableRow>
                        ) : filteredMessages.length > 0 ? (
                          filteredMessages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell className="font-medium">{message.title}</TableCell>
                              <TableCell className="capitalize">{message.message_type}</TableCell>
                              <TableCell className="capitalize">{message.audience}</TableCell>
                              <TableCell>{message.channels.join(', ')}</TableCell>
                              <TableCell>{format(new Date(message.scheduled_for || message.created_at), "PPp")}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                  message.status === "sent" 
                                    ? "bg-green-50 text-green-700 ring-green-600/20" 
                                    : "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                                }`}>
                                  {message.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">View</Button>
                                  <Button variant="ghost" size="sm">Copy</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No messages found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Create and manage reusable message templates.
                </CardDescription>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => toast.info("This feature is coming soon!")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
                  </div>
                ) : templatesError ? (
                  <p className="text-center py-8 text-destructive">Error loading templates: {templatesError.message}</p>
                ) : templates && templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            {template.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{template.category}</span>}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm line-clamp-3">
                            {template.content}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              form.setValue('content', template.content);
                              form.setValue('title', template.name);
                              toast.success(`Template "${template.name}" applied to composer.`);
                            }}
                          >
                            Use Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>No templates found.</p>
                    <p className="text-sm">Click "New Template" to create one.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                  Manage public announcements for your region.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Upcoming Events This Week</CardTitle>
                          <CardDescription>Visible on website and app</CardDescription>
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Active
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Sunday Service - 10:00 AM</li>
                        <li>Prayer Meeting - Wednesday, 6:30 PM</li>
                        <li>Youth Group - Friday, 7:00 PM</li>
                      </ul>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        Posted: Oct 23, 2023 | Expires: Oct 30, 2023
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Building Fund Campaign</CardTitle>
                          <CardDescription>Visible on website and app</CardDescription>
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Active
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>We're excited to announce that our building fund campaign has reached 65% of its goal! Thank you for your continued support and generosity.</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        Posted: Oct 15, 2023 | Expires: Nov 15, 2023
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <div className="flex justify-end mt-6">
                    <Button>
                      <Bell className="mr-2 h-4 w-4" />
                      New Announcement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalCommunication;

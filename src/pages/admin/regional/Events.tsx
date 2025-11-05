import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Users, Plus, CalendarDays, BarChart2, Search, AlertCircle, Trash2, MoreHorizontal, Edit, UserCheck, TrendingUp, TrendingDown, Eye, Filter, X, ChevronDown } from "lucide-react";
import { useRegionalEvents, useCreateEvent, useDeleteEvent, useUpdateEvent, NewEvent, UpdateEvent } from "@/hooks/useEvents";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { formatDateRange, formatTimeRange } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AttendanceManagementDialog } from "@/components/admin/regional/events/AttendanceManagementDialog";

const eventCategories = [
  'Conference', 'Worship', 'Revival', 'Outreach', 'Training', 'Workshop', 'Community Service', 'Bible Study', 'Retreat', 'Seminar', 'DCG Meeting', 'Other'
] as const;

// Mock data for demonstration
const mockEvents = [
  { id: 1, name: "Annual Conference", type: "Conference", date: "2023-11-15", time: "09:00 AM", location: "Main Hall", attendees: 120, status: "Upcoming" },
  { id: 2, name: "Prayer and Worship Night", type: "Worship", date: "2023-11-22", time: "06:00 PM", location: "Sanctuary", attendees: 85, status: "Upcoming" },
  { id: 3, name: "Youth Revival Meeting", type: "Revival", date: "2023-10-10", time: "04:00 PM", location: "Youth Center", attendees: 150, status: "Completed" },
  { id: 4, name: "Community Outreach", type: "Outreach", date: "2023-12-05", time: "10:00 AM", location: "Downtown Area", attendees: 45, status: "Upcoming" },
];

// Form schema for event creation
const eventSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters." }),
  category: z.enum(eventCategories),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Please select a start date." }),
  start_time: z.string().min(1, { message: "Please provide a start time." }),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location_name: z.string().min(3, { message: "Please provide a location." }),
  address: z.string().min(10, { message: "Please provide a full address for map display." }),
  capacity: z.coerce.number().positive().int().optional(),
  image_file: z.instanceof(File).optional(),
  image_files: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
  gallery_images: z.array(z.instanceof(File)).max(10, "Maximum 10 gallery images allowed").optional(),
  registration_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organizer_name: z.string().optional(),
  organizer_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  organizer_phone: z.string().optional(),
  requirements: z.string().max(500).optional(),
  testimonials: z.array(z.object({
    name: z.string().min(2, "Name is required"),
    role: z.string().min(2, "Role is required"),
    content: z.string().min(10, "Content must be at least 10 characters").max(300, "Content must be less than 300 characters"),
    rating: z.coerce.number().min(1).max(5).default(5),
  })).optional(),
  faqs: z.array(z.object({
    question: z.string().min(5, "Question must be at least 5 characters").max(200, "Question must be less than 200 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters").max(500, "Answer must be less than 500 characters"),
  })).optional(),
  is_public: z.boolean().default(true),
  is_featured: z.boolean().default(false),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after or same as start date",
  path: ["end_date"]
});

const RegionalEvents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("3months");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drilldownEvent, setDrilldownEvent] = useState<any>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState<string[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const { toast } = useToast();

  const { userRegion } = useAuth();
  const { data: events, isLoading, isError, error } = useRegionalEvents();
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      location_name: "",
      address: "",
      registration_url: "",
      organizer_name: "",
      organizer_email: "",
      organizer_phone: "",
      requirements: "",
      is_public: true,
      testimonials: [],
      faqs: [],
    },
  });

  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  const { fields: faqFields, append: appendFAQ, remove: removeFAQ } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    return events.filter(event => 
      (event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.category && event.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location_name && event.location_name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [events, searchTerm]);
  
  const upcomingEvents = React.useMemo(() => filteredEvents.filter(e => new Date(e.start_datetime) >= new Date() && e.status !== 'Cancelled'), [filteredEvents]);
  const pastEvents = React.useMemo(() => filteredEvents.filter(e => new Date(e.start_datetime) < new Date() || e.status === 'Completed' || e.status === 'Cancelled'), [filteredEvents]);

  // Analytics calculations using real data
  const analyticsData = React.useMemo(() => {
    if (!events || !attendanceData) return {
      totalEvents: 0,
      avgAttendance: 0,
      totalAttendance: 0,
      categoryBreakdown: [],
      attendanceTrend: [],
      topPerformingEvents: [],
      categoryPerformance: [],
      monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 }
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Event counts by category
    const categoryBreakdown = eventCategories.map(category => ({
      category,
      count: events.filter(e => e.category === category).length,
      attendance: attendanceData
        .filter(a => events.find(e => e.name === a.event_name)?.category === category)
        .reduce((sum, a) => sum + a.total_present, 0)
    })).filter(c => c.count > 0);

    // Top performing events by attendance
    const topPerformingEvents = attendanceData
      .sort((a, b) => b.total_present - a.total_present)
      .slice(0, 5)
      .map(event => ({
        name: event.event_name,
        attendance: event.total_present,
        date: event.event_date,
        attendanceRate: event.total_present > 0 ? Math.round((event.total_present / (event.total_present + event.total_absent)) * 100) : 0
      }));

    // Monthly attendance trend
    const attendanceTrend = attendanceData
      .slice(0, 12)
      .reverse()
      .map(event => ({
        date: event.event_date,
        attendance: event.total_present,
        name: event.event_name.length > 20 ? `${event.event_name.substring(0, 20)}...` : event.event_name
      }));

    // This month vs last month
    const thisMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const lastMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
    });

    const thisMonthAttendance = thisMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const lastMonthAttendance = lastMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const monthlyChange = lastMonthAttendance > 0 ? Math.round(((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100) : 0;

    return {
      totalEvents: events.length,
      avgAttendance: attendanceData.length > 0 ? Math.round(attendanceData.reduce((sum, e) => sum + e.total_present, 0) / attendanceData.length) : 0,
      totalAttendance: attendanceData.reduce((sum, e) => sum + e.total_present, 0),
      categoryBreakdown,
      attendanceTrend,
      topPerformingEvents,
      categoryPerformance: categoryBreakdown,
      monthlyComparison: { thisMonth: thisMonthAttendance, lastMonth: lastMonthAttendance, change: monthlyChange }
    };
  }, [events, attendanceData]);

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    try {
      // Upload multiple images if provided
      let uploadedImageUrls: string[] = [];
      if (values.image_files && values.image_files.length > 0) {
        for (const file of values.image_files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrl);
        }
      } else if (values.image_file) {
        // Fallback to single image upload for backward compatibility
        const fileExt = values.image_file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, values.image_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime = null;
      
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }
      
      const newEventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'created_by'> = {
        name: values.name,
        description: values.description || null,
        category: values.category,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        location_name: values.location_name,
        address: values.address || null,
        image_url: uploadedImageUrls[0] || null, // Use first image as primary
        capacity: values.capacity || null,
        is_public: values.is_public,
        is_featured: values.is_featured,
        status: 'Upcoming',
        dcg_id: null,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        organizer_phone: values.organizer_phone || null,
        requirements: values.requirements || null,
      };

      const createdEvent = await createEventMutation.mutateAsync(newEventData);
      
      // Insert all images into event_images table
      if (uploadedImageUrls.length > 0 && createdEvent) {
        const imageRecords = uploadedImageUrls.map((url, index) => ({
          event_id: createdEvent.id,
          image_url: url,
          display_order: index,
          is_hero_image: true,
        }));
        
        const { error: imageError } = await supabase
          .from('event_images')
          .insert(imageRecords);
        
        if (imageError) throw imageError;
      }
      
      // Insert gallery images if provided
      if (values.gallery_images && values.gallery_images.length > 0 && createdEvent) {
        const galleryImageUrls: string[] = [];
        
        for (const file of values.gallery_images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          galleryImageUrls.push(publicUrl);
        }
        
        // Insert gallery images with is_hero_image: false
        const galleryRecords = galleryImageUrls.map((url, index) => ({
          event_id: createdEvent.id,
          image_url: url,
          display_order: index,
          is_hero_image: false,
        }));
        
        const { error: galleryError } = await supabase
          .from('event_images')
          .insert(galleryRecords);
        
        if (galleryError) throw galleryError;
      }
      
      // Insert testimonials if provided
      if (values.testimonials && values.testimonials.length > 0 && createdEvent) {
        const testimonialsData = values.testimonials.map((t, index) => ({
          event_id: createdEvent.id,
          name: t.name,
          role: t.role,
          content: t.content,
          rating: t.rating,
          display_order: index,
        }));
        
        const { error: testimonialError } = await supabase
          .from('event_testimonials')
          .insert(testimonialsData);
        
        if (testimonialError) throw testimonialError;
      }
      
      // Insert FAQs if provided
      if (values.faqs && values.faqs.length > 0 && createdEvent) {
        const faqsData = values.faqs.map((faq, index) => ({
          event_id: createdEvent.id,
          question: faq.question,
          answer: faq.answer,
          display_order: index,
        }));
        
        const { error: faqError } = await supabase
          .from('event_faqs')
          .insert(faqsData);
        
        if (faqError) throw faqError;
      }

      toast({ title: "Success", description: "Event created successfully with images, testimonials and FAQs." });
      form.reset();
      setImagePreviews([]);
      setGalleryPreviews([]);
      setCreateEventDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not create event.", variant: "destructive" });
    }
  }
  
  const handleDelete = (id: string) => {
    deleteEventMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Success", description: "Event deleted successfully." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Could not delete event.", variant: "destructive" });
      }
    });
  };

  const handleAttendance = (event: any) => {
    setSelectedEvent(event);
    setAttendanceDialogOpen(true);
  };

  async function onEditSubmit(values: z.infer<typeof eventSchema>) {
    if (!eventToEdit) return;
    
    try {
      // Handle new image uploads (if any)
      let uploadedImageUrls: string[] = [];
      if (values.image_files && values.image_files.length > 0) {
        for (const file of values.image_files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrl);
        }
        
        // Delete old hero images from event_images table
        await supabase
          .from('event_images')
          .delete()
          .eq('event_id', eventToEdit.id)
          .eq('is_hero_image', true);
        
        // Insert new images
        const imageRecords = uploadedImageUrls.map((url, index) => ({
          event_id: eventToEdit.id,
          image_url: url,
          display_order: index,
          is_hero_image: true,
        }));
        
        await supabase
          .from('event_images')
          .insert(imageRecords);
      }
      
      // Delete marked gallery images
      if (imagesToDelete.length > 0) {
        await supabase
          .from('event_images')
          .delete()
          .in('id', imagesToDelete);
      }

      // Upload and insert new gallery images if provided
      if (values.gallery_images && values.gallery_images.length > 0) {
        const galleryImageUrls: string[] = [];
        
        for (const file of values.gallery_images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          galleryImageUrls.push(publicUrl);
        }
        
        // Get remaining gallery images to calculate correct display_order
        const remainingImages = existingGalleryImages.filter(
          img => !imagesToDelete.includes(img.id)
        );
        const startOrder = remainingImages.length;
        
        // Insert new gallery images with is_hero_image: false
        const galleryRecords = galleryImageUrls.map((url, index) => ({
          event_id: eventToEdit.id,
          image_url: url,
          display_order: startOrder + index,
          is_hero_image: false,
        }));
        
        await supabase
          .from('event_images')
          .insert(galleryRecords);
      }

      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime = null;
      
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }
      
      const updateData: UpdateEvent & { id: string } = {
        id: eventToEdit.id,
        name: values.name,
        description: values.description || null,
        category: values.category,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        location_name: values.location_name,
        address: values.address || null,
        image_url: uploadedImageUrls[0] || eventToEdit.image_url,
        capacity: values.capacity || null,
        is_public: values.is_public,
        is_featured: values.is_featured,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        organizer_phone: values.organizer_phone || null,
        requirements: values.requirements || null,
      };

      await updateEventMutation.mutateAsync(updateData);
      
      // Update testimonials
      await supabase
        .from('event_testimonials')
        .delete()
        .eq('event_id', eventToEdit.id);
      
      if (values.testimonials && values.testimonials.length > 0) {
        const testimonialsData = values.testimonials.map((t, index) => ({
          event_id: eventToEdit.id,
          name: t.name,
          role: t.role,
          content: t.content,
          rating: t.rating,
          display_order: index,
        }));
        
        await supabase
          .from('event_testimonials')
          .insert(testimonialsData);
      }
      
      // Update FAQs
      await supabase
        .from('event_faqs')
        .delete()
        .eq('event_id', eventToEdit.id);
      
      if (values.faqs && values.faqs.length > 0) {
        const faqsData = values.faqs.map((faq, index) => ({
          event_id: eventToEdit.id,
          question: faq.question,
          answer: faq.answer,
          display_order: index,
        }));
        
        await supabase
          .from('event_faqs')
          .insert(faqsData);
      }

      toast({ title: "Success", description: "Event updated successfully." });
      form.reset();
      setEditImagePreviews([]);
      setEditGalleryPreviews([]);
      setExistingGalleryImages([]);
      setImagesToDelete([]);
      setEditEventDialogOpen(false);
      setEventToEdit(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not update event.", variant: "destructive" });
    }
  }

  const handleEdit = async (event: any) => {
    setEventToEdit(event);
    
    // Fetch existing hero images for preview
    const { data: heroImages } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_hero_image', true)
      .order('display_order');
    
    if (heroImages && heroImages.length > 0) {
      setEditImagePreviews(heroImages.map(img => img.image_url));
    } else {
      setEditImagePreviews([]);
    }
    
    // Fetch existing gallery images
    const { data: galleryImages } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_hero_image', false)
      .order('display_order');
    
    if (galleryImages) {
      setExistingGalleryImages(galleryImages);
    } else {
      setExistingGalleryImages([]);
    }
    
    // Reset deletion tracking
    setImagesToDelete([]);
    setEditGalleryPreviews([]);
    
    // Fetch existing testimonials
    const { data: existingTestimonials } = await supabase
      .from('event_testimonials')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order');
    
    // Fetch existing FAQs
    const { data: existingFaqs } = await supabase
      .from('event_faqs')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order');
    
    // Parse datetime into date and time
    const startDate = new Date(event.start_datetime);
    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
    
    // Pre-populate form
    form.reset({
      name: event.name,
      category: event.category,
      description: event.description || "",
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate ? endDate.toISOString().split('T')[0] : "",
      end_time: endDate ? endDate.toTimeString().slice(0, 5) : "",
      location_name: event.location_name,
      address: event.address || "",
      capacity: event.capacity || undefined,
      registration_url: event.registration_url || "",
      organizer_name: event.organizer_name || "",
      organizer_email: event.organizer_email || "",
      organizer_phone: event.organizer_phone || "",
      requirements: event.requirements || "",
      is_public: event.is_public,
      is_featured: event.is_featured,
      testimonials: existingTestimonials?.map(t => ({
        name: t.name,
        role: t.role,
        content: t.content,
        rating: t.rating,
      })) || [],
      faqs: existingFaqs?.map(f => ({
        question: f.question,
        answer: f.answer,
      })) || [],
    });
    
    setEditEventDialogOpen(true);
  };

  const renderTableBody = (eventList: typeof events) => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
        </TableRow>
      ));
    }
    if (!eventList || eventList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24">No events found</TableCell>
        </TableRow>
      );
    }
    return eventList.map((event) => (
      <TableRow key={event.id}>
        <TableCell className="font-medium">{event.name}</TableCell>
        <TableCell>{event.category}</TableCell>
        <TableCell>{formatDateRange(event.start_datetime, event.end_datetime)}</TableCell>
        <TableCell>{formatTimeRange(event.start_datetime, event.end_datetime)}</TableCell>
        <TableCell>{event.location_name}</TableCell>
        <TableCell>{event.capacity ?? 'N/A'}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(event)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAttendance(event)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Record Attendance
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        
        <Tabs defaultValue="upcoming">
          <TabsList className="grid grid-cols-1 md:grid-cols-2 w-full max-w-lg">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  View and manage scheduled events in your region.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search events..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setCreateEventDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading events</AlertTitle>
                    <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderTableBody(upcomingEvents)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  View history of completed events.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search past events..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading events</AlertTitle>
                    <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderTableBody(pastEvents)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Plan and schedule a new event for your region.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Annual Conference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                        >
                          <option value="">Select event type</option>
                          {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Hall" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State ZIP" {...field} />
                      </FormControl>
                      <FormDescription>
                        Full address for map display on event detail page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected turnout</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image_files"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Hero Images (Slider)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 5);
                            onChange(limitedFiles);
                            setImagePreviews(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 5 images for the event hero slider. First image will be primary.</FormDescription>
                      
                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormDescription>
                        Recommended: 1920x1080px, max 2MB (JPG, PNG)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gallery_images"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Gallery Images</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 10);
                            onChange(limitedFiles);
                            setGalleryPreviews(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 10 images for the event gallery section</FormDescription>
                      
                      {/* Gallery Image Previews */}
                      {galleryPreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {galleryPreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border">
                              <img src={preview} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full" />
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="registration_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Registration URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://forms.google.com/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        External registration link (Google Forms, Eventbrite, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="organizer@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Requirements/Prerequisites (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What attendees should bring or prepare..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[120px]"
                          placeholder="Provide details about the event..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Testimonials Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Testimonials (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Add testimonials from previous attendees</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      {testimonialFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-sm">Testimonial {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTestimonial(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`testimonials.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="John Doe" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`testimonials.${index}.role`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role/Title</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Previous Attendee" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.content`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Testimonial Content</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="This event was amazing..." maxLength={300} rows={3} />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/300 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.rating`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rating (1-5)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} max={5} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendTestimonial({ name: "", role: "", content: "", rating: 5 })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Testimonial
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                {/* FAQs Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">FAQs (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Add frequently asked questions</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      {faqFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-sm">FAQ {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFAQ(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`faqs.${index}.question`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="How do I register?" />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/200 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`faqs.${index}.answer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Answer</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="You can register by..." maxLength={500} rows={3} />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/500 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendFAQ({ question: "", answer: "" })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add FAQ
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                 <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Event</FormLabel>
                        <FormDescription>
                          Display this event on the public website and regional homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Event</FormLabel>
                        <FormDescription>
                          Highlight this event on the homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editEventDialogOpen} onOpenChange={setEditEventDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details, images, testimonials, and FAQs.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Annual Conference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                        >
                          <option value="">Select event type</option>
                          {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Hall" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State ZIP" {...field} />
                      </FormControl>
                      <FormDescription>
                        Full address for map display on event detail page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected turnout</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image_files"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Hero Images (Slider)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 5);
                            onChange(limitedFiles);
                            setEditImagePreviews(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 5 images for the event hero slider. Leave empty to keep existing images.</FormDescription>
                      
                      {/* Image Previews */}
                      {editImagePreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {editImagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormDescription>
                        Recommended: 1920x1080px, max 2MB (JPG, PNG)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gallery_images"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Gallery Images</FormLabel>
                      
                      {/* Existing Gallery Images */}
                      {existingGalleryImages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">Existing Gallery Images (click X to remove)</p>
                          <div className="grid grid-cols-5 gap-2">
                            {existingGalleryImages
                              .filter(img => !imagesToDelete.includes(img.id))
                              .map((image) => (
                                <div key={image.id} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                                  <img src={image.image_url} alt={`Gallery ${image.display_order + 1}`} className="object-cover w-full h-full" />
                                  <button
                                    type="button"
                                    onClick={() => setImagesToDelete(prev => [...prev, image.id])}
                                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 10);
                            onChange(limitedFiles);
                            setEditGalleryPreviews(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 10 new images for the event gallery section</FormDescription>
                      
                      {/* New Gallery Image Previews */}
                      {editGalleryPreviews.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2 mt-4">New Images to Upload</p>
                          <div className="grid grid-cols-5 gap-2">
                            {editGalleryPreviews.map((preview, idx) => (
                              <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border">
                                <img src={preview} alt={`New Gallery ${idx + 1}`} className="object-cover w-full h-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="registration_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Registration URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://forms.google.com/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        External registration link (Google Forms, Eventbrite, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="organizer@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Requirements/Prerequisites (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What attendees should bring or prepare..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[120px]"
                          placeholder="Provide details about the event..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Testimonials Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Testimonials (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Add testimonials from previous attendees</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      {testimonialFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-sm">Testimonial {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTestimonial(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`testimonials.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="John Doe" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`testimonials.${index}.role`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role/Title</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Previous Attendee" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.content`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Testimonial Content</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="This event was amazing..." maxLength={300} rows={3} />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/300 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.rating`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rating (1-5)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} max={5} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendTestimonial({ name: "", role: "", content: "", rating: 5 })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Testimonial
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                {/* FAQs Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">FAQs (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Add frequently asked questions</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      {faqFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-sm">FAQ {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFAQ(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`faqs.${index}.question`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="How do I register?" />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/200 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`faqs.${index}.answer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Answer</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="You can register by..." maxLength={500} rows={3} />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/500 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendFAQ({ question: "", answer: "" })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add FAQ
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                 <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Event</FormLabel>
                        <FormDescription>
                          Display this event on the public website and regional homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Event</FormLabel>
                        <FormDescription>
                          Highlight this event on the homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setEditEventDialogOpen(false);
                  setEventToEdit(null);
                  form.reset();
                  setEditImagePreviews([]);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attendance Management Dialog */}
      {selectedEvent && (
        <AttendanceManagementDialog
          isOpen={attendanceDialogOpen}
          onClose={() => {
            setAttendanceDialogOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
        />
      )}
    </RegionalAdminLayout>
  );
};

export default RegionalEvents;

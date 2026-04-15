import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Users, Plus, CalendarDays, BarChart2, Search, AlertCircle, Trash2, MoreHorizontal, Edit, UserCheck, TrendingUp, TrendingDown, Eye, EyeOff, Filter, X, ChevronDown, Languages, Copy, FileText, Star, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { generateSlug, isValidSlug } from "@/utils/slugUtils";
import { useRegionalEvents, useCreateEvent, useDeleteEvent, useUpdateEvent, NewEvent, UpdateEvent } from "@/hooks/useEvents";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencies } from "@/hooks/useCurrencies";
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
  DropdownMenuSeparator,
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
  name_fr: z.string().optional(),
  slug: z.string().min(3, { message: "URL slug must be at least 3 characters." }).max(100, "URL slug must be less than 100 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Only lowercase letters, numbers, and hyphens allowed").optional().or(z.literal("")),
  category: z.enum(eventCategories),
  description: z.string().optional(),
  description_fr: z.string().optional(),
  start_date: z.string().min(1, { message: "Please select a start date." }),
  start_time: z.string().min(1, { message: "Please provide a start time." }),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location_name: z.string().min(3, { message: "Please provide a location." }),
  location_name_fr: z.string().optional(),
  address: z.string().min(10, { message: "Please provide a full address for map display." }),
  address_fr: z.string().optional(),
  capacity: z.coerce.number().positive().int().optional(),
  cost: z.coerce.number().min(0, "Cost cannot be negative").optional().default(0),
  cost_currency_code: z.string().optional(),
  event_card_image: z.instanceof(File).optional(),
  event_card_image_fr: z.instanceof(File).optional(),
  image_file: z.instanceof(File).optional(),
  image_files: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
  image_files_fr: z.array(z.instanceof(File)).max(5, "Maximum 5 French hero images allowed").optional(),
  gallery_images: z.array(z.instanceof(File)).max(10, "Maximum 10 gallery images allowed").optional(),
  gallery_images_fr: z.array(z.instanceof(File)).max(10, "Maximum 10 French gallery images allowed").optional(),
  registration_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organizer_name: z.string().optional(),
  organizer_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  whatsapp_contact: z.string().optional(),
  testimonials: z.array(z.object({
    name: z.string().min(2, "Name is required"),
    name_fr: z.string().optional(),
    role: z.string().min(2, "Role is required"),
    role_fr: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters").max(300, "Content must be less than 300 characters"),
    content_fr: z.string().max(300).optional(),
    rating: z.coerce.number().min(1).max(5).default(5),
  })).optional(),
  faqs: z.array(z.object({
    question: z.string().min(5, "Question must be at least 5 characters").max(200, "Question must be less than 200 characters"),
    question_fr: z.string().max(200).optional(),
    answer: z.string().min(10, "Answer must be at least 10 characters").max(500, "Answer must be less than 500 characters"),
    answer_fr: z.string().max(500).optional(),
  })).optional(),
  speakers: z.array(z.object({
    id: z.string().optional().transform(val => val === '' ? undefined : val),
    name: z.string().min(2, "Speaker name is required"),
    name_fr: z.string().optional(),
    title: z.string().min(2, "Speaker title is required"),
    title_fr: z.string().optional(),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    bio_fr: z.string().max(500).optional(),
    photo: z.instanceof(File).optional(),
    existing_photo_url: z.string().optional(),
    linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    twitter_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    display_order: z.number().optional(),
  })).optional(),
  is_public: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_special: z.boolean().default(false),
  attendance_target: z.coerce.number().positive().int().optional(),
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("3months");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drilldownEvent, setDrilldownEvent] = useState<any>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [cardImagePreviewFr, setCardImagePreviewFr] = useState<string>('');
  const [editCardImagePreview, setEditCardImagePreview] = useState<string>('');
  const [editCardImagePreviewFr, setEditCardImagePreviewFr] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagePreviewsFr, setImagePreviewsFr] = useState<string[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImagePreviewsFr, setEditImagePreviewsFr] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryPreviewsFr, setGalleryPreviewsFr] = useState<string[]>([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState<string[]>([]);
  const [editGalleryPreviewsFr, setEditGalleryPreviewsFr] = useState<string[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [deleteCardImage, setDeleteCardImage] = useState<boolean>(false);
  const [existingHeroImages, setExistingHeroImages] = useState<any[]>([]);
  const [heroImagesToDelete, setHeroImagesToDelete] = useState<string[]>([]);
  const [existingHeroImagesFr, setExistingHeroImagesFr] = useState<any[]>([]);
  const [existingGalleryImagesFr, setExistingGalleryImagesFr] = useState<any[]>([]);
  const [heroImagesFrToDelete, setHeroImagesFrToDelete] = useState<string[]>([]);
  const [galleryImagesFrToDelete, setGalleryImagesFrToDelete] = useState<string[]>([]);
  const [speakerPhotoPreviews, setSpeakerPhotoPreviews] = useState<{[key: number]: string}>({});
  const [autoGeneratedSlug, setAutoGeneratedSlug] = useState<string>('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { toast } = useToast();

  const { userRegion, user } = useAuth();
  const { data: events, isLoading, isError, error } = useRegionalEvents();
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: currencies } = useCurrencies();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      name_fr: "",
      description: "",
      description_fr: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      location_name: "",
      location_name_fr: "",
      address: "",
      address_fr: "",
      registration_url: "",
      organizer_name: "",
      organizer_email: "",
      is_public: true,
      testimonials: [],
      faqs: [],
      speakers: [],
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

  const { fields: speakerFields, append: appendSpeaker, remove: removeSpeaker } = useFieldArray({
    control: form.control,
    name: "speakers",
  });

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return events.filter(event => {
      // Search filter
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.category && event.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location_name && event.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      // Event type filter
      if (eventTypeFilter === 'regional' && (event.dcg_id || event.is_special)) return false;
      if (eventTypeFilter === 'dcg' && !event.dcg_id) return false;
      if (eventTypeFilter === 'special' && !event.is_special) return false;

      // Time filter
      if (timeFilter === 'upcoming' && new Date(event.start_datetime) < now) return false;
      if (timeFilter === 'past' && new Date(event.start_datetime) >= now) return false;

      return true;
    });
  }, [events, searchTerm, eventTypeFilter, timeFilter]);

  // Analytics calculations using real data
  const analyticsData = React.useMemo(() => {
    if (!events || !attendanceData) return {
      total: { count: 0, avgAttendance: 0, growth: 0 },
      regional: { count: 0, avgAttendance: 0, growth: 0 },
      dcg: { count: 0, avgAttendance: 0, growth: 0 },
      special: { count: 0, avgAttendance: 0, growth: 0 },
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const regionalEvents = events.filter(e => !e.dcg_id && !e.is_special);
    const dcgEvents = events.filter(e => !!e.dcg_id);
    const specialEvents = events.filter(e => e.is_special);

    const getAvgAttendance = (eventList: typeof events) => {
      const eventIds = eventList.map(e => e.id);
      const matched = attendanceData.filter(a => a.source_event_id && eventIds.includes(a.source_event_id));
      return matched.length > 0 ? Math.round(matched.reduce((s, a) => s + a.total_present, 0) / matched.length) : 0;
    };

    const getGrowth = (eventList: typeof events) => {
      const eventIds = eventList.map(e => e.id);
      const thisMonthAtt = attendanceData
        .filter(a => {
          const d = new Date(a.event_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.source_event_id && eventIds.includes(a.source_event_id);
        });
      const lastMonthAtt = attendanceData
        .filter(a => {
          const d = new Date(a.event_date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && a.source_event_id && eventIds.includes(a.source_event_id);
        });
      const thisAvg = thisMonthAtt.length > 0 ? thisMonthAtt.reduce((s, a) => s + a.total_present, 0) / thisMonthAtt.length : 0;
      const lastAvg = lastMonthAtt.length > 0 ? lastMonthAtt.reduce((s, a) => s + a.total_present, 0) / lastMonthAtt.length : 0;
      return lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
    };

    const totalAvg = attendanceData.length > 0 ? Math.round(attendanceData.reduce((s, a) => s + a.total_present, 0) / attendanceData.length) : 0;
    // Total growth uses all attendance data
    const thisMonthAll = attendanceData.filter(a => { const d = new Date(a.event_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const lastMonthAll = attendanceData.filter(a => { const d = new Date(a.event_date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; });
    const thisAllAvg = thisMonthAll.length > 0 ? thisMonthAll.reduce((s, a) => s + a.total_present, 0) / thisMonthAll.length : 0;
    const lastAllAvg = lastMonthAll.length > 0 ? lastMonthAll.reduce((s, a) => s + a.total_present, 0) / lastMonthAll.length : 0;
    const totalGrowth = lastAllAvg > 0 ? Math.round(((thisAllAvg - lastAllAvg) / lastAllAvg) * 100) : 0;

    return {
      total: { count: events.length, avgAttendance: totalAvg, growth: totalGrowth },
      regional: { count: regionalEvents.length, avgAttendance: getAvgAttendance(regionalEvents), growth: getGrowth(regionalEvents) },
      dcg: { count: dcgEvents.length, avgAttendance: getAvgAttendance(dcgEvents), growth: getGrowth(dcgEvents) },
      special: { count: specialEvents.length, avgAttendance: getAvgAttendance(specialEvents), growth: getGrowth(specialEvents) },
    };
  }, [events, attendanceData]);

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    try {
      // Upload event card image first (if provided)
      let eventCardImageUrl: string | null = null;
      if (values.event_card_image) {
        const fileExt = values.event_card_image.name.split('.').pop();
        const fileName = `card-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, values.event_card_image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        eventCardImageUrl = publicUrl;
      }

      // Upload French event card image (if provided)
      let eventCardImageUrlFr: string | null = null;
      if (values.event_card_image_fr) {
        const fileExt = values.event_card_image_fr.name.split('.').pop();
        const fileName = `card-fr-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, values.event_card_image_fr);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        eventCardImageUrlFr = publicUrl;
      }

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

      // Upload French hero images if provided
      let uploadedImageUrlsFr: string[] = [];
      if (values.image_files_fr && values.image_files_fr.length > 0) {
        for (const file of values.image_files_fr) {
          const fileExt = file.name.split('.').pop();
          const fileName = `fr-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          uploadedImageUrlsFr.push(publicUrl);
        }
      }

      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime = null;
      
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }
      
      // Generate or use provided slug
      let finalSlug = values.slug && values.slug.trim() ? values.slug : generateSlug(values.name);
      
      // Check slug uniqueness
      if (finalSlug) {
        const { data: existingEvent } = await supabase
          .from('events')
          .select('slug')
          .eq('slug', finalSlug)
          .single();
        
        if (existingEvent) {
          // If slug exists, append a number
          let counter = 2;
          let uniqueSlug = `${finalSlug}-${counter}`;
          while (true) {
            const { data } = await supabase
              .from('events')
              .select('slug')
              .eq('slug', uniqueSlug)
              .single();
            if (!data) break;
            counter++;
            uniqueSlug = `${finalSlug}-${counter}`;
          }
          finalSlug = uniqueSlug;
        }
      }
      
      const newEventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'created_by'> = {
        name: values.name,
        name_fr: values.name_fr || null,
        slug: finalSlug || null,
        description: values.description || null,
        description_fr: values.description_fr || null,
        category: values.category,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        location_name: values.location_name,
        location_name_fr: values.location_name_fr || null,
        address: values.address || null,
        address_fr: values.address_fr || null,
        image_url: eventCardImageUrl || uploadedImageUrls[0] || null, // Use card image first, fallback to first hero
        image_url_fr: eventCardImageUrlFr || uploadedImageUrlsFr[0] || null, // French card image or first French hero
        capacity: values.capacity || null,
        attendance_target: values.attendance_target || null,
        cost: values.cost || 0,
        cost_currency_code: values.cost_currency_code || null,
        is_public: values.is_public,
        is_featured: values.is_featured,
        is_special: values.is_special,
        status: 'Upcoming',
        dcg_id: null,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        whatsapp_contact: values.whatsapp_contact || null,
      };

      const createdEvent = await createEventMutation.mutateAsync(newEventData);
      
      // Insert all images into event_images table
      if (uploadedImageUrls.length > 0 && createdEvent) {
        const imageRecords = uploadedImageUrls.map((url, index) => ({
          event_id: createdEvent.id,
          image_url: url,
          image_url_fr: uploadedImageUrlsFr[index] || null,
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
      
      // Insert French gallery images if provided
      if (values.gallery_images_fr && values.gallery_images_fr.length > 0 && createdEvent) {
        const galleryImageUrlsFr: string[] = [];
        
        for (const file of values.gallery_images_fr) {
          const fileExt = file.name.split('.').pop();
          const fileName = `fr-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          galleryImageUrlsFr.push(publicUrl);
        }
        
        // Update existing gallery records with French URLs
        if (galleryImageUrlsFr.length > 0) {
          const { data: existingGalleryImages } = await supabase
            .from('event_images')
            .select('id')
            .eq('event_id', createdEvent.id)
            .eq('is_hero_image', false)
            .order('display_order', { ascending: true });
          
          if (existingGalleryImages) {
            for (let i = 0; i < Math.min(galleryImageUrlsFr.length, existingGalleryImages.length); i++) {
              await supabase
                .from('event_images')
                .update({ image_url_fr: galleryImageUrlsFr[i] })
                .eq('id', existingGalleryImages[i].id);
            }
          }
        }
      }
      
      // Insert testimonials if provided
      if (values.testimonials && values.testimonials.length > 0 && createdEvent) {
        const testimonialsData = values.testimonials.map((t, index) => ({
          event_id: createdEvent.id,
          name: t.name,
          name_fr: t.name_fr || null,
          role: t.role,
          role_fr: t.role_fr || null,
          content: t.content,
          content_fr: t.content_fr || null,
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
          question_fr: faq.question_fr || null,
          answer: faq.answer,
          answer_fr: faq.answer_fr || null,
          display_order: index,
        }));
        
        const { error: faqError } = await supabase
          .from('event_faqs')
          .insert(faqsData);
        
        if (faqError) throw faqError;
      }

      // Upload speaker photos and create speaker records
      if (values.speakers && values.speakers.length > 0 && createdEvent) {
        for (let i = 0; i < values.speakers.length; i++) {
          const speaker = values.speakers[i];
          let speakerPhotoUrl = null;

          // Upload speaker photo if provided
          if (speaker.photo) {
            const fileExt = speaker.photo.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${createdEvent.id}/speakers/${fileName}`;

            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('event-images')
              .upload(filePath, speaker.photo);

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);
              speakerPhotoUrl = publicUrl;
            }
          }

          // Insert speaker record
          const { error: speakerError } = await supabase
            .from('event_speakers')
            .insert({
              event_id: createdEvent.id,
              name: speaker.name,
              name_fr: speaker.name_fr || null,
              title: speaker.title,
              title_fr: speaker.title_fr || null,
              bio: speaker.bio || null,
              bio_fr: speaker.bio_fr || null,
              photo_url: speakerPhotoUrl,
              linkedin_url: speaker.linkedin_url || null,
              twitter_url: speaker.twitter_url || null,
              website_url: speaker.website_url || null,
              display_order: speaker.display_order || i,
            });

          if (speakerError) {
            console.error('Error creating speaker:', speakerError);
            toast({
              title: "Warning",
              description: `Event created but failed to add speaker: ${speaker.name}`,
              variant: "destructive",
            });
          }
        }
      }

      toast({ title: "Success", description: "Event created successfully with images, testimonials, FAQs and speakers." });
      form.reset();
      setCardImagePreview('');
      setImagePreviews([]);
      setGalleryPreviews([]);
      setSpeakerPhotoPreviews({});
      setDeleteCardImage(false);
      setExistingHeroImages([]);
      setHeroImagesToDelete([]);
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

  const handleDuplicate = async (event: any) => {
    setIsDuplicating(true);
    try {
      // 1. Fetch all related data
      const [testimonialsRes, faqsRes, speakersRes, heroImagesRes, galleryImagesRes] = await Promise.all([
        supabase.from('event_testimonials').select('*').eq('event_id', event.id).order('display_order'),
        supabase.from('event_faqs').select('*').eq('event_id', event.id).order('display_order'),
        supabase.from('event_speakers').select('*').eq('event_id', event.id).order('display_order'),
        supabase.from('event_images').select('*').eq('event_id', event.id).eq('is_hero_image', true).order('display_order'),
        supabase.from('event_images').select('*').eq('event_id', event.id).eq('is_hero_image', false).order('display_order'),
      ]);

      // 2. Generate unique slug for the copy
      const baseSlug = generateSlug(`${event.name} copy`);
      let finalSlug = baseSlug;
      let counter = 2;
      while (true) {
        const { data: existing } = await supabase.from('events').select('slug').eq('slug', finalSlug).single();
        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 3. Create the duplicated event
      const newEventData = {
        name: `${event.name} (Copy)`,
        name_fr: event.name_fr ? `${event.name_fr} (Copie)` : null,
        slug: finalSlug,
        description: event.description,
        description_fr: event.description_fr,
        category: event.category,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        location_name: event.location_name,
        location_name_fr: event.location_name_fr,
        address: event.address,
        address_fr: event.address_fr,
        image_url: event.image_url,
        image_url_fr: event.image_url_fr,
        capacity: event.capacity,
        cost: event.cost,
        cost_currency_code: event.cost_currency_code,
        is_public: false,
        is_featured: false,
        status: 'Upcoming',
        registration_url: event.registration_url,
        organizer_name: event.organizer_name,
        organizer_email: event.organizer_email,
        organizer_phone: event.organizer_phone,
        whatsapp_contact: event.whatsapp_contact,
        requirements: event.requirements,
        requirements_fr: event.requirements_fr,
      };

      const createdEvent = await createEventMutation.mutateAsync(newEventData as any);
      if (!createdEvent) throw new Error('Failed to create duplicated event');

      // 4. Copy hero images
      if (heroImagesRes.data?.length) {
        await supabase.from('event_images').insert(
          heroImagesRes.data.map((img, idx) => ({
            event_id: createdEvent.id,
            image_url: img.image_url,
            image_url_fr: img.image_url_fr,
            display_order: idx,
            is_hero_image: true,
          }))
        );
      }

      // 5. Copy gallery images
      if (galleryImagesRes.data?.length) {
        await supabase.from('event_images').insert(
          galleryImagesRes.data.map((img, idx) => ({
            event_id: createdEvent.id,
            image_url: img.image_url,
            image_url_fr: img.image_url_fr,
            display_order: idx,
            is_hero_image: false,
          }))
        );
      }

      // 6. Copy testimonials
      if (testimonialsRes.data?.length) {
        await supabase.from('event_testimonials').insert(
          testimonialsRes.data.map((t, idx) => ({
            event_id: createdEvent.id,
            name: t.name,
            name_fr: t.name_fr,
            role: t.role,
            role_fr: t.role_fr,
            content: t.content,
            content_fr: t.content_fr,
            rating: t.rating,
            display_order: idx,
          }))
        );
      }

      // 7. Copy FAQs
      if (faqsRes.data?.length) {
        await supabase.from('event_faqs').insert(
          faqsRes.data.map((f, idx) => ({
            event_id: createdEvent.id,
            question: f.question,
            question_fr: f.question_fr,
            answer: f.answer,
            answer_fr: f.answer_fr,
            display_order: idx,
          }))
        );
      }

      // 8. Copy speakers
      if (speakersRes.data?.length) {
        await supabase.from('event_speakers').insert(
          speakersRes.data.map((s, idx) => ({
            event_id: createdEvent.id,
            name: s.name,
            name_fr: s.name_fr,
            title: s.title,
            title_fr: s.title_fr,
            bio: s.bio,
            bio_fr: s.bio_fr,
            photo_url: s.photo_url,
            linkedin_url: s.linkedin_url,
            twitter_url: s.twitter_url,
            website_url: s.website_url,
            display_order: idx,
          }))
        );
      }

      toast({
        title: "Event Duplicated",
        description: `"${event.name}" has been duplicated. The copy is set to private - please review and update the dates before publishing.`,
      });

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to duplicate event.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleTogglePublic = async (event: any) => {
    const newStatus = !event.is_public;
    try {
      await updateEventMutation.mutateAsync({
        id: event.id,
        is_public: newStatus,
      });
      toast({
        title: newStatus ? "Event Made Public" : "Event Made Private",
        description: newStatus 
          ? `"${event.name}" is now visible on public pages.`
          : `"${event.name}" is now hidden from public pages.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update event visibility.",
        variant: "destructive",
      });
    }
  };

  const handleAttendance = (event: any) => {
    setSelectedEvent(event);
    setAttendanceDialogOpen(true);
  };

  async function onEditSubmit(values: z.infer<typeof eventSchema>) {
    if (!eventToEdit) return;
    
    try {
      // Handle event card image
      let eventCardImageUrl = eventToEdit.image_url; // Keep existing by default
      
      // Delete card image if marked for deletion
      if (deleteCardImage) {
        eventCardImageUrl = null;
      }
      
      // Upload new event card image if provided (overrides deletion)
      if (values.event_card_image) {
        const fileExt = values.event_card_image.name.split('.').pop();
        const fileName = `card-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, values.event_card_image);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);
          eventCardImageUrl = publicUrl;
        }
      }

      // Handle French event card image
      let eventCardImageUrlFr = eventToEdit.image_url_fr; // Keep existing by default
      
      // Upload new French event card image if provided
      if (values.event_card_image_fr) {
        const fileExt = values.event_card_image_fr.name.split('.').pop();
        const fileName = `card-fr-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, values.event_card_image_fr);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);
          eventCardImageUrlFr = publicUrl;
        }
      }

      // Delete marked hero images
      if (heroImagesToDelete.length > 0) {
        await supabase
          .from('event_images')
          .delete()
          .in('id', heroImagesToDelete);
      }

      // Handle new hero image uploads
      if (values.image_files && values.image_files.length > 0) {
        let uploadedImageUrls: string[] = [];
        
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
        
        // Get remaining hero images count for display_order calculation
        const remainingHeroCount = existingHeroImages.filter(
          img => !heroImagesToDelete.includes(img.id)
        ).length;
        
        // Insert new hero images with adjusted display_order
        const imageRecords = uploadedImageUrls.map((url, index) => ({
          event_id: eventToEdit.id,
          image_url: url,
          display_order: remainingHeroCount + index,
          is_hero_image: true,
        }));
        
        await supabase
          .from('event_images')
          .insert(imageRecords);
      }

      // Delete marked French hero images
      if (heroImagesFrToDelete.length > 0) {
        for (const imageId of heroImagesFrToDelete) {
          await supabase
            .from('event_images')
            .update({ image_url_fr: null })
            .eq('id', imageId);
        }
      }

      // Handle new French hero image uploads
      if (values.image_files_fr && values.image_files_fr.length > 0) {
        let uploadedImageUrlsFr: string[] = [];
        
        for (const file of values.image_files_fr) {
          const fileExt = file.name.split('.').pop();
          const fileName = `fr-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          uploadedImageUrlsFr.push(publicUrl);
        }
        
            // Get existing hero images to update with French URLs (by display order)
            const { data: heroImagesToUpdate } = await supabase
              .from('event_images')
              .select('id')
              .eq('event_id', eventToEdit.id)
              .eq('is_hero_image', true)
              .order('display_order', { ascending: true })
              .limit(uploadedImageUrlsFr.length);
        
        if (heroImagesToUpdate) {
          for (let i = 0; i < Math.min(uploadedImageUrlsFr.length, heroImagesToUpdate.length); i++) {
            await supabase
              .from('event_images')
              .update({ image_url_fr: uploadedImageUrlsFr[i] })
              .eq('id', heroImagesToUpdate[i].id);
          }
        }
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

      // Delete marked French gallery images
      if (galleryImagesFrToDelete.length > 0) {
        for (const imageId of galleryImagesFrToDelete) {
          await supabase
            .from('event_images')
            .update({ image_url_fr: null })
            .eq('id', imageId);
        }
      }

      // Handle new French gallery image uploads
      if (values.gallery_images_fr && values.gallery_images_fr.length > 0) {
        let uploadedGalleryUrlsFr: string[] = [];
        
        for (const file of values.gallery_images_fr) {
          const fileExt = file.name.split('.').pop();
          const fileName = `fr-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          uploadedGalleryUrlsFr.push(publicUrl);
        }
        
            // Get existing gallery images to update with French URLs (by display order)
            const { data: galleryImagesToUpdate } = await supabase
              .from('event_images')
              .select('id')
              .eq('event_id', eventToEdit.id)
              .eq('is_hero_image', false)
              .order('display_order', { ascending: true })
              .limit(uploadedGalleryUrlsFr.length);
        
        if (galleryImagesToUpdate) {
          for (let i = 0; i < Math.min(uploadedGalleryUrlsFr.length, galleryImagesToUpdate.length); i++) {
            await supabase
              .from('event_images')
              .update({ image_url_fr: uploadedGalleryUrlsFr[i] })
              .eq('id', galleryImagesToUpdate[i].id);
          }
        }
      }

      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime = null;
      
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }
      
      // Save slug history if slug changed
      const oldSlug = eventToEdit.slug;
      const newSlug = values.slug && values.slug.trim() ? values.slug : oldSlug;
      
      if (oldSlug && oldSlug !== newSlug && user?.id) {
        await supabase
          .from('event_slug_history')
          .insert({
            event_id: eventToEdit.id,
            old_slug: oldSlug,
            changed_by: user.id,
          });
      }
      
      const updateData: UpdateEvent & { id: string } = {
        id: eventToEdit.id,
        name: values.name,
        name_fr: values.name_fr || null,
        slug: newSlug || null,
        description: values.description || null,
        description_fr: values.description_fr || null,
        category: values.category,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        location_name: values.location_name,
        location_name_fr: values.location_name_fr || null,
        address: values.address || null,
        address_fr: values.address_fr || null,
        image_url: eventCardImageUrl,
        image_url_fr: eventCardImageUrlFr,
        capacity: values.capacity || null,
        attendance_target: values.attendance_target || null,
        cost: values.cost || 0,
        cost_currency_code: values.cost_currency_code || null,
        is_public: values.is_public,
        is_featured: values.is_featured,
        is_special: values.is_special,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        whatsapp_contact: values.whatsapp_contact || null,
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
          name_fr: t.name_fr || null,
          role: t.role,
          role_fr: t.role_fr || null,
          content: t.content,
          content_fr: t.content_fr || null,
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
          question_fr: faq.question_fr || null,
          answer: faq.answer,
          answer_fr: faq.answer_fr || null,
          display_order: index,
        }));
        
        await supabase
          .from('event_faqs')
          .insert(faqsData);
      }

      // Handle speakers - delete removed, update existing, add new
      if (values.speakers) {
        // Get current speakers from DB
        const { data: currentSpeakers } = await supabase
          .from('event_speakers')
          .select('id')
          .eq('event_id', eventToEdit.id);

        const currentIds = currentSpeakers?.map(s => s.id) || [];
        const isValidUuid = (id: string | undefined): id is string => 
          !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const updatedIds = values.speakers.map(s => s.id).filter(isValidUuid);

        // Delete removed speakers
        const toDelete = currentIds.filter(id => !updatedIds.includes(id));
        if (toDelete.length > 0) {
          await supabase
            .from('event_speakers')
            .delete()
            .in('id', toDelete);
        }

        // Update or insert speakers
        for (let i = 0; i < values.speakers.length; i++) {
          const speaker = values.speakers[i];
          let speakerPhotoUrl = speaker.existing_photo_url || null;

          // Upload new photo if provided
          if (speaker.photo && speaker.photo instanceof File) {
            const fileExt = speaker.photo.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${eventToEdit.id}/speakers/${fileName}`;

            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('event-images')
              .upload(filePath, speaker.photo);

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);
              speakerPhotoUrl = publicUrl;
            }
          }

          const speakerData = {
            event_id: eventToEdit.id,
            name: speaker.name,
            name_fr: speaker.name_fr || null,
            title: speaker.title,
            title_fr: speaker.title_fr || null,
            bio: speaker.bio || null,
            bio_fr: speaker.bio_fr || null,
            photo_url: speakerPhotoUrl,
            linkedin_url: speaker.linkedin_url || null,
            twitter_url: speaker.twitter_url || null,
            website_url: speaker.website_url || null,
            display_order: speaker.display_order || i,
          };

          if (isValidUuid(speaker.id)) {
            // Update existing
            await supabase
              .from('event_speakers')
              .update(speakerData)
              .eq('id', speaker.id);
          } else {
            // Insert new
            await supabase
              .from('event_speakers')
              .insert(speakerData);
          }
        }
      }

      toast({ title: "Success", description: "Event updated successfully." });
      form.reset();
      setEditCardImagePreview('');
      setEditCardImagePreviewFr('');
      setEditImagePreviews([]);
      setEditImagePreviewsFr([]);
      setEditGalleryPreviews([]);
      setEditGalleryPreviewsFr([]);
      setExistingGalleryImages([]);
      setExistingHeroImagesFr([]);
      setExistingGalleryImagesFr([]);
      setImagesToDelete([]);
      setHeroImagesFrToDelete([]);
      setGalleryImagesFrToDelete([]);
      setSpeakerPhotoPreviews({});
      setEditEventDialogOpen(false);
      setEventToEdit(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not update event.", variant: "destructive" });
    }
  }

  const handleEdit = async (event: any) => {
    setEventToEdit(event);
    
    // Set card image preview if exists
    if (event.image_url) {
      setEditCardImagePreview(event.image_url);
    } else {
      setEditCardImagePreview('');
    }

    // Set French card image preview if exists
    if (event.image_url_fr) {
      setEditCardImagePreviewFr(event.image_url_fr);
    } else {
      setEditCardImagePreviewFr('');
    }
    
    // Fetch existing hero images (store full objects, not just URLs)
    const { data: heroImages } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_hero_image', true)
      .order('display_order');
    
    if (heroImages && heroImages.length > 0) {
      setExistingHeroImages(heroImages);
      // Separate French hero images
      setExistingHeroImagesFr(heroImages.filter(img => img.image_url_fr));
      setEditImagePreviews([]); // Clear new upload previews
      setEditImagePreviewsFr([]);
    } else {
      setExistingHeroImages([]);
      setExistingHeroImagesFr([]);
      setEditImagePreviews([]);
      setEditImagePreviewsFr([]);
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
      // Separate French gallery images
      setExistingGalleryImagesFr(galleryImages.filter(img => img.image_url_fr));
    } else {
      setExistingGalleryImages([]);
      setExistingGalleryImagesFr([]);
    }
    
    // Reset deletion tracking
    setImagesToDelete([]);
    setEditGalleryPreviews([]);
    setEditGalleryPreviewsFr([]);
    setDeleteCardImage(false);
    setHeroImagesToDelete([]);
    setHeroImagesFrToDelete([]);
    setGalleryImagesFrToDelete([]);
    
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
    
    // Fetch existing speakers
    const { data: existingSpeakers } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order');
    
    // Set photo previews for existing speakers
    if (existingSpeakers && existingSpeakers.length > 0) {
      const previews: {[key: number]: string} = {};
      existingSpeakers.forEach((s, idx) => {
        if (s.photo_url) {
          previews[idx] = s.photo_url;
        }
      });
      setSpeakerPhotoPreviews(previews);
    } else {
      setSpeakerPhotoPreviews({});
    }
    
    // Parse datetime into date and time
    const startDate = new Date(event.start_datetime);
    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
    
    // Pre-populate form
      form.reset({
        name: event.name,
        name_fr: event.name_fr || "",
        slug: event.slug || "",
        category: event.category,
      description: event.description || "",
      description_fr: event.description_fr || "",
      address: event.address || "",
      address_fr: event.address_fr || "",
      location_name: event.location_name || "",
      location_name_fr: event.location_name_fr || "",
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate ? endDate.toISOString().split('T')[0] : "",
      end_time: endDate ? endDate.toTimeString().slice(0, 5) : "",
      capacity: event.capacity || undefined,
      cost: event.cost || 0,
      cost_currency_code: event.cost_currency_code || "",
      registration_url: event.registration_url || "",
      organizer_name: event.organizer_name || "",
      organizer_email: event.organizer_email || "",
      whatsapp_contact: event.whatsapp_contact || "",
      is_public: event.is_public,
      is_featured: event.is_featured,
      is_special: event.is_special || false,
      attendance_target: event.attendance_target || undefined,
          testimonials: existingTestimonials?.map(t => ({
            name: t.name,
            name_fr: t.name_fr || "",
            role: t.role,
            role_fr: t.role_fr || "",
            content: t.content,
            content_fr: t.content_fr || "",
            rating: t.rating,
          })) || [],
          faqs: existingFaqs?.map(f => ({
            question: f.question,
            question_fr: f.question_fr || "",
            answer: f.answer,
            answer_fr: f.answer_fr || "",
          })) || [],
          speakers: existingSpeakers?.map(s => ({
            id: s.id,
            name: s.name,
            name_fr: s.name_fr || "",
            title: s.title,
            title_fr: s.title_fr || "",
            bio: s.bio || '',
            bio_fr: s.bio_fr || '',
            linkedin_url: s.linkedin_url || '',
            twitter_url: s.twitter_url || '',
            website_url: s.website_url || '',
            display_order: s.display_order,
            existing_photo_url: s.photo_url,
          })) || [],
    });
    
    setEditEventDialogOpen(true);
  };

  const renderTableBody = (eventList: typeof events) => {
    if (isLoading || !userRegion) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-6 w-full rounded-lg" /></TableCell>
          ))}
        </TableRow>
      ));
    }
    if (!eventList || eventList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
            {searchTerm ? 'No events match your search.' : 'No events found. Create your first one!'}
          </TableCell>
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
                              <DropdownMenuItem 
                                onClick={() => handleDuplicate(event)}
                                disabled={isDuplicating}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {isDuplicating ? "Duplicating..." : "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTogglePublic(event)}>
                                {event.is_public ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Make Private
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Make Public
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAttendance(event)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Record Attendance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/regional/events/${event.id}/report`)}>
                <FileText className="mr-2 h-4 w-4" />
                Event Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Events', data: analyticsData.total, icon: CalendarDays, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Regional Events', data: analyticsData.regional, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'DCG Events', data: analyticsData.dcg, icon: Users, color: 'text-green-600', bg: 'bg-green-500/10' },
            { label: 'Special Events', data: analyticsData.special, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          ].map(({ label, data, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.count}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg: {data.avgAttendance} attendees</p>
              <div className="mt-2">
                {data.growth !== 0 ? (
                  <div className={`flex items-center gap-1 ${data.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-xs font-medium">{data.growth > 0 ? '+' : ''}{data.growth}% avg attendance</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">0% growth</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Unified Events Table */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Events</h2>
                <p className="text-sm text-muted-foreground">View and manage all events in your region</p>
              </div>
            </div>
            <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search events..." className="pl-9 bg-background/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[160px] bg-background/60">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="dcg">DCG</SelectItem>
                <SelectItem value="special">Special</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[160px] bg-background/60">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading events</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Event Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableBody(filteredEvents)}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
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
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error('Create Event form validation errors:', errors);
              toast({
                title: "Validation Error",
                description: `Please fix the following fields: ${Object.keys(errors).join(', ')}`,
                variant: "destructive",
              });
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Annual Conference" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug from name if not manually edited
                            if (!slugManuallyEdited) {
                              const generated = generateSlug(e.target.value);
                              setAutoGeneratedSlug(generated);
                              form.setValue('slug', generated);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="annual-conference-2024"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSlugManuallyEdited(true);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {field.value ? (
                          <span className="text-primary font-medium">
                            URL: wcaglobal.org/events/{field.value}
                          </span>
                        ) : (
                          "Auto-generated from event name. Edit to customize."
                        )}
                      </FormDescription>
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
                  name="attendance_target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Target</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Target attendance for performance tracking
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cost_currency_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select currency</option>
                          {currencies?.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.symbol} - {currency.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="event_card_image"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Card Image (for Events Page)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              setCardImagePreview(URL.createObjectURL(file));
                            }
                          }}
                          {...field}
                          value={undefined}
                        />
                      </FormControl>
                      <FormDescription>
                        This image will be displayed on the Events listing page. Recommended: 1200x900px (4:3 ratio)
                      </FormDescription>
                      {cardImagePreview && (
                        <div className="mt-2 relative w-48 aspect-[4/3] rounded-md overflow-hidden border group">
                          <img src={cardImagePreview} alt="Card preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => {
                              setCardImagePreview('');
                              onChange(undefined);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="event_card_image_fr"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Card Image (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              setCardImagePreviewFr(URL.createObjectURL(file));
                            }
                          }}
                          {...field}
                          value={undefined}
                        />
                      </FormControl>
                      <FormDescription>
                        French version shown when language is set to French. Recommended: 1200x900px (4:3 ratio)
                      </FormDescription>
                      {cardImagePreviewFr && (
                        <div className="mt-2 relative w-48 aspect-[4/3] rounded-md overflow-hidden border group">
                          <img src={cardImagePreviewFr} alt="French card preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => {
                              setCardImagePreviewFr('');
                              onChange(undefined);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
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
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
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
                  name="image_files_fr"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Hero Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 5);
                            onChange(limitedFiles);
                            setImagePreviewsFr(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 5 French hero images. Shown when language is French.</FormDescription>
                      
                      {/* French Image Previews */}
                      {imagePreviewsFr.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {imagePreviewsFr.map((preview, idx) => (
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                              <img src={preview} alt={`French preview ${idx + 1}`} className="object-cover w-full h-full" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setImagePreviewsFr(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
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
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                              <img src={preview} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full" />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setGalleryPreviews(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
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
                  name="gallery_images_fr"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Gallery Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limitedFiles = files.slice(0, 10);
                            onChange(limitedFiles);
                            setGalleryPreviewsFr(limitedFiles.map(f => URL.createObjectURL(f)));
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload up to 10 French gallery images. Shown when language is French.</FormDescription>
                      
                      {/* French Gallery Image Previews */}
                      {galleryPreviewsFr.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {galleryPreviewsFr.map((preview, idx) => (
                            <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                              <img src={preview} alt={`French gallery ${idx + 1}`} className="object-cover w-full h-full" />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setGalleryPreviewsFr(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
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
                  name="whatsapp_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormDescription>
                        Include country code for WhatsApp link (e.g., +1 for US)
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
                
                {/* French Translations Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">🇫🇷 French Translations (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Provide French translations to serve French-speaking visitors</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name_fr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name (French)</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de l'événement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description_fr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Description (French)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Description de l'événement"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location_name_fr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name (French)</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du lieu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address_fr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address (French)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Adresse complète"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                  </Collapsible>
                </div>
                
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

                            {/* French Translation for Testimonial */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                  <Languages className="h-4 w-4 mr-2" />
                                  🇫🇷 French Translation
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3 space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`testimonials.${index}.name_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nom" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`testimonials.${index}.role_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Role (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Rôle" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`testimonials.${index}.content_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Content (French)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Contenu du témoignage"
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </CollapsibleContent>
                            </Collapsible>
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

                            {/* French Translation for FAQ */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                  <Languages className="h-4 w-4 mr-2" />
                                  🇫🇷 French Translation
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3 space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`faqs.${index}.question_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Question (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Question en français" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`faqs.${index}.answer_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Answer (French)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Réponse en français"
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </CollapsibleContent>
                            </Collapsible>
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
                
                {/* Speakers Section */}
                <div className="md:col-span-2">
                  <Collapsible className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Event Speakers (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Add speakers and their details</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      {speakerFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-sm">Speaker {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  removeSpeaker(index);
                                  const newPreviews = {...speakerPhotoPreviews};
                                  delete newPreviews[index];
                                  setSpeakerPhotoPreviews(newPreviews);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="Dr. John Smith" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title/Role *</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="Keynote Speaker" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.bio`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Biography</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} value={field.value || ''} placeholder="Brief biography..." maxLength={500} rows={3} />
                                  </FormControl>
                                  <FormDescription>
                                    {field.value?.length || 0}/500 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* French Translation for Speaker */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                  <Languages className="h-4 w-4 mr-2" />
                                  🇫🇷 French Translation
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3 space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`speakers.${index}.name_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nom" {...field} value={field.value || ''} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`speakers.${index}.title_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Title (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Titre" {...field} value={field.value || ''} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`speakers.${index}.bio_fr`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Biography (French)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Biographie"
                                          className="min-h-[80px]"
                                          {...field}
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </CollapsibleContent>
                            </Collapsible>
                            
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.photo`}
                              render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                  <FormLabel>Photo</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          onChange(file);
                                          setSpeakerPhotoPreviews(prev => ({
                                            ...prev,
                                            [index]: URL.createObjectURL(file)
                                          }));
                                        }
                                      }}
                                      {...field}
                                    />
                                  </FormControl>
                                  {speakerPhotoPreviews[index] && (
                                    <div className="mt-2">
                                      <img 
                                        src={speakerPhotoPreviews[index]} 
                                        alt="Preview" 
                                        className="w-24 h-24 object-cover rounded-full border-2 border-primary/20"
                                      />
                                    </div>
                                  )}
                                  <FormDescription>Square image recommended (e.g., 400x400px)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-3 gap-3">
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.linkedin_url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>LinkedIn URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.twitter_url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Twitter/X URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="https://twitter.com/..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.website_url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Website URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="https://..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendSpeaker({ 
                          name: "", 
                          title: "", 
                          bio: "", 
                          linkedin_url: "", 
                          twitter_url: "", 
                          website_url: "",
                          display_order: speakerFields.length 
                        })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Speaker
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
                
                <FormField
                  control={form.control}
                  name="is_special"
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
                        <FormLabel>Special Event</FormLabel>
                        <FormDescription>
                          Mark as extraordinary event (excluded from standard regional reports)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setCreateEventDialogOpen(false);
                  form.reset();
                  setCardImagePreview('');
                  setCardImagePreviewFr('');
                  setImagePreviews([]);
                  setImagePreviewsFr([]);
                  setGalleryPreviews([]);
                  setGalleryPreviewsFr([]);
                  setSpeakerPhotoPreviews({});
                  setSlugManuallyEdited(false);
                  setAutoGeneratedSlug('');
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
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
              Update the details of this event.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit, (errors) => {
              console.error('Edit Event form validation errors:', errors);
              toast({
                title: "Validation Error",
                description: `Please fix the following fields: ${Object.keys(errors).join(', ')}`,
                variant: "destructive",
              });
            })} className="space-y-6">
              {/* Event details form fields - same structure as create dialog */}
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
                  name="name_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name (French)</FormLabel>
                      <FormControl>
                        <Input placeholder="Conférence annuelle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="annual-conference-2024"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs space-y-1">
                          {field.value ? (
                            <>
                              <span className="text-primary font-medium block">
                                URL: wcaglobal.org/events/{field.value}
                              </span>
                              <span className="text-green-600 dark:text-green-400 block">
                                ✅ Old links will automatically redirect to the new URL
                              </span>
                            </>
                          ) : (
                            "Enter a URL-friendly slug for this event"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates and times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Description fields */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Event description..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description_fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (French)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description de l'événement..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="City Convention Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location_name_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name (French)</FormLabel>
                      <FormControl>
                        <Input placeholder="Centre de congrès de la ville" {...field} />
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
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (French)</FormLabel>
                      <FormControl>
                        <Input placeholder="123 rue principale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact and capacity fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for unlimited</FormDescription>
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
                  name="whatsapp_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormDescription>Include country code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Event card image */}
              <FormField
                control={form.control}
                name="event_card_image"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Event Card Image</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            setEditCardImagePreview(URL.createObjectURL(file));
                            setDeleteCardImage(false);
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    {(editCardImagePreview && !deleteCardImage) && (
                      <div className="relative mt-2 w-48 h-32 group">
                        <img src={editCardImagePreview} alt="Card preview" className="object-cover w-full h-full rounded border" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditCardImagePreview('');
                            setDeleteCardImage(true);
                            onChange(null);
                          }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <FormDescription>
                      Shown in event cards on the events page (recommended: 800x600px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* French Event Card Image */}
              <FormField
                control={form.control}
                name="event_card_image_fr"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Event Card Image (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            setEditCardImagePreviewFr(URL.createObjectURL(file));
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    {editCardImagePreviewFr && (
                      <div className="relative mt-2 w-48 h-32 group">
                        <img src={editCardImagePreviewFr} alt="French card preview" className="object-cover w-full h-full rounded border" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditCardImagePreviewFr('');
                            onChange(null);
                          }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <FormDescription>
                      French version shown when language is set to French (recommended: 800x600px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hero images */}
              <FormField
                control={form.control}
                name="image_files"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Hero Images (Multiple)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          onChange(files);
                          const previews = files.map(f => URL.createObjectURL(f));
                          setEditImagePreviews(previews);
                        }}
                        {...field}
                      />
                    </FormControl>
                    {existingHeroImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Existing hero images:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingHeroImages
                            .filter(img => !heroImagesToDelete.includes(img.id))
                            .map((img, idx) => (
                            <div key={img.id} className="relative w-24 h-24 group">
                              <img src={img.image_url} alt={`Existing ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => setHeroImagesToDelete(prev => [...prev, img.id])}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {editImagePreviews.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">New uploads:</p>
                        <div className="flex flex-wrap gap-2">
                          {editImagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24 group">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {existingHeroImages.filter(img => !heroImagesToDelete.includes(img.id)).length + idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Displayed in the hero carousel at the top of the event detail page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* French Hero Images */}
              <FormField
                control={form.control}
                name="image_files_fr"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Hero Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          onChange(files);
                          const previews = files.map(f => URL.createObjectURL(f));
                          setEditImagePreviewsFr(previews);
                        }}
                        {...field}
                      />
                    </FormControl>
                    {existingHeroImagesFr.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Existing French hero images:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingHeroImagesFr
                            .filter(img => !heroImagesFrToDelete.includes(img.id))
                            .map((img, idx) => (
                            <div key={img.id} className="relative w-24 h-24 group">
                              <img src={img.image_url_fr} alt={`French ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                FR {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => setHeroImagesFrToDelete(prev => [...prev, img.id])}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {editImagePreviewsFr.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">New French uploads:</p>
                        <div className="flex flex-wrap gap-2">
                          {editImagePreviewsFr.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24 group">
                              <img src={preview} alt={`French preview ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                NEW
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setEditImagePreviewsFr(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Upload French hero images. Shown when language is set to French (recommended: 1920x1080px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gallery images */}
              <FormField
                control={form.control}
                name="gallery_images"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Gallery Images (Multiple)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          onChange(files);
                          const previews = files.map(f => URL.createObjectURL(f));
                          setEditGalleryPreviews(previews);
                        }}
                        {...field}
                      />
                    </FormControl>
                    {existingGalleryImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Existing gallery:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingGalleryImages
                            .filter(img => !imagesToDelete.includes(img.id))
                            .map((img, idx) => (
                            <div key={img.id} className="relative w-24 h-24 group">
                              <img src={img.image_url} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <button
                                type="button"
                                onClick={() => setImagesToDelete(prev => [...prev, img.id])}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {editGalleryPreviews.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">New uploads:</p>
                        <div className="flex flex-wrap gap-2">
                          {editGalleryPreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24">
                              <img src={preview} alt={`New ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Additional photos shown in the gallery section
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* French Gallery Images */}
              <FormField
                control={form.control}
                name="gallery_images_fr"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Gallery Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          onChange(files);
                          const previews = files.map(f => URL.createObjectURL(f));
                          setEditGalleryPreviewsFr(previews);
                        }}
                        {...field}
                      />
                    </FormControl>
                    {existingGalleryImagesFr.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Existing French gallery images:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingGalleryImagesFr
                            .filter(img => !galleryImagesFrToDelete.includes(img.id))
                            .map((img, idx) => (
                            <div key={img.id} className="relative w-24 h-24 group">
                              <img src={img.image_url_fr} alt={`French gallery ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <button
                                type="button"
                                onClick={() => setGalleryImagesFrToDelete(prev => [...prev, img.id])}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {editGalleryPreviewsFr.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">New French uploads:</p>
                        <div className="flex flex-wrap gap-2">
                          {editGalleryPreviewsFr.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24 group">
                              <img src={preview} alt={`French preview ${idx + 1}`} className="object-cover w-full h-full rounded border" />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFiles = value as File[] || [];
                                  const newFiles = currentFiles.filter((_, i) => i !== idx);
                                  onChange(newFiles);
                                  setEditGalleryPreviewsFr(newFiles.map(f => URL.createObjectURL(f)));
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Upload French gallery images. Shown when language is set to French
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Testimonials, FAQs, Speakers - collapsed sections */}
              <div className="space-y-4">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      <span>Testimonials ({testimonialFields.length})</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {testimonialFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Testimonial {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestimonial(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.name_fr`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name (French)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                  <FormLabel>Role</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`testimonials.${index}.role_fr`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role (French)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea {...field} className="min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`testimonials.${index}.content_fr`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content (French)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} className="min-h-[80px]" />
                                </FormControl>
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
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    max={5} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
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

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      <span>FAQs ({faqFields.length})</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {faqFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">FAQ {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFAQ(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.question`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.question_fr`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question (French)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
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
                                  <Textarea {...field} className="min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.answer_fr`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Answer (French)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} className="min-h-[80px]" />
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
                      onClick={() => appendFAQ({ question: "", answer: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add FAQ
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      <span>Speakers ({speakerFields.length})</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {speakerFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Speaker {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpeaker(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.name_fr`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name (French)</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.title_fr`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title (French)</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                                <span>Additional Details</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-2">
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.bio`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Biography"
                                        className="min-h-[80px]"
                                        {...field}
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`speakers.${index}.bio_fr`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio (French)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Biographie"
                                        className="min-h-[80px]"
                                        {...field}
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                          
                          <FormField
                            control={form.control}
                            name={`speakers.${index}.photo`}
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>Photo</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        onChange(file);
                                        setSpeakerPhotoPreviews(prev => ({
                                          ...prev,
                                          [index]: URL.createObjectURL(file)
                                        }));
                                      }
                                    }}
                                    {...field}
                                  />
                                </FormControl>
                                {speakerPhotoPreviews[index] && (
                                  <div className="mt-2">
                                    <img 
                                      src={speakerPhotoPreviews[index]} 
                                      alt="Preview" 
                                      className="w-24 h-24 object-cover rounded-full border-2 border-primary/20"
                                    />
                                  </div>
                                )}
                                <FormDescription>Square image recommended (e.g., 400x400px)</FormDescription>
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
                      onClick={() => appendSpeaker({ 
                        name: "", 
                        title: "", 
                        bio: "", 
                        linkedin_url: "", 
                        twitter_url: "", 
                        website_url: "",
                        display_order: speakerFields.length 
                      })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Speaker
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
              
              <FormField
                control={form.control}
                name="is_special"
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
                      <FormLabel>Special Event</FormLabel>
                      <FormDescription>
                        Mark as extraordinary event (excluded from standard regional reports)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setEditEventDialogOpen(false);
                  setEventToEdit(null);
                  form.reset();
                  setEditImagePreviews([]);
                  setEditCardImagePreview('');
                  setEditGalleryPreviews([]);
                  setExistingGalleryImages([]);
                  setExistingHeroImages([]);
                  setImagesToDelete([]);
                  setHeroImagesToDelete([]);
                  setDeleteCardImage(false);
                  setSpeakerPhotoPreviews({});
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
    </>
  );
};

export default RegionalEvents;

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PeriodFilter, { PeriodFilters } from "@/components/admin/regional/dashboard/PeriodFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays, Search, Plus, MoreHorizontal, Edit, UserCheck, Eye, EyeOff,
  Link2, Copy, Trash2, Globe, Star, Layers, Target, TrendingUp, TrendingDown,
  ChevronDown, X, Languages,
} from "lucide-react";
import { useGlobalEvents, useCreateGlobalEvent, useDeleteGlobalEvent, useUpdateGlobalEvent } from "@/hooks/useGlobalEvents";
import { useAllRegions } from "@/hooks/useAllRegions";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useGlobalAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { formatDateRange, formatTimeRange } from "@/utils/dateUtils";
import { generateSlug } from "@/utils/slugUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalAttendanceDialog } from "@/components/admin/super/events/GlobalAttendanceDialog";

const eventCategories = [
  'Conference', 'Worship', 'Revival', 'Outreach', 'Training', 'Workshop',
  'Community Service', 'Bible Study', 'Retreat', 'Seminar', 'DCG Meeting', 'Other'
] as const;

const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  name_fr: z.string().optional(),
  description: z.string().optional(),
  description_fr: z.string().optional(),
  category: z.enum(eventCategories),
  start_date: z.string().min(1, "Please select a start date."),
  start_time: z.string().min(1, "Please provide a start time."),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location_name: z.string().min(3, "Please provide a location."),
  location_name_fr: z.string().optional(),
  address: z.string().optional(),
  address_fr: z.string().optional(),
  capacity: z.coerce.number().positive().int().optional(),
  cost: z.coerce.number().min(0, "Cost cannot be negative").optional().default(0),
  cost_currency_code: z.string().optional(),
  event_card_image: z.instanceof(File).optional(),
  event_card_image_fr: z.instanceof(File).optional(),
  image_files: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
  image_files_fr: z.array(z.instanceof(File)).max(5, "Maximum 5 French hero images allowed").optional(),
  gallery_images: z.array(z.instanceof(File)).max(10, "Maximum 10 gallery images allowed").optional(),
  gallery_images_fr: z.array(z.instanceof(File)).max(10, "Maximum 10 French gallery images allowed").optional(),
  organizer_name: z.string().optional(),
  organizer_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  whatsapp_contact: z.string().optional(),
  testimonials: z.array(z.object({
    name: z.string().min(2, "Name is required"),
    name_fr: z.string().optional(),
    role: z.string().min(2, "Role is required"),
    role_fr: z.string().optional(),
    content: z.string().min(10).max(300),
    content_fr: z.string().max(300).optional(),
    rating: z.coerce.number().min(1).max(5).default(5),
  })).optional(),
  faqs: z.array(z.object({
    question: z.string().min(5).max(200),
    question_fr: z.string().max(200).optional(),
    answer: z.string().min(10).max(500),
    answer_fr: z.string().max(500).optional(),
  })).optional(),
  speakers: z.array(z.object({
    name: z.string().min(2, "Speaker name is required"),
    name_fr: z.string().optional(),
    title: z.string().min(2, "Speaker title is required"),
    title_fr: z.string().optional(),
    bio: z.string().max(500).optional(),
    bio_fr: z.string().max(500).optional(),
    photo: z.instanceof(File).optional(),
    linkedin_url: z.string().url().optional().or(z.literal("")),
    twitter_url: z.string().url().optional().or(z.literal("")),
    website_url: z.string().url().optional().or(z.literal("")),
    display_order: z.number().optional(),
  })).optional(),
  is_public: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_special: z.boolean().default(false),
  requires_pre_registration: z.boolean().default(false),
  collect_lodging: z.boolean().default(false),
  collect_meal_preferences: z.boolean().default(false),
  collect_pledges: z.boolean().default(false),
  linked_fundraising_campaign_id: z.string().uuid().optional().or(z.literal("")),
  attendance_target: z.coerce.number().positive().int().optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Only lowercase letters, numbers, and hyphens allowed").optional().or(z.literal("")),
  registration_url: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, { message: "End date must be after or same as start date", path: ["end_date"] });

// Helper: upload a file to event-images bucket and return its public URL
async function uploadEventImage(file: File, prefix = ""): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${prefix}${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabase.storage.from('event-images').upload(fileName, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(fileName);
  return publicUrl;
}

const SuperEvents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [periodFilters, setPeriodFilters] = useState<PeriodFilters>(() => {
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return { dateRange: { from, to: undefined }, quickDateRange: '1-year' };
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [autoGeneratedSlug, setAutoGeneratedSlug] = useState<string>('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  // Image preview state (create dialog)
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [cardImagePreviewFr, setCardImagePreviewFr] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagePreviewsFr, setImagePreviewsFr] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryPreviewsFr, setGalleryPreviewsFr] = useState<string[]>([]);
  const [speakerPhotoPreviews, setSpeakerPhotoPreviews] = useState<{[k: number]: string}>({});
  // Image preview state (edit dialog)
  const [editCardImagePreview, setEditCardImagePreview] = useState<string>('');
  const [editCardImagePreviewFr, setEditCardImagePreviewFr] = useState<string>('');
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImagePreviewsFr, setEditImagePreviewsFr] = useState<string[]>([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState<string[]>([]);
  const [editGalleryPreviewsFr, setEditGalleryPreviewsFr] = useState<string[]>([]);
  const [editSpeakerPhotoPreviews, setEditSpeakerPhotoPreviews] = useState<{[k: number]: string}>({});
  const { toast } = useToast();

  const { data: events, isLoading } = useGlobalEvents();
  const { data: attendanceData } = useGlobalAttendanceHistoryWithMemberTypes();
  const { data: regions } = useAllRegions();
  const { data: currencies } = useCurrencies();
  const createEvent = useCreateGlobalEvent();
  const updateEvent = useUpdateGlobalEvent();
  const deleteEvent = useDeleteGlobalEvent();

  // Fundraising campaigns for linking special events
  const { data: campaigns = [] } = useQuery({
    queryKey: ["fundraising-campaigns-for-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fundraising_campaigns").select("id, name, goal, currency_code, region_id").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const navigate = useNavigate();

  const defaultFormValues: any = {
    name: "", name_fr: "", description: "", description_fr: "",
    start_date: "", start_time: "", end_date: "", end_time: "",
    location_name: "", location_name_fr: "", address: "", address_fr: "",
    cost: 0, cost_currency_code: "",
    organizer_name: "", organizer_email: "", whatsapp_contact: "",
    is_public: true, is_featured: false, is_special: false, requires_pre_registration: false,
    collect_lodging: false, collect_meal_preferences: false, collect_pledges: false,
    linked_fundraising_campaign_id: "",
    slug: "", registration_url: "",
    testimonials: [], faqs: [], speakers: [],
  };

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultFormValues,
  });
  const editForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultFormValues,
  });

  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({ control: form.control, name: "testimonials" });
  const { fields: faqFields, append: appendFAQ, remove: removeFAQ } = useFieldArray({ control: form.control, name: "faqs" });
  const { fields: speakerFields, append: appendSpeaker, remove: removeSpeaker } = useFieldArray({ control: form.control, name: "speakers" });

  const { fields: editTestimonialFields, append: editAppendTestimonial, remove: editRemoveTestimonial } = useFieldArray({ control: editForm.control, name: "testimonials" });
  const { fields: editFaqFields, append: editAppendFAQ, remove: editRemoveFAQ } = useFieldArray({ control: editForm.control, name: "faqs" });
  const { fields: editSpeakerFields, append: editAppendSpeaker, remove: editRemoveSpeaker } = useFieldArray({ control: editForm.control, name: "speakers" });

  // Period-filtered events
  const periodFilteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e: any) => {
      if (!e?.start_datetime) return false;
      const d = new Date(e.start_datetime);
      if (isNaN(d.getTime())) return false;
      if (periodFilters.dateRange.from && d < periodFilters.dateRange.from) return false;
      if (periodFilters.dateRange.to) {
        const endOfDay = new Date(periodFilters.dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [events, periodFilters]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return periodFilteredEvents.filter((event: any) => {
      const name = event?.name ?? '';
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        name.toLowerCase().includes(term) ||
        (event.category && event.category.toLowerCase().includes(term)) ||
        (event.location_name && event.location_name.toLowerCase().includes(term)) ||
        (event.regions?.name && event.regions.name.toLowerCase().includes(term));
      if (!matchesSearch) return false;

      if (eventTypeFilter === 'regional' && (event.dcg_id || event.is_special)) return false;
      if (eventTypeFilter === 'dcg' && !event.dcg_id) return false;
      if (eventTypeFilter === 'special' && !event.is_special) return false;
      if (eventTypeFilter === 'global' && event.region_id) return false;

      if (regionFilter !== 'all' && event.region_id !== regionFilter) return false;

      return true;
    });
  }, [periodFilteredEvents, searchTerm, eventTypeFilter, regionFilter]);

  const getEventAttendance = (eventId: string): number => {
    if (!attendanceData) return 0;
    const matched = attendanceData.filter((a: any) => a.source_event_id === eventId);
    return matched.reduce((sum: number, a: any) => sum + a.total_present, 0);
  };

  // KPI analytics — mirror regional analytics math
  const analyticsData = useMemo(() => {
    const safeAttendance = attendanceData || [];
    const list = filteredEvents || [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const regionalEvents = list.filter((e: any) => !e.dcg_id && !e.is_special);
    const dcgEvents = list.filter((e: any) => !!e.dcg_id);
    const specialEvents = list.filter((e: any) => !!e.is_special);

    const avgAttendance = (eventList: any[]) => {
      const ids = eventList.map(e => e.id);
      const matched = safeAttendance.filter((a: any) => a.source_event_id && ids.includes(a.source_event_id));
      return matched.length > 0 ? Math.round(matched.reduce((s: number, a: any) => s + a.total_present, 0) / matched.length) : 0;
    };

    const growth = (eventList: any[]) => {
      const ids = eventList.map(e => e.id);
      const thisM = safeAttendance.filter((a: any) => {
        const d = new Date(a.event_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.source_event_id && ids.includes(a.source_event_id);
      });
      const lastM = safeAttendance.filter((a: any) => {
        const d = new Date(a.event_date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && a.source_event_id && ids.includes(a.source_event_id);
      });
      const thisAvg = thisM.length > 0 ? thisM.reduce((s: number, a: any) => s + a.total_present, 0) / thisM.length : 0;
      const lastAvg = lastM.length > 0 ? lastM.reduce((s: number, a: any) => s + a.total_present, 0) / lastM.length : 0;
      return lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
    };

    const totalAttendees = list.reduce((sum, e: any) => sum + getEventAttendance(e.id), 0);
    const totalCapacity = regionalEvents.reduce((sum, e: any) => sum + (e.capacity || 0), 0);
    const attendanceTargetPct = totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0;

    return {
      total: { count: list.length, avg: avgAttendance(list), growth: growth(list) },
      regional: { count: regionalEvents.length, avg: avgAttendance(regionalEvents), growth: growth(regionalEvents) },
      dcg: { count: dcgEvents.length, avg: avgAttendance(dcgEvents), growth: growth(dcgEvents) },
      special: { count: specialEvents.length, avg: avgAttendance(specialEvents), growth: growth(specialEvents) },
      target: { pct: attendanceTargetPct, totalAttendees, totalCapacity },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEvents, attendanceData]);

  const getAttendanceLink = (slugOrId: string) => `${window.location.origin}/attend/${slugOrId}`;
  const getEventPageLink = (slugOrId: string) => `${window.location.origin}/events/${slugOrId}`;

  const copyAttendanceLink = (event: any) => {
    const identifier = event.slug || event.id;
    navigator.clipboard.writeText(getAttendanceLink(identifier));
    toast({ title: "Link Copied", description: "Self-attendance link copied to clipboard." });
  };

  // Persist related entities (event_images for hero+gallery, testimonials, faqs, speakers) for a given event id
  async function persistEventRelations(
    eventId: string,
    values: z.infer<typeof eventSchema>,
    uploadedHeroUrls: string[],
    uploadedHeroUrlsFr: string[],
  ) {
    // Hero images
    if (uploadedHeroUrls.length > 0) {
      const records = uploadedHeroUrls.map((url, idx) => ({
        event_id: eventId,
        image_url: url,
        image_url_fr: uploadedHeroUrlsFr[idx] || null,
        display_order: idx,
        is_hero_image: true,
      }));
      const { error } = await supabase.from('event_images').insert(records);
      if (error) throw error;
    }

    // Gallery images (EN)
    let galleryUrlsEn: string[] = [];
    if (values.gallery_images && values.gallery_images.length > 0) {
      for (const file of values.gallery_images) {
        galleryUrlsEn.push(await uploadEventImage(file, 'gallery-'));
      }
      const records = galleryUrlsEn.map((url, idx) => ({
        event_id: eventId,
        image_url: url,
        display_order: idx,
        is_hero_image: false,
      }));
      const { error } = await supabase.from('event_images').insert(records);
      if (error) throw error;
    }

    // Gallery images (FR) - update existing rows with image_url_fr
    if (values.gallery_images_fr && values.gallery_images_fr.length > 0) {
      const galleryUrlsFr: string[] = [];
      for (const file of values.gallery_images_fr) {
        galleryUrlsFr.push(await uploadEventImage(file, 'gallery-fr-'));
      }
      const { data: existingGallery } = await supabase
        .from('event_images')
        .select('id')
        .eq('event_id', eventId)
        .eq('is_hero_image', false)
        .order('display_order', { ascending: true });
      if (existingGallery) {
        for (let i = 0; i < Math.min(galleryUrlsFr.length, existingGallery.length); i++) {
          await supabase.from('event_images').update({ image_url_fr: galleryUrlsFr[i] }).eq('id', existingGallery[i].id);
        }
      }
    }

    // Testimonials
    if (values.testimonials && values.testimonials.length > 0) {
      const records = values.testimonials.map((t, idx) => ({
        event_id: eventId,
        name: t.name,
        name_fr: t.name_fr || null,
        role: t.role,
        role_fr: t.role_fr || null,
        content: t.content,
        content_fr: t.content_fr || null,
        rating: t.rating,
        display_order: idx,
      }));
      const { error } = await supabase.from('event_testimonials').insert(records);
      if (error) throw error;
    }

    // FAQs
    if (values.faqs && values.faqs.length > 0) {
      const records = values.faqs.map((f, idx) => ({
        event_id: eventId,
        question: f.question,
        question_fr: f.question_fr || null,
        answer: f.answer,
        answer_fr: f.answer_fr || null,
        display_order: idx,
      }));
      const { error } = await supabase.from('event_faqs').insert(records);
      if (error) throw error;
    }

    // Speakers (with photo upload)
    if (values.speakers && values.speakers.length > 0) {
      for (let i = 0; i < values.speakers.length; i++) {
        const sp = values.speakers[i];
        let photoUrl: string | null = null;
        if (sp.photo) {
          try { photoUrl = await uploadEventImage(sp.photo, `${eventId}/speakers/`); } catch (e) { /* swallow */ }
        }
        const { error } = await supabase.from('event_speakers').insert({
          event_id: eventId,
          name: sp.name,
          name_fr: sp.name_fr || null,
          title: sp.title,
          title_fr: sp.title_fr || null,
          bio: sp.bio || null,
          bio_fr: sp.bio_fr || null,
          photo_url: photoUrl,
          linkedin_url: sp.linkedin_url || null,
          twitter_url: sp.twitter_url || null,
          website_url: sp.website_url || null,
          display_order: sp.display_order ?? i,
        });
        if (error) console.error('Speaker insert error', error);
      }
    }
  }

  function resetCreateImagePreviews() {
    setCardImagePreview('');
    setCardImagePreviewFr('');
    setImagePreviews([]);
    setImagePreviewsFr([]);
    setGalleryPreviews([]);
    setGalleryPreviewsFr([]);
    setSpeakerPhotoPreviews({});
  }
  function resetEditImagePreviews() {
    setEditCardImagePreview('');
    setEditCardImagePreviewFr('');
    setEditImagePreviews([]);
    setEditImagePreviewsFr([]);
    setEditGalleryPreviews([]);
    setEditGalleryPreviewsFr([]);
    setEditSpeakerPhotoPreviews({});
  }

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    try {
      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime: string | null = null;
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }

      // Card images
      let cardUrl: string | null = null;
      let cardUrlFr: string | null = null;
      if (values.event_card_image) cardUrl = await uploadEventImage(values.event_card_image, 'card-');
      if (values.event_card_image_fr) cardUrlFr = await uploadEventImage(values.event_card_image_fr, 'card-fr-');

      // Hero images
      const heroUrls: string[] = [];
      if (values.image_files) {
        for (const f of values.image_files) heroUrls.push(await uploadEventImage(f, 'hero-'));
      }
      const heroUrlsFr: string[] = [];
      if (values.image_files_fr) {
        for (const f of values.image_files_fr) heroUrlsFr.push(await uploadEventImage(f, 'hero-fr-'));
      }

      // Slug uniqueness
      let finalSlug = values.slug || generateSlug(values.name);
      const { data: existingEvent } = await supabase.from('events').select('slug').eq('slug', finalSlug).maybeSingle();
      if (existingEvent) finalSlug = `${finalSlug}-${Date.now().toString(36)}`;

      const created = await createEvent.mutateAsync({
        name: values.name,
        name_fr: values.name_fr || null,
        slug: finalSlug,
        description: values.description || null,
        description_fr: values.description_fr || null,
        category: values.category as any,
        start_datetime,
        end_datetime,
        location_name: values.location_name,
        location_name_fr: values.location_name_fr || null,
        address: values.address || null,
        address_fr: values.address_fr || null,
        capacity: values.capacity || null,
        attendance_target: values.attendance_target || null,
        cost: values.cost || 0,
        cost_currency_code: values.cost_currency_code || null,
        image_url: cardUrl || heroUrls[0] || null,
        image_url_fr: cardUrlFr || heroUrlsFr[0] || null,
        is_public: values.is_public,
        is_featured: values.is_featured,
        is_special: values.is_special,
        requires_pre_registration: values.is_special ? !!values.requires_pre_registration : false,
        collect_lodging: values.is_special ? !!values.collect_lodging : false,
        collect_meal_preferences: values.is_special ? !!values.collect_meal_preferences : false,
        collect_pledges: values.is_special ? !!values.collect_pledges : false,
        linked_fundraising_campaign_id: values.is_special && values.linked_fundraising_campaign_id ? values.linked_fundraising_campaign_id : null,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        whatsapp_contact: values.whatsapp_contact || null,
        status: 'Upcoming',
        region_id: null,
        dcg_id: null,
      } as any);

      if (created?.id) {
        await persistEventRelations(created.id, values, heroUrls, heroUrlsFr);
      }

      toast({ title: "Success", description: "Global event created successfully." });
      form.reset(defaultFormValues);
      resetCreateImagePreviews();
      setAutoGeneratedSlug('');
      setSlugManuallyEdited(false);
      setCreateDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not create event.", variant: "destructive" });
    }
  }

  async function openEditDialog(event: any) {
    setEventToEdit(event);
    const startDate = new Date(event.start_datetime);
    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
    setSlugManuallyEdited(true);
    resetEditImagePreviews();

    // Load related testimonials, faqs, speakers
    const [{ data: testimonials }, { data: faqs }, { data: speakers }] = await Promise.all([
      supabase.from('event_testimonials').select('*').eq('event_id', event.id).order('display_order'),
      supabase.from('event_faqs').select('*').eq('event_id', event.id).order('display_order'),
      supabase.from('event_speakers').select('*').eq('event_id', event.id).order('display_order'),
    ]);

    editForm.reset({
      name: event.name,
      name_fr: event.name_fr || "",
      description: event.description || "",
      description_fr: event.description_fr || "",
      category: event.category || "Other",
      start_date: format(startDate, 'yyyy-MM-dd'),
      start_time: format(startDate, 'HH:mm'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : "",
      end_time: endDate ? format(endDate, 'HH:mm') : "",
      location_name: event.location_name || "",
      location_name_fr: event.location_name_fr || "",
      address: event.address || "",
      address_fr: event.address_fr || "",
      capacity: event.capacity || undefined,
      cost: event.cost || 0,
      cost_currency_code: event.cost_currency_code || "",
      is_public: event.is_public,
      is_featured: event.is_featured,
      is_special: !!event.is_special,
      requires_pre_registration: !!event.requires_pre_registration,
      collect_lodging: !!event.collect_lodging,
      collect_meal_preferences: !!event.collect_meal_preferences,
      collect_pledges: !!event.collect_pledges,
      linked_fundraising_campaign_id: event.linked_fundraising_campaign_id || "",
      attendance_target: event.attendance_target || undefined,
      slug: event.slug || "",
      registration_url: event.registration_url || "",
      organizer_name: event.organizer_name || "",
      organizer_email: event.organizer_email || "",
      whatsapp_contact: event.whatsapp_contact || "",
      testimonials: (testimonials || []).map((t: any) => ({
        name: t.name || "", name_fr: t.name_fr || "",
        role: t.role || "", role_fr: t.role_fr || "",
        content: t.content || "", content_fr: t.content_fr || "",
        rating: t.rating || 5,
      })),
      faqs: (faqs || []).map((f: any) => ({
        question: f.question || "", question_fr: f.question_fr || "",
        answer: f.answer || "", answer_fr: f.answer_fr || "",
      })),
      speakers: (speakers || []).map((s: any, idx: number) => ({
        name: s.name || "", name_fr: s.name_fr || "",
        title: s.title || "", title_fr: s.title_fr || "",
        bio: s.bio || "", bio_fr: s.bio_fr || "",
        linkedin_url: s.linkedin_url || "",
        twitter_url: s.twitter_url || "",
        website_url: s.website_url || "",
        display_order: s.display_order ?? idx,
      })),
    } as any);
    setEditDialogOpen(true);
  }

  async function onEditSubmit(values: z.infer<typeof eventSchema>) {
    if (!eventToEdit) return;
    try {
      const start_datetime = new Date(`${values.start_date}T${values.start_time}`).toISOString();
      let end_datetime: string | null = null;
      if (values.end_date) {
        const endTime = values.end_time || values.start_time;
        end_datetime = new Date(`${values.end_date}T${endTime}`).toISOString();
      }
      const newSlug = values.slug || eventToEdit.slug;
      if (newSlug && eventToEdit.slug && newSlug !== eventToEdit.slug) {
        await supabase.from('event_slug_history').insert({ event_id: eventToEdit.id, old_slug: eventToEdit.slug });
      }

      // Card images (only update if new file provided)
      let cardUrl: string | undefined;
      let cardUrlFr: string | undefined;
      if (values.event_card_image) cardUrl = await uploadEventImage(values.event_card_image, 'card-');
      if (values.event_card_image_fr) cardUrlFr = await uploadEventImage(values.event_card_image_fr, 'card-fr-');

      // New hero images appended
      const heroUrls: string[] = [];
      if (values.image_files) {
        for (const f of values.image_files) heroUrls.push(await uploadEventImage(f, 'hero-'));
      }
      const heroUrlsFr: string[] = [];
      if (values.image_files_fr) {
        for (const f of values.image_files_fr) heroUrlsFr.push(await uploadEventImage(f, 'hero-fr-'));
      }

      await updateEvent.mutateAsync({
        id: eventToEdit.id,
        name: values.name,
        name_fr: values.name_fr || null,
        slug: newSlug,
        description: values.description || null,
        description_fr: values.description_fr || null,
        category: values.category as any,
        start_datetime,
        end_datetime,
        location_name: values.location_name,
        location_name_fr: values.location_name_fr || null,
        address: values.address || null,
        address_fr: values.address_fr || null,
        capacity: values.capacity || null,
        attendance_target: values.attendance_target || null,
        cost: values.cost || 0,
        cost_currency_code: values.cost_currency_code || null,
        ...(cardUrl !== undefined ? { image_url: cardUrl } : {}),
        ...(cardUrlFr !== undefined ? { image_url_fr: cardUrlFr } : {}),
        is_public: values.is_public,
        is_featured: values.is_featured,
        is_special: values.is_special,
        requires_pre_registration: values.is_special ? !!values.requires_pre_registration : false,
        collect_lodging: values.is_special ? !!values.collect_lodging : false,
        collect_meal_preferences: values.is_special ? !!values.collect_meal_preferences : false,
        collect_pledges: values.is_special ? !!values.collect_pledges : false,
        linked_fundraising_campaign_id: values.is_special && values.linked_fundraising_campaign_id ? values.linked_fundraising_campaign_id : null,
        registration_url: values.registration_url || null,
        organizer_name: values.organizer_name || null,
        organizer_email: values.organizer_email || null,
        whatsapp_contact: values.whatsapp_contact || null,
      } as any);

      // Replace related entities (delete + re-insert) for testimonials/faqs/speakers; append new hero/gallery images
      await Promise.all([
        supabase.from('event_testimonials').delete().eq('event_id', eventToEdit.id),
        supabase.from('event_faqs').delete().eq('event_id', eventToEdit.id),
        supabase.from('event_speakers').delete().eq('event_id', eventToEdit.id),
      ]);
      await persistEventRelations(eventToEdit.id, values, heroUrls, heroUrlsFr);

      toast({ title: "Success", description: "Event updated successfully." });
      setEditDialogOpen(false);
      setEventToEdit(null);
      setSlugManuallyEdited(false);
      resetEditImagePreviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not update event.", variant: "destructive" });
    }
  }

  const handleDelete = (id: string) => {
    deleteEvent.mutate(id, {
      onSuccess: () => { toast({ title: "Success", description: "Event deleted." }); setEventToDelete(null); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };


  // ---- KPI card ----
  const renderKpi = (
    label: string,
    count: number | string,
    sub: string,
    growth: number | null,
    Icon: React.ComponentType<{ className?: string }>,
    iconColor: string,
    iconBg: string,
  ) => (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="font-bold text-foreground text-base tabular-nums mt-1">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      {growth !== null && (
        <div className="mt-2">
          {growth !== 0 ? (
            <div className={`flex items-center gap-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-xs font-medium">{growth > 0 ? '+' : ''}{growth}% avg attendance</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">0% growth</span>
          )}
        </div>
      )}
    </div>
  );

  // ---- Event form (reused for create + edit) ----
  const renderEventForm = (formInstance: any, onSubmitFn: any, isEdit = false) => {
    const tFields = isEdit ? editTestimonialFields : testimonialFields;
    const tAppend = isEdit ? editAppendTestimonial : appendTestimonial;
    const tRemove = isEdit ? editRemoveTestimonial : removeTestimonial;
    const fFields = isEdit ? editFaqFields : faqFields;
    const fAppend = isEdit ? editAppendFAQ : appendFAQ;
    const fRemove = isEdit ? editRemoveFAQ : removeFAQ;
    const sFields = isEdit ? editSpeakerFields : speakerFields;
    const sAppend = isEdit ? editAppendSpeaker : appendSpeaker;
    const sRemove = isEdit ? editRemoveSpeaker : removeSpeaker;

    const cardPrev = isEdit ? editCardImagePreview : cardImagePreview;
    const setCardPrev = isEdit ? setEditCardImagePreview : setCardImagePreview;
    const cardPrevFr = isEdit ? editCardImagePreviewFr : cardImagePreviewFr;
    const setCardPrevFr = isEdit ? setEditCardImagePreviewFr : setCardImagePreviewFr;
    const heroPrevs = isEdit ? editImagePreviews : imagePreviews;
    const setHeroPrevs = isEdit ? setEditImagePreviews : setImagePreviews;
    const heroPrevsFr = isEdit ? editImagePreviewsFr : imagePreviewsFr;
    const setHeroPrevsFr = isEdit ? setEditImagePreviewsFr : setImagePreviewsFr;
    const galPrevs = isEdit ? editGalleryPreviews : galleryPreviews;
    const setGalPrevs = isEdit ? setEditGalleryPreviews : setGalleryPreviews;
    const galPrevsFr = isEdit ? editGalleryPreviewsFr : galleryPreviewsFr;
    const setGalPrevsFr = isEdit ? setEditGalleryPreviewsFr : setGalleryPreviewsFr;
    const spkPrevs = isEdit ? editSpeakerPhotoPreviews : speakerPhotoPreviews;
    const setSpkPrevs = isEdit ? setEditSpeakerPhotoPreviews : setSpeakerPhotoPreviews;

    return (
    <Form {...formInstance}>
      <form
        onSubmit={formInstance.handleSubmit(onSubmitFn, (errors: any) => {
          console.error('Event form validation errors:', errors);
          toast({ title: "Validation Error", description: `Please fix: ${Object.keys(errors).join(', ')}`, variant: "destructive" });
        })}
        className="space-y-5 max-h-[70vh] overflow-y-auto px-1 pb-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="name" render={({ field }: any) => (
            <FormItem>
              <FormLabel>Event Name *</FormLabel>
              <FormControl><Input placeholder="e.g. Annual Global Conference" {...field} onChange={(e) => {
                field.onChange(e);
                if (!slugManuallyEdited) {
                  const newSlug = generateSlug(e.target.value);
                  setAutoGeneratedSlug(newSlug);
                  formInstance.setValue('slug', newSlug);
                }
              }} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={formInstance.control} name="slug" render={({ field }: any) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl><Input placeholder="annual-global-conference" {...field} value={field.value || ''} onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                field.onChange(val);
                setSlugManuallyEdited(true);
              }} /></FormControl>
              <FormDescription className="text-xs">Used in Event Page and Attendance URLs.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {formInstance.watch('slug') && (
          <div className="space-y-2 rounded-md border p-3 bg-muted/50">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Event Page URL</p>
              <div className="flex gap-2">
                <Input readOnly className="bg-muted text-sm" value={getEventPageLink(formInstance.watch('slug') || '')} />
                <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(getEventPageLink(formInstance.watch('slug') || '')); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Attendance URL</p>
              <div className="flex gap-2">
                <Input readOnly className="bg-muted text-sm" value={getAttendanceLink(formInstance.watch('slug') || '')} />
                <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(getAttendanceLink(formInstance.watch('slug') || '')); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="category" render={({ field }: any) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                <SelectContent>{eventCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={formInstance.control} name="start_date" render={({ field }: any) => (
            <FormItem><FormLabel>Start Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="start_time" render={({ field }: any) => (
            <FormItem><FormLabel>Start Time *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="end_date" render={({ field }: any) => (
            <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="end_time" render={({ field }: any) => (
            <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={formInstance.control} name="location_name" render={({ field }: any) => (
            <FormItem><FormLabel>Location *</FormLabel><FormControl><Input placeholder="e.g. Convention Center" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="address" render={({ field }: any) => (
            <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="123 Main St, City…" {...field} /></FormControl><FormDescription>Used for map display on event detail page.</FormDescription><FormMessage /></FormItem>
          )} />

          <FormField control={formInstance.control} name="capacity" render={({ field }: any) => (
            <FormItem><FormLabel>Expected Turnout</FormLabel><FormControl><Input type="number" placeholder="Max attendees" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="attendance_target" render={({ field }: any) => (
            <FormItem><FormLabel>Attendance Target</FormLabel><FormControl><Input type="number" placeholder="Target attendees" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Target attendance for performance tracking.</FormDescription><FormMessage /></FormItem>
          )} />

          <FormField control={formInstance.control} name="cost_currency_code" render={({ field }: any) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <select {...field} value={field.value || ''} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select currency</option>
                  {currencies?.map((c) => (<option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={formInstance.control} name="cost" render={({ field }: any) => (
            <FormItem><FormLabel>Event Cost</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        {/* Card Image (EN) */}
        <FormField control={formInstance.control} name="event_card_image" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Card Image (for Events Page)</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" {...field} value={undefined} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { onChange(file); setCardPrev(URL.createObjectURL(file)); }
              }} />
            </FormControl>
            <FormDescription>Recommended: 1200x900px (4:3 ratio).</FormDescription>
            {cardPrev && (
              <div className="mt-2 relative w-48 aspect-[4/3] rounded-md overflow-hidden border group">
                <img src={cardPrev} alt="Card preview" className="object-cover w-full h-full" />
                <button type="button" onClick={() => { setCardPrev(''); onChange(undefined); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {/* Card Image (FR) */}
        <FormField control={formInstance.control} name="event_card_image_fr" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Card Image (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" {...field} value={undefined} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { onChange(file); setCardPrevFr(URL.createObjectURL(file)); }
              }} />
            </FormControl>
            <FormDescription>French version. Recommended: 1200x900px (4:3 ratio).</FormDescription>
            {cardPrevFr && (
              <div className="mt-2 relative w-48 aspect-[4/3] rounded-md overflow-hidden border group">
                <img src={cardPrevFr} alt="French card preview" className="object-cover w-full h-full" />
                <button type="button" onClick={() => { setCardPrevFr(''); onChange(undefined); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {/* Hero images (EN) */}
        <FormField control={formInstance.control} name="image_files" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Hero Images (Slider)</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" multiple {...field} onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 5);
                onChange(files);
                setHeroPrevs(files.map((f) => URL.createObjectURL(f)));
              }} />
            </FormControl>
            <FormDescription>Up to 5 images. First is primary. Recommended 1920x1080px.</FormDescription>
            {heroPrevs.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {heroPrevs.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-md overflow-hidden border group">
                    <img src={p} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {/* Hero images (FR) */}
        <FormField control={formInstance.control} name="image_files_fr" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Hero Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" multiple {...field} onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 5);
                onChange(files);
                setHeroPrevsFr(files.map((f) => URL.createObjectURL(f)));
              }} />
            </FormControl>
            <FormDescription>Up to 5 French hero images.</FormDescription>
            {heroPrevsFr.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {heroPrevsFr.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-md overflow-hidden border">
                    <img src={p} alt={`French ${idx + 1}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {/* Gallery (EN) */}
        <FormField control={formInstance.control} name="gallery_images" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Gallery Images</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" multiple {...field} onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 10);
                onChange(files);
                setGalPrevs(files.map((f) => URL.createObjectURL(f)));
              }} />
            </FormControl>
            <FormDescription>Up to 10 images for the event gallery section.</FormDescription>
            {galPrevs.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {galPrevs.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-md overflow-hidden border">
                    <img src={p} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {/* Gallery (FR) */}
        <FormField control={formInstance.control} name="gallery_images_fr" render={({ field: { onChange, value, ...field } }: any) => (
          <FormItem>
            <FormLabel>Event Gallery Images (French) <Languages className="inline h-4 w-4 ml-1" /></FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" multiple {...field} onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 10);
                onChange(files);
                setGalPrevsFr(files.map((f) => URL.createObjectURL(f)));
              }} />
            </FormControl>
            <FormDescription>Up to 10 French gallery images.</FormDescription>
            {galPrevsFr.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {galPrevsFr.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-md overflow-hidden border">
                    <img src={p} alt={`French gallery ${idx + 1}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={formInstance.control} name="registration_url" render={({ field }: any) => (
          <FormItem><FormLabel>External Registration URL</FormLabel><FormControl><Input type="url" placeholder="https://forms.google.com/..." {...field} /></FormControl><FormDescription>External registration link (Google Forms, Eventbrite, etc.).</FormDescription><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={formInstance.control} name="organizer_name" render={({ field }: any) => (
            <FormItem><FormLabel>Organizer Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="organizer_email" render={({ field }: any) => (
            <FormItem><FormLabel>Organizer Email</FormLabel><FormControl><Input type="email" placeholder="organizer@example.com" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="whatsapp_contact" render={({ field }: any) => (
            <FormItem><FormLabel>WhatsApp Contact</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl><FormDescription>Include country code.</FormDescription><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={formInstance.control} name="description" render={({ field }: any) => (
          <FormItem><FormLabel>Event Description</FormLabel><FormControl><Textarea className="min-h-[120px]" placeholder="Provide details about the event..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        {/* French translations */}
        <Collapsible className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">🇫🇷 French Translations (Optional)</h4>
              <p className="text-xs text-muted-foreground">Serve French-speaking visitors.</p>
            </div>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-3">
            <FormField control={formInstance.control} name="name_fr" render={({ field }: any) => (
              <FormItem><FormLabel>Event Name (French)</FormLabel><FormControl><Input placeholder="Nom de l'événement" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={formInstance.control} name="description_fr" render={({ field }: any) => (
              <FormItem><FormLabel>Description (French)</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Description de l'événement" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={formInstance.control} name="location_name_fr" render={({ field }: any) => (
              <FormItem><FormLabel>Location Name (French)</FormLabel><FormControl><Input placeholder="Nom du lieu" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={formInstance.control} name="address_fr" render={({ field }: any) => (
              <FormItem><FormLabel>Address (French)</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Adresse complète" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CollapsibleContent>
        </Collapsible>

        {/* Testimonials */}
        <Collapsible className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Testimonials (Optional)</h4>
              <p className="text-xs text-muted-foreground">Add testimonials from previous attendees.</p>
            </div>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-3">
            {tFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-sm">Testimonial {index + 1}</h5>
                    <Button type="button" variant="ghost" size="sm" onClick={() => tRemove(index)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={formInstance.control} name={`testimonials.${index}.name`} render={({ field }: any) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="John Doe" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={formInstance.control} name={`testimonials.${index}.role`} render={({ field }: any) => (
                      <FormItem><FormLabel>Role/Title</FormLabel><FormControl><Input {...field} placeholder="Previous Attendee" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={formInstance.control} name={`testimonials.${index}.content`} render={({ field }: any) => (
                    <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} maxLength={300} rows={3} placeholder="This event was amazing..." /></FormControl><FormDescription>{field.value?.length || 0}/300</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={formInstance.control} name={`testimonials.${index}.rating`} render={({ field }: any) => (
                    <FormItem><FormLabel>Rating (1-5)</FormLabel><FormControl><Input type="number" min={1} max={5} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground"><Languages className="h-4 w-4 mr-2" />🇫🇷 French Translation</Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <FormField control={formInstance.control} name={`testimonials.${index}.name_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Name (French)</FormLabel><FormControl><Input placeholder="Nom" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formInstance.control} name={`testimonials.${index}.role_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Role (French)</FormLabel><FormControl><Input placeholder="Rôle" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formInstance.control} name={`testimonials.${index}.content_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Content (French)</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Contenu" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => tAppend({ name: "", role: "", content: "", rating: 5 } as any)}>
              <Plus className="mr-2 h-4 w-4" />Add Testimonial
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* FAQs */}
        <Collapsible className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">FAQs (Optional)</h4>
              <p className="text-xs text-muted-foreground">Frequently asked questions.</p>
            </div>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-3">
            {fFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-sm">FAQ {index + 1}</h5>
                    <Button type="button" variant="ghost" size="sm" onClick={() => fRemove(index)}><X className="h-4 w-4" /></Button>
                  </div>
                  <FormField control={formInstance.control} name={`faqs.${index}.question`} render={({ field }: any) => (
                    <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} placeholder="How do I register?" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={formInstance.control} name={`faqs.${index}.answer`} render={({ field }: any) => (
                    <FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea {...field} rows={3} maxLength={500} placeholder="You can register by..." /></FormControl><FormDescription>{field.value?.length || 0}/500</FormDescription><FormMessage /></FormItem>
                  )} />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground"><Languages className="h-4 w-4 mr-2" />🇫🇷 French Translation</Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <FormField control={formInstance.control} name={`faqs.${index}.question_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Question (French)</FormLabel><FormControl><Input placeholder="Question en français" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formInstance.control} name={`faqs.${index}.answer_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Answer (French)</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Réponse" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => fAppend({ question: "", answer: "" } as any)}>
              <Plus className="mr-2 h-4 w-4" />Add FAQ
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Speakers */}
        <Collapsible className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Event Speakers (Optional)</h4>
              <p className="text-xs text-muted-foreground">Add speakers and their details.</p>
            </div>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-3">
            {sFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-sm">Speaker {index + 1}</h5>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      sRemove(index);
                      const np = { ...spkPrevs }; delete np[index]; setSpkPrevs(np);
                    }}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={formInstance.control} name={`speakers.${index}.name`} render={({ field }: any) => (
                      <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Dr. John Smith" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={formInstance.control} name={`speakers.${index}.title`} render={({ field }: any) => (
                      <FormItem><FormLabel>Title/Role *</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Keynote Speaker" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={formInstance.control} name={`speakers.${index}.bio`} render={({ field }: any) => (
                    <FormItem><FormLabel>Biography</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={3} maxLength={500} placeholder="Brief biography..." /></FormControl><FormDescription>{field.value?.length || 0}/500</FormDescription><FormMessage /></FormItem>
                  )} />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground"><Languages className="h-4 w-4 mr-2" />🇫🇷 French Translation</Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <FormField control={formInstance.control} name={`speakers.${index}.name_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Name (French)</FormLabel><FormControl><Input placeholder="Nom" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formInstance.control} name={`speakers.${index}.title_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Title (French)</FormLabel><FormControl><Input placeholder="Titre" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formInstance.control} name={`speakers.${index}.bio_fr`} render={({ field }: any) => (
                        <FormItem><FormLabel>Biography (French)</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Biographie" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CollapsibleContent>
                  </Collapsible>
                  <FormField control={formInstance.control} name={`speakers.${index}.photo`} render={({ field: { onChange, value, ...field } }: any) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" {...field} value={undefined} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            setSpkPrevs({ ...spkPrevs, [index]: URL.createObjectURL(file) });
                          }
                        }} />
                      </FormControl>
                      {spkPrevs[index] && (
                        <div className="mt-2"><img src={spkPrevs[index]} alt="Preview" className="w-24 h-24 object-cover rounded-full border-2 border-primary/20" /></div>
                      )}
                      <FormDescription>Square image recommended (400x400px).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={formInstance.control} name={`speakers.${index}.linkedin_url`} render={({ field }: any) => (
                      <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={formInstance.control} name={`speakers.${index}.twitter_url`} render={({ field }: any) => (
                      <FormItem><FormLabel>Twitter/X URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://twitter.com/..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={formInstance.control} name={`speakers.${index}.website_url`} render={({ field }: any) => (
                      <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => sAppend({ name: "", title: "", bio: "", linkedin_url: "", twitter_url: "", website_url: "", display_order: sFields.length } as any)}>
              <Plus className="mr-2 h-4 w-4" />Add Speaker
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Booleans */}
        <div className="flex items-center gap-6 flex-wrap">
          <FormField control={formInstance.control} name="is_public" render={({ field }: any) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Public Event</FormLabel></FormItem>
          )} />
          <FormField control={formInstance.control} name="is_featured" render={({ field }: any) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Featured</FormLabel></FormItem>
          )} />
          <FormField control={formInstance.control} name="is_special" render={({ field }: any) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Special Event</FormLabel></FormItem>
          )} />
          {formInstance.watch('is_special') && (
            <FormField control={formInstance.control} name="requires_pre_registration" render={({ field }: any) => (
              <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Requires Pre-Registration</FormLabel></FormItem>
            )} />
          )}
        </div>

        {formInstance.watch('is_special') && (
          <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-500/5 space-y-3">
            <h4 className="text-sm font-semibold text-amber-700">Special Event Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField control={formInstance.control} name="collect_lodging" render={({ field }: any) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Collect lodging</FormLabel></FormItem>
              )} />
              <FormField control={formInstance.control} name="collect_meal_preferences" render={({ field }: any) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Collect meal preferences</FormLabel></FormItem>
              )} />
              <FormField control={formInstance.control} name="collect_pledges" render={({ field }: any) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" /></FormControl><FormLabel className="font-normal">Collect pledges</FormLabel></FormItem>
              )} />
            </div>
            <FormField control={formInstance.control} name="linked_fundraising_campaign_id" render={({ field }: any) => (
              <FormItem>
                <FormLabel>Linked Fundraising Campaign</FormLabel>
                <FormControl>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={field.value || ""} onChange={field.onChange}>
                    <option value="">— None —</option>
                    {(campaigns || []).map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.currency_code} {c.goal?.toLocaleString?.() || c.goal})</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
            {(createEvent.isPending || updateEvent.isPending) ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
    );
  };


  const renderTypeBadge = (event: any) => {
    if (event.is_special) return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30">Special</Badge>;
    if (event.dcg_id) return <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/20 border-purple-500/30">DCG</Badge>;
    if (!event.region_id) return <Badge className="bg-primary/15 text-primary border-primary/30"><Globe className="h-3 w-3 mr-1" />Global</Badge>;
    return <Badge variant="secondary">Regional</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Period + filters row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <PeriodFilter
          filters={periodFilters}
          onFiltersChange={(p) => setPeriodFilters(prev => ({ ...prev, ...p }))}
          className="mb-0"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events..." className="pl-8 w-[220px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regional">Regional</SelectItem>
              <SelectItem value="dcg">DCG</SelectItem>
              <SelectItem value="special">Special</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Regions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {(regions || []).map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Event</Button>
        </div>
      </div>

      {/* KPI cards (5) */}
      <div className="grid gap-4 md:grid-cols-5">
        {renderKpi('Total Events', analyticsData.total.count, `Avg: ${analyticsData.total.avg} attendees`, analyticsData.total.growth, CalendarDays, 'text-primary', 'bg-primary/10')}
        {renderKpi('Regional Events', analyticsData.regional.count, `Avg: ${analyticsData.regional.avg} attendees`, analyticsData.regional.growth, Layers, 'text-primary', 'bg-primary/10')}
        {renderKpi('DCG Events', analyticsData.dcg.count, `Avg: ${analyticsData.dcg.avg} attendees`, analyticsData.dcg.growth, UserCheck, 'text-purple-600', 'bg-purple-500/10')}
        {renderKpi('Special Events', analyticsData.special.count, `Avg: ${analyticsData.special.avg} attendees`, analyticsData.special.growth, Star, 'text-amber-600', 'bg-amber-500/10')}
        {renderKpi('Attendance Target', `${analyticsData.target.pct}%`, `${analyticsData.target.totalAttendees} of ${analyticsData.target.totalCapacity} capacity`, null, Target, 'text-emerald-600', 'bg-emerald-500/10')}
      </div>

      {/* Events table */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Events</h3>
            <p className="text-sm text-muted-foreground">View and manage events across all WCA regions.</p>
          </div>
        </div>
        <div className="p-2 overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No events found for the selected filters.</TableCell></TableRow>
                ) : filteredEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {event.is_public ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">{event.is_public ? 'Public' : 'Private'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{renderTypeBadge(event)}</TableCell>
                    <TableCell className="text-sm">{formatDateRange(event.start_datetime, event.end_datetime)}</TableCell>
                    <TableCell className="text-sm">{formatTimeRange(event.start_datetime, event.end_datetime)}</TableCell>
                    <TableCell className="text-sm">{event.location_name || 'TBD'}</TableCell>
                    <TableCell className="text-sm">
                      {event.region_id ? (event.regions?.name || 'Regional') : <span className="inline-flex items-center gap-1 text-primary"><Globe className="h-3 w-3" />Global</span>}
                    </TableCell>
                    <TableCell className="text-right text-sm">{event.capacity ?? 'N/A'}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{getEventAttendance(event.id)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(event)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedEvent(event); setAttendanceDialogOpen(true); }}><UserCheck className="mr-2 h-4 w-4" />Mark Attendance</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyAttendanceLink(event)}><Link2 className="mr-2 h-4 w-4" />Copy Attendance Link</DropdownMenuItem>
                          {event.is_special && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                const id = event.slug || event.id;
                                navigator.clipboard.writeText(`${window.location.origin}/events/${id}/register`);
                                toast({ title: "Link copied", description: "Special event registration link copied." });
                              }}><Link2 className="mr-2 h-4 w-4" />Copy Registration Link</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/super/events/${event.id}/special-report`)}>
                                <Star className="mr-2 h-4 w-4" />Special Event Report
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setEventToDelete(event.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) { form.reset(defaultFormValues); resetCreateImagePreviews(); setSlugManuallyEdited(false); setAutoGeneratedSlug(''); }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative px-6 pt-6 pb-4 border-b border-border/40 bg-gradient-to-br from-card via-card/80 to-card/40 backdrop-blur-sm">
            <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
            <DialogHeader className="relative space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight">Create Global Event</DialogTitle>
              </div>
              <DialogDescription>Create an inter-regional event visible across all regions.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            {renderEventForm(form, onSubmit)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) { setEventToEdit(null); resetEditImagePreviews(); setSlugManuallyEdited(false); }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative px-6 pt-6 pb-4 border-b border-border/40 bg-gradient-to-br from-card via-card/80 to-card/40 backdrop-blur-sm">
            <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
            <DialogHeader className="relative space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                  <Edit className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight">Edit Event</DialogTitle>
              </div>
              <DialogDescription>Update event details.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            {renderEventForm(editForm, onEditSubmit, true)}
          </div>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes this event and all associated attendance records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => eventToDelete && handleDelete(eventToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Dialog */}
      {selectedEvent && (
        <GlobalAttendanceDialog
          isOpen={attendanceDialogOpen}
          onClose={() => { setAttendanceDialogOpen(false); setSelectedEvent(null); }}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default SuperEvents;

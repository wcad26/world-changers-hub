export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          dcg_id: string | null
          description: string | null
          event_date: string
          id: string
          name: string
          region_id: string
          source_event_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          event_date: string
          id?: string
          name: string
          region_id: string
          source_event_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          event_date?: string
          id?: string
          name?: string
          region_id?: string
          source_event_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_dcg_id_fkey"
            columns: ["dcg_id"]
            isOneToOne: false
            referencedRelation: "dcgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          event_id: string
          id: string
          is_present: boolean | null
          member_id: string
          recorded_at: string | null
          recorded_by: string | null
        }
        Insert: {
          event_id: string
          id?: string
          is_present?: boolean | null
          member_id: string
          recorded_at?: string | null
          recorded_by?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          is_present?: boolean | null
          member_id?: string
          recorded_at?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attendance_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_books: {
        Row: {
          abbreviation: string
          book_number: number
          chapters_count: number
          created_at: string | null
          id: string
          name: string
          name_fr: string | null
          testament: string
        }
        Insert: {
          abbreviation: string
          book_number: number
          chapters_count: number
          created_at?: string | null
          id?: string
          name: string
          name_fr?: string | null
          testament: string
        }
        Update: {
          abbreviation?: string
          book_number?: number
          chapters_count?: number
          created_at?: string | null
          id?: string
          name?: string
          name_fr?: string | null
          testament?: string
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book_number: number
          chapter: number
          created_at: string | null
          id: string
          text: string
          verse: number
          version_id: string
        }
        Insert: {
          book_number: number
          chapter: number
          created_at?: string | null
          id?: string
          text: string
          verse: number
          version_id: string
        }
        Update: {
          book_number?: number
          chapter?: number
          created_at?: string | null
          id?: string
          text?: string
          verse?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_versions: {
        Row: {
          api_id: string | null
          code: string
          copyright_info: string | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_stored: boolean
          language: string
          name: string
        }
        Insert: {
          api_id?: string | null
          code: string
          copyright_info?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_stored?: boolean
          language?: string
          name: string
        }
        Update: {
          api_id?: string | null
          code?: string
          copyright_info?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_stored?: boolean
          language?: string
          name?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          additional_fields: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name_position: Json | null
          qr_position: Json | null
          region_id: string | null
          template_name: string
          template_type: string
          template_url: string
        }
        Insert: {
          additional_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name_position?: Json | null
          qr_position?: Json | null
          region_id?: string | null
          template_name: string
          template_type: string
          template_url: string
        }
        Update: {
          additional_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name_position?: Json | null
          qr_position?: Json | null
          region_id?: string | null
          template_name?: string
          template_type?: string
          template_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          certificate_url: string
          created_at: string | null
          email_delivery_details: Json | null
          email_last_status_update: string | null
          email_sent_at: string | null
          email_status:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          event_date: string | null
          event_name: string | null
          id: string
          is_active: boolean | null
          issued_by: string | null
          issued_date: string
          member_id: string | null
          qr_code_data: string | null
          recipient_email: string | null
          recipient_name: string
          region_id: string
          resend_email_id: string | null
          updated_at: string | null
          verification_code: string
        }
        Insert: {
          certificate_number: string
          certificate_type: string
          certificate_url: string
          created_at?: string | null
          email_delivery_details?: Json | null
          email_last_status_update?: string | null
          email_sent_at?: string | null
          email_status?:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          issued_date?: string
          member_id?: string | null
          qr_code_data?: string | null
          recipient_email?: string | null
          recipient_name: string
          region_id: string
          resend_email_id?: string | null
          updated_at?: string | null
          verification_code: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          certificate_url?: string
          created_at?: string | null
          email_delivery_details?: Json | null
          email_last_status_update?: string | null
          email_sent_at?: string | null
          email_status?:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          issued_date?: string
          member_id?: string | null
          qr_code_data?: string | null
          recipient_email?: string | null
          recipient_name?: string
          region_id?: string
          resend_email_id?: string | null
          updated_at?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          region_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          region_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          region_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_templates_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          audience: string
          channels: string[]
          content: string
          created_at: string
          created_by: string | null
          id: string
          message_type:
            | Database["public"]["Enums"]["communication_message_type"]
            | null
          region_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["communication_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          channels: string[]
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_type?:
            | Database["public"]["Enums"]["communication_message_type"]
            | null
          region_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"]
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          channels?: string[]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_type?:
            | Database["public"]["Enums"]["communication_message_type"]
            | null
          region_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          decimal_places: number | null
          id: string
          is_active: boolean | null
          name: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dcg_members: {
        Row: {
          created_at: string
          dcg_id: string
          id: string
          is_active: boolean
          joined_date: string
          member_id: string
          role: Database["public"]["Enums"]["dcg_member_role"]
        }
        Insert: {
          created_at?: string
          dcg_id: string
          id?: string
          is_active?: boolean
          joined_date?: string
          member_id: string
          role?: Database["public"]["Enums"]["dcg_member_role"]
        }
        Update: {
          created_at?: string
          dcg_id?: string
          id?: string
          is_active?: boolean
          joined_date?: string
          member_id?: string
          role?: Database["public"]["Enums"]["dcg_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "dcg_members_dcg_id_fkey"
            columns: ["dcg_id"]
            isOneToOne: false
            referencedRelation: "dcgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dcg_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dcg_user_sessions: {
        Row: {
          created_at: string | null
          dcg_id: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dcg_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dcg_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dcg_user_sessions_dcg_id_fkey"
            columns: ["dcg_id"]
            isOneToOne: false
            referencedRelation: "dcgs"
            referencedColumns: ["id"]
          },
        ]
      }
      dcgs: {
        Row: {
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          leader_id: string | null
          location: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dcgs_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dcgs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_progress: {
        Row: {
          achieved_date: string | null
          created_at: string | null
          id: string
          milestone: Database["public"]["Enums"]["discipleship_milestone"]
          notes: string | null
          recorded_by: string | null
          relationship_id: string
        }
        Insert: {
          achieved_date?: string | null
          created_at?: string | null
          id?: string
          milestone: Database["public"]["Enums"]["discipleship_milestone"]
          notes?: string | null
          recorded_by?: string | null
          relationship_id: string
        }
        Update: {
          achieved_date?: string | null
          created_at?: string | null
          id?: string
          milestone?: Database["public"]["Enums"]["discipleship_milestone"]
          notes?: string | null
          recorded_by?: string | null
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipleship_progress_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "discipleship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_relationships: {
        Row: {
          created_at: string | null
          disciple_id: string
          end_date: string | null
          id: string
          mentor_id: string
          notes: string | null
          region_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["discipleship_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disciple_id: string
          end_date?: string | null
          id?: string
          mentor_id: string
          notes?: string | null
          region_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["discipleship_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disciple_id?: string
          end_date?: string | null
          id?: string
          mentor_id?: string
          notes?: string | null
          region_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["discipleship_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_relationships_disciple_id_fkey"
            columns: ["disciple_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipleship_relationships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipleship_relationships_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faqs: {
        Row: {
          answer: string
          answer_fr: string | null
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          question: string
          question_fr: string | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          answer_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          question: string
          question_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          answer_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          question?: string
          question_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          image_url: string
          image_url_fr: string | null
          is_hero_image: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          image_url: string
          image_url_fr?: string | null
          is_hero_image?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          image_url?: string
          image_url_fr?: string | null
          is_hero_image?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_slug_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          event_id: string
          id: string
          old_slug: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          event_id: string
          id?: string
          old_slug: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          event_id?: string
          id?: string
          old_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_slug_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          bio: string | null
          bio_fr: string | null
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          linkedin_url: string | null
          name: string
          name_fr: string | null
          photo_url: string | null
          title: string
          title_fr: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          bio_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          linkedin_url?: string | null
          name: string
          name_fr?: string | null
          photo_url?: string | null
          title: string
          title_fr?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          bio_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          name_fr?: string | null
          photo_url?: string | null
          title?: string
          title_fr?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_testimonials: {
        Row: {
          content: string
          content_fr: string | null
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          name: string
          name_fr: string | null
          rating: number | null
          role: string
          role_fr: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          name: string
          name_fr?: string | null
          rating?: number | null
          role: string
          role_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_fr?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          name?: string
          name_fr?: string | null
          rating?: number | null
          role?: string
          role_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_testimonials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          address_fr: string | null
          attendance_target: number | null
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"] | null
          cost: number | null
          cost_currency_code: string | null
          created_at: string
          created_by: string | null
          dcg_id: string | null
          description: string | null
          description_fr: string | null
          end_datetime: string | null
          id: string
          image_url: string | null
          image_url_fr: string | null
          is_featured: boolean
          is_public: boolean
          is_special: boolean | null
          location_name: string | null
          location_name_fr: string | null
          name: string
          name_fr: string | null
          organizer_email: string | null
          organizer_name: string | null
          organizer_phone: string | null
          region_id: string | null
          registration_url: string | null
          requirements: string | null
          requirements_fr: string | null
          slug: string | null
          start_datetime: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          whatsapp_contact: string | null
        }
        Insert: {
          address?: string | null
          address_fr?: string | null
          attendance_target?: number | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          cost?: number | null
          cost_currency_code?: string | null
          created_at?: string
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          description_fr?: string | null
          end_datetime?: string | null
          id?: string
          image_url?: string | null
          image_url_fr?: string | null
          is_featured?: boolean
          is_public?: boolean
          is_special?: boolean | null
          location_name?: string | null
          location_name_fr?: string | null
          name: string
          name_fr?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          region_id?: string | null
          registration_url?: string | null
          requirements?: string | null
          requirements_fr?: string | null
          slug?: string | null
          start_datetime: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          whatsapp_contact?: string | null
        }
        Update: {
          address?: string | null
          address_fr?: string | null
          attendance_target?: number | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          cost?: number | null
          cost_currency_code?: string | null
          created_at?: string
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          description_fr?: string | null
          end_datetime?: string | null
          id?: string
          image_url?: string | null
          image_url_fr?: string | null
          is_featured?: boolean
          is_public?: boolean
          is_special?: boolean | null
          location_name?: string | null
          location_name_fr?: string | null
          name?: string
          name_fr?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          region_id?: string | null
          registration_url?: string | null
          requirements?: string | null
          requirements_fr?: string | null
          slug?: string | null
          start_datetime?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          whatsapp_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_cost_currency_code_fkey"
            columns: ["cost_currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "events_dcg_id_fkey"
            columns: ["dcg_id"]
            isOneToOne: false
            referencedRelation: "dcgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transaction_categories: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["financial_transaction_type"]
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["financial_transaction_type"]
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["financial_transaction_type"]
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency_code: string
          dcg_id: string | null
          description: string | null
          id: string
          recorded_by: string | null
          region_id: string
          transaction_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency_code?: string
          dcg_id?: string | null
          description?: string | null
          id?: string
          recorded_by?: string | null
          region_id: string
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency_code?: string
          dcg_id?: string | null
          description?: string | null
          id?: string
          recorded_by?: string | null
          region_id?: string
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "financial_transactions_dcg_id_fkey"
            columns: ["dcg_id"]
            isOneToOne: false
            referencedRelation: "dcgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraising_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          currency_code: string
          description: string | null
          end_date: string
          goal: number
          id: string
          image_url: string | null
          is_public: boolean
          name: string
          raised: number
          region_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          end_date: string
          goal: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          name: string
          raised?: number
          region_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          end_date?: string
          goal?: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          name?: string
          raised?: number
          region_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_fundraising_campaigns_currency"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundraising_campaigns_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraising_donations: {
        Row: {
          amount: number
          anonymous: boolean
          campaign_id: string
          created_at: string
          currency_code: string
          donation_date: string
          donor_email: string | null
          donor_name: string | null
          id: string
          message: string | null
        }
        Insert: {
          amount: number
          anonymous?: boolean
          campaign_id: string
          created_at?: string
          currency_code?: string
          donation_date?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          amount?: number
          anonymous?: boolean
          campaign_id?: string
          created_at?: string
          currency_code?: string
          donation_date?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fundraising_donations_currency"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundraising_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      global_content: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          page_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          page_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          page_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          capacity: number | null
          city: string
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          facilities: string | null
          fellowship_times: Json | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          region_id: string
          state: string
          status: string
          type: string
          updated_at: string
          website_url: string | null
          whatsapp_link: string | null
          zip: string
        }
        Insert: {
          address: string
          capacity?: number | null
          city: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: string | null
          fellowship_times?: Json | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          region_id: string
          state: string
          status?: string
          type: string
          updated_at?: string
          website_url?: string | null
          whatsapp_link?: string | null
          zip: string
        }
        Update: {
          address?: string
          capacity?: number | null
          city?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: string | null
          fellowship_times?: Json | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          region_id?: string
          state?: string
          status?: string
          type?: string
          updated_at?: string
          website_url?: string | null
          whatsapp_link?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_targets: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          region_id: string
          target_date: string
          target_members: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          region_id: string
          target_date: string
          target_members: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          region_id?: string
          target_date?: string
          target_members?: number
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          baptism_date: string | null
          created_at: string | null
          event_satisfaction_rating: number | null
          foundation_school_date: string | null
          id: string
          is_volunteer: boolean | null
          join_date: string | null
          member_id: string
          member_type: string
          membership_class_completed: boolean | null
          notes: string | null
          photo_url: string | null
          preferred_service_areas: string[] | null
          profile_id: string | null
          rated_event_id: string | null
          referral_other_details: string | null
          referral_person_name: string | null
          referral_source: string | null
          region_id: string
          skills_talents: string[] | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
        }
        Insert: {
          baptism_date?: string | null
          created_at?: string | null
          event_satisfaction_rating?: number | null
          foundation_school_date?: string | null
          id?: string
          is_volunteer?: boolean | null
          join_date?: string | null
          member_id: string
          member_type?: string
          membership_class_completed?: boolean | null
          notes?: string | null
          photo_url?: string | null
          preferred_service_areas?: string[] | null
          profile_id?: string | null
          rated_event_id?: string | null
          referral_other_details?: string | null
          referral_person_name?: string | null
          referral_source?: string | null
          region_id: string
          skills_talents?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Update: {
          baptism_date?: string | null
          created_at?: string | null
          event_satisfaction_rating?: number | null
          foundation_school_date?: string | null
          id?: string
          is_volunteer?: boolean | null
          join_date?: string | null
          member_id?: string
          member_type?: string
          membership_class_completed?: boolean | null
          notes?: string | null
          photo_url?: string | null
          preferred_service_areas?: string[] | null
          profile_id?: string | null
          rated_event_id?: string | null
          referral_other_details?: string | null
          referral_person_name?: string | null
          referral_source?: string | null
          region_id?: string
          skills_talents?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_rated_event_id_fkey"
            columns: ["rated_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          is_used: boolean
          otp_code: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          is_used?: boolean
          otp_code: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          otp_code?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          occupation: string | null
          phone: string | null
          region_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          occupation?: string | null
          phone?: string | null
          region_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          occupation?: string | null
          phone?: string | null
          region_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          permissions: Json
          region_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          permissions?: Json
          region_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: Json
          region_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      regional_user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          is_active: boolean
          region_id: string
          regional_role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_active?: boolean
          region_id: string
          regional_role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_active?: boolean
          region_id?: string
          regional_role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_user_roles_regional_role_id_fkey"
            columns: ["regional_role_id"]
            isOneToOne: false
            referencedRelation: "regional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          currency_code: string | null
          description: string | null
          established_date: string | null
          hero_slide_images: Json | null
          hero_slide_images_mobile: Json | null
          hero_slide_images_tablet: Json | null
          id: string
          is_active: boolean | null
          name: string
          regional_president: string | null
          regional_president_photo: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency_code?: string | null
          description?: string | null
          established_date?: string | null
          hero_slide_images?: Json | null
          hero_slide_images_mobile?: Json | null
          hero_slide_images_tablet?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          regional_president?: string | null
          regional_president_photo?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency_code?: string | null
          description?: string | null
          established_date?: string | null
          hero_slide_images?: Json | null
          hero_slide_images_mobile?: Json | null
          hero_slide_images_tablet?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          regional_president?: string | null
          regional_president_photo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          region_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_role_status"] | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          region_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_role_status"] | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_role_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_member_id: { Args: { _region_id: string }; Returns: string }
      get_attendance_summary: {
        Args: { p_region_id: string }
        Returns: {
          absent_count: number
          event_date: string
          event_id: string
          event_name: string
          present_count: number
        }[]
      }
      get_discipleship_impact_trend: {
        Args: { _member_id: string; _region_id: string }
        Returns: {
          disciples_attended: number
          event_date: string
          event_name: string
          mentor_attended: boolean
        }[]
      }
      get_global_attendance_summary: {
        Args: never
        Returns: {
          avg_attendance: number
          region_id: string
          total_events: number
          total_present: number
        }[]
      }
      get_member_discipleship_stats: {
        Args: { _member_id: string }
        Returns: {
          active_disciples: number
          completed_disciples: number
          success_rate: number
          total_disciples: number
        }[]
      }
      get_member_ids_for_user: { Args: { _user_id: string }; Returns: string[] }
      get_next_dcg_meeting: {
        Args: { _dcg_id: string }
        Returns: {
          event_date: string
          event_id: string
          event_name: string
          is_today: boolean
          is_upcoming: boolean
        }[]
      }
      get_region_from_dcg: { Args: { _dcg_id: string }; Returns: string }
      get_user_dcg: { Args: { _user_id: string }; Returns: string }
      get_user_region: { Args: { _user_id: string }; Returns: string }
      has_regional_permission: {
        Args: { _permission: string; _region_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_region: {
        Args: { _region_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "regional_admin" | "member" | "dcg_admin"
      communication_message_type:
        | "announcement"
        | "invitation"
        | "reminder"
        | "update"
        | "urgent"
      communication_status:
        | "draft"
        | "sent"
        | "scheduled"
        | "failed"
        | "cancelled"
      dcg_member_role: "Leader" | "Assistant" | "Member"
      discipleship_milestone:
        | "first_visit"
        | "second_visit"
        | "committed"
        | "baptized"
        | "became_member"
        | "serving"
      discipleship_status: "active" | "completed" | "transferred" | "inactive"
      email_delivery_status:
        | "pending"
        | "sent"
        | "delivered"
        | "bounced"
        | "failed"
        | "complained"
      event_category:
        | "Conference"
        | "Worship"
        | "Revival"
        | "Outreach"
        | "Training"
        | "Workshop"
        | "Community Service"
        | "Bible Study"
        | "Retreat"
        | "Seminar"
        | "DCG Meeting"
        | "Other"
      event_status: "Upcoming" | "Completed" | "Cancelled" | "Draft"
      financial_transaction_type: "Income" | "Expense"
      member_status: "active" | "inactive" | "new" | "transferred"
      regional_permission:
        | "dashboard_view"
        | "members_view"
        | "members_create"
        | "members_edit"
        | "members_export"
        | "events_view"
        | "events_create"
        | "events_edit"
        | "events_delete"
        | "finances_view"
        | "finances_create"
        | "finances_edit"
        | "dcg_view"
        | "dcg_create"
        | "dcg_edit"
        | "reports_view"
        | "reports_export"
        | "communication_view"
        | "communication_create"
        | "communication_send"
        | "locations_view"
        | "locations_create"
        | "locations_edit"
        | "fundraising_view"
        | "fundraising_create"
        | "fundraising_edit"
        | "settings_view"
        | "settings_edit"
      user_role_status: "pending" | "active" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "regional_admin", "member", "dcg_admin"],
      communication_message_type: [
        "announcement",
        "invitation",
        "reminder",
        "update",
        "urgent",
      ],
      communication_status: [
        "draft",
        "sent",
        "scheduled",
        "failed",
        "cancelled",
      ],
      dcg_member_role: ["Leader", "Assistant", "Member"],
      discipleship_milestone: [
        "first_visit",
        "second_visit",
        "committed",
        "baptized",
        "became_member",
        "serving",
      ],
      discipleship_status: ["active", "completed", "transferred", "inactive"],
      email_delivery_status: [
        "pending",
        "sent",
        "delivered",
        "bounced",
        "failed",
        "complained",
      ],
      event_category: [
        "Conference",
        "Worship",
        "Revival",
        "Outreach",
        "Training",
        "Workshop",
        "Community Service",
        "Bible Study",
        "Retreat",
        "Seminar",
        "DCG Meeting",
        "Other",
      ],
      event_status: ["Upcoming", "Completed", "Cancelled", "Draft"],
      financial_transaction_type: ["Income", "Expense"],
      member_status: ["active", "inactive", "new", "transferred"],
      regional_permission: [
        "dashboard_view",
        "members_view",
        "members_create",
        "members_edit",
        "members_export",
        "events_view",
        "events_create",
        "events_edit",
        "events_delete",
        "finances_view",
        "finances_create",
        "finances_edit",
        "dcg_view",
        "dcg_create",
        "dcg_edit",
        "reports_view",
        "reports_export",
        "communication_view",
        "communication_create",
        "communication_send",
        "locations_view",
        "locations_create",
        "locations_edit",
        "fundraising_view",
        "fundraising_create",
        "fundraising_edit",
        "settings_view",
        "settings_edit",
      ],
      user_role_status: ["pending", "active", "rejected"],
    },
  },
} as const

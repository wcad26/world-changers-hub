export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      events: {
        Row: {
          address: string | null
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"] | null
          created_at: string
          created_by: string | null
          dcg_id: string | null
          description: string | null
          end_datetime: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_public: boolean
          location_name: string | null
          name: string
          region_id: string | null
          start_datetime: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          location_name?: string | null
          name: string
          region_id?: string | null
          start_datetime: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string
          created_by?: string | null
          dcg_id?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          location_name?: string | null
          name?: string
          region_id?: string | null
          start_datetime?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: [
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
      members: {
        Row: {
          baptism_date: string | null
          created_at: string | null
          id: string
          is_volunteer: boolean | null
          join_date: string | null
          member_id: string
          membership_class_completed: boolean | null
          notes: string | null
          preferred_service_areas: string[] | null
          profile_id: string | null
          region_id: string
          skills_talents: string[] | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
        }
        Insert: {
          baptism_date?: string | null
          created_at?: string | null
          id?: string
          is_volunteer?: boolean | null
          join_date?: string | null
          member_id: string
          membership_class_completed?: boolean | null
          notes?: string | null
          preferred_service_areas?: string[] | null
          profile_id?: string | null
          region_id: string
          skills_talents?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Update: {
          baptism_date?: string | null
          created_at?: string | null
          id?: string
          is_volunteer?: boolean | null
          join_date?: string | null
          member_id?: string
          membership_class_completed?: boolean | null
          notes?: string | null
          preferred_service_areas?: string[] | null
          profile_id?: string | null
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
            foreignKeyName: "members_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
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
      regions: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          established_date: string | null
          id: string
          is_active: boolean | null
          name: string
          regional_pastor: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          established_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          regional_pastor?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          established_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          regional_pastor?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          region_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          region_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_member_id: {
        Args: { _region_id: string }
        Returns: string
      }
      get_attendance_summary: {
        Args: { p_region_id: string }
        Returns: {
          event_id: string
          event_name: string
          event_date: string
          present_count: number
          absent_count: number
        }[]
      }
      get_region_from_dcg: {
        Args: { _dcg_id: string }
        Returns: string
      }
      get_user_region: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_belongs_to_region: {
        Args: { _user_id: string; _region_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "regional_admin" | "member"
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "regional_admin", "member"],
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
    },
  },
} as const

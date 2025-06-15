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
          description?: string | null
          event_date?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
      member_status: ["active", "inactive", "new", "transferred"],
    },
  },
} as const

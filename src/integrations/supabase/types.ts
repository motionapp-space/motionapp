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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client_activities: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_plan_assignments: {
        Row: {
          assigned_at: string
          client_id: string
          id: string
          note: string | null
          plan_id: string
          status: Database["public"]["Enums"]["plan_status"]
        }
        Insert: {
          assigned_at?: string
          client_id: string
          id?: string
          note?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Update: {
          assigned_at?: string
          client_id?: string
          id?: string
          note?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "client_plan_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_plans: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          data: Json
          derived_from_template_id: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          data?: Json
          derived_from_template_id?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          data?: Json
          derived_from_template_id?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plans_derived_from_template_id_fkey"
            columns: ["derived_from_template_id"]
            isOneToOne: false
            referencedRelation: "plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tag_on_client: {
        Row: {
          client_id: string
          tag_id: string
        }
        Insert: {
          client_id: string
          tag_id: string
        }
        Update: {
          client_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tag_on_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tag_on_client_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "client_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tags: {
        Row: {
          coach_id: string
          color: string | null
          created_at: string
          id: string
          label: string
        }
        Insert: {
          coach_id: string
          color?: string | null
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          coach_id?: string
          color?: string | null
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tags_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          coach_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          coach_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          coach_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          locale: string | null
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          name?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          client_id: string
          coach_id: string
          color: string | null
          created_at: string
          end_at: string
          id: string
          is_all_day: boolean | null
          location: string | null
          notes: string | null
          recurrence_rule: string | null
          reminder_offset_minutes: number | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          color?: string | null
          created_at?: string
          end_at: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          color?: string | null
          created_at?: string
          end_at?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          arm_cm: number | null
          bmi: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          client_id: string
          date: string
          height_cm: number | null
          hip_cm: number | null
          id: string
          lean_mass_kg: number | null
          thigh_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          bmi?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id: string
          date?: string
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          bmi?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id?: string
          date?: string
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_shares_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_template_tag_on_template: {
        Row: {
          tag_id: string
          template_id: string
        }
        Insert: {
          tag_id: string
          template_id: string
        }
        Update: {
          tag_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_template_tag_on_template_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "plan_template_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_template_tag_on_template_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_template_tags: {
        Row: {
          coach_id: string
          color: string | null
          created_at: string
          id: string
          label: string
        }
        Insert: {
          coach_id: string
          color?: string | null
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          coach_id?: string
          color?: string | null
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      plan_templates: {
        Row: {
          category: string | null
          coach_id: string
          created_at: string
          created_by_id: string | null
          data: Json
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          coach_id: string
          created_at?: string
          created_by_id?: string | null
          data?: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          coach_id?: string
          created_at?: string
          created_by_id?: string | null
          data?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          coach_id: string
          content_json: Json
          created_at: string
          duration_weeks: number | null
          goal: string | null
          id: string
          is_template: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          content_json?: Json
          created_at?: string
          duration_weeks?: number | null
          goal?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          content_json?: Json
          created_at?: string
          duration_weeks?: number | null
          goal?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_plan: {
        Args: { share_token: string }
        Returns: {
          coach_name: string
          content_json: Json
          duration_weeks: number
          goal: string
          plan_name: string
        }[]
      }
    }
    Enums: {
      activity_type:
        | "CREATED"
        | "UPDATED"
        | "TAGGED"
        | "ASSIGNED_PLAN"
        | "COMPLETED_PLAN"
        | "ARCHIVED"
      client_status: "POTENZIALE" | "ATTIVO" | "SOSPESO" | "ARCHIVIATO"
      plan_status: "ATTIVA" | "COMPLETATA" | "SCADUTA"
      sex: "M" | "F" | "ALTRO"
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
      activity_type: [
        "CREATED",
        "UPDATED",
        "TAGGED",
        "ASSIGNED_PLAN",
        "COMPLETED_PLAN",
        "ARCHIVED",
      ],
      client_status: ["POTENZIALE", "ATTIVO", "SOSPESO", "ARCHIVIATO"],
      plan_status: ["ATTIVA", "COMPLETATA", "SCADUTA"],
      sex: ["M", "F", "ALTRO"],
    },
  },
} as const

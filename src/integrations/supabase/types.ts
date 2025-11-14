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
      availability_windows: {
        Row: {
          capacity: number | null
          coach_id: string
          created_at: string
          day_of_week: number
          end_date: string | null
          end_time: string
          id: string
          is_active: boolean | null
          location: string | null
          start_date: string | null
          start_time: string
          type: string | null
        }
        Insert: {
          capacity?: number | null
          coach_id: string
          created_at?: string
          day_of_week: number
          end_date?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          start_date?: string | null
          start_time: string
          type?: string | null
        }
        Update: {
          capacity?: number | null
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_date?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          start_date?: string | null
          start_time?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_windows_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          client_id: string
          coach_id: string
          counter_proposal_end_at: string | null
          counter_proposal_start_at: string | null
          created_at: string
          id: string
          notes: string | null
          requested_end_at: string
          requested_start_at: string
          status: Database["public"]["Enums"]["booking_request_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          counter_proposal_end_at?: string | null
          counter_proposal_start_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_end_at: string
          requested_start_at: string
          status?: Database["public"]["Enums"]["booking_request_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          counter_proposal_end_at?: string | null
          counter_proposal_start_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_end_at?: string
          requested_start_at?: string
          status?: Database["public"]["Enums"]["booking_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          approval_mode: Database["public"]["Enums"]["approval_mode"]
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
          buffer_between_minutes: number | null
          cancel_policy_hours: number | null
          coach_id: string
          created_at: string
          enabled: boolean
          id: string
          max_future_days: number | null
          min_advance_notice_hours: number
          slot_duration_minutes: number
          timezone: string | null
          updated_at: string
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          buffer_between_minutes?: number | null
          cancel_policy_hours?: number | null
          coach_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_future_days?: number | null
          min_advance_notice_hours?: number
          slot_duration_minutes?: number
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          buffer_between_minutes?: number | null
          cancel_policy_hours?: number | null
          coach_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_future_days?: number | null
          min_advance_notice_hours?: number
          slot_duration_minutes?: number
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_settings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
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
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          package_type_id: string
          purchased_at: string
          sessions_remaining: number
          sessions_total: number
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          package_type_id: string
          purchased_at?: string
          sessions_remaining: number
          sessions_total: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          package_type_id?: string
          purchased_at?: string
          sessions_remaining?: number
          sessions_total?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_type_id_fkey"
            columns: ["package_type_id"]
            isOneToOne: false
            referencedRelation: "package_types"
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
        }
        Insert: {
          assigned_at?: string
          client_id: string
          id?: string
          note?: string | null
          plan_id: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          id?: string
          note?: string | null
          plan_id?: string
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
          completed_at: string | null
          created_at: string
          data: Json
          deleted_at: string | null
          derived_from_template_id: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          is_visible: boolean
          locked_at: string | null
          name: string
          objective: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          version: number
        }
        Insert: {
          client_id: string
          coach_id: string
          completed_at?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          derived_from_template_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_visible?: boolean
          locked_at?: string | null
          name: string
          objective?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          client_id?: string
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          derived_from_template_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_visible?: boolean
          locked_at?: string | null
          name?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
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
      client_state_logs: {
        Row: {
          actor_id: string | null
          actor_type: string
          cause: string
          client_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["client_status"] | null
          id: string
          to_status: Database["public"]["Enums"]["client_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          cause: string
          client_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["client_status"] | null
          id?: string
          to_status: Database["public"]["Enums"]["client_status"]
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          cause?: string
          client_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["client_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["client_status"]
        }
        Relationships: [
          {
            foreignKeyName: "client_state_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          active_plan_id: string | null
          archived_at: string | null
          birth_date: string | null
          coach_id: string
          created_at: string
          email: string | null
          first_name: string
          fiscal_code: string | null
          id: string
          last_access_at: string | null
          last_name: string
          notes: string | null
          phone: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          version: number
        }
        Insert: {
          active_plan_id?: string | null
          archived_at?: string | null
          birth_date?: string | null
          coach_id: string
          created_at?: string
          email?: string | null
          first_name: string
          fiscal_code?: string | null
          id?: string
          last_access_at?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          active_plan_id?: string | null
          archived_at?: string | null
          birth_date?: string | null
          coach_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          fiscal_code?: string | null
          id?: string
          last_access_at?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_active_plan"
            columns: ["active_plan_id"]
            isOneToOne: false
            referencedRelation: "client_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          role: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          role?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          role?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
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
          aligned_to_slot: boolean | null
          client_id: string
          coach_id: string
          color: string | null
          created_at: string
          end_at: string
          id: string
          is_all_day: boolean | null
          linked_day_id: string | null
          linked_plan_id: string | null
          location: string | null
          notes: string | null
          recurrence_rule: string | null
          reminder_offset_minutes: number | null
          session_status: string | null
          source: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          aligned_to_slot?: boolean | null
          client_id: string
          coach_id: string
          color?: string | null
          created_at?: string
          end_at: string
          id?: string
          is_all_day?: boolean | null
          linked_day_id?: string | null
          linked_plan_id?: string | null
          location?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          session_status?: string | null
          source?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          aligned_to_slot?: boolean | null
          client_id?: string
          coach_id?: string
          color?: string | null
          created_at?: string
          end_at?: string
          id?: string
          is_all_day?: boolean | null
          linked_day_id?: string | null
          linked_plan_id?: string | null
          location?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          session_status?: string | null
          source?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_actuals: {
        Row: {
          created_at: string
          day_id: string
          exercise_id: string
          group_id: string | null
          id: string
          load: string | null
          note: string | null
          reps: string
          rest: string | null
          rpe: number | null
          section_id: string
          session_id: string
          set_index: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          day_id: string
          exercise_id: string
          group_id?: string | null
          id?: string
          load?: string | null
          note?: string | null
          reps: string
          rest?: string | null
          rpe?: number | null
          section_id: string
          session_id: string
          set_index: number
          timestamp?: string
        }
        Update: {
          created_at?: string
          day_id?: string
          exercise_id?: string
          group_id?: string | null
          id?: string
          load?: string | null
          note?: string | null
          reps?: string
          rest?: string | null
          rpe?: number | null
          section_id?: string
          session_id?: string
          set_index?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_actuals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_types: {
        Row: {
          code: string
          created_at: string
          decimals: number | null
          id: string
          is_active: boolean | null
          max_value: number | null
          min_value: number | null
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          decimals?: number | null
          id?: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          decimals?: number | null
          id?: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          name?: string
          unit?: string | null
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
      out_of_office_blocks: {
        Row: {
          coach_id: string
          created_at: string
          end_at: string
          id: string
          is_recurring: boolean
          reason: string | null
          recurrence_rule: string | null
          start_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          end_at: string
          id?: string
          is_recurring?: boolean
          reason?: string | null
          recurrence_rule?: string | null
          start_at: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          end_at?: string
          id?: string
          is_recurring?: boolean
          reason?: string | null
          recurrence_rule?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "out_of_office_blocks_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      package: {
        Row: {
          client_id: string
          coach_id: string
          consumed_sessions: number
          created_at: string
          currency_code: string
          duration_months: number
          expires_at: string | null
          is_single_technical: boolean
          name: string
          notes_internal: string | null
          on_hold_sessions: number
          package_id: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["package_payment_status"]
          price_source: string
          price_total_cents: number | null
          total_sessions: number
          updated_at: string
          usage_status: Database["public"]["Enums"]["package_usage_status"]
        }
        Insert: {
          client_id: string
          coach_id: string
          consumed_sessions?: number
          created_at?: string
          currency_code?: string
          duration_months: number
          expires_at?: string | null
          is_single_technical?: boolean
          name: string
          notes_internal?: string | null
          on_hold_sessions?: number
          package_id?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["package_payment_status"]
          price_source?: string
          price_total_cents?: number | null
          total_sessions: number
          updated_at?: string
          usage_status?: Database["public"]["Enums"]["package_usage_status"]
        }
        Update: {
          client_id?: string
          coach_id?: string
          consumed_sessions?: number
          created_at?: string
          currency_code?: string
          duration_months?: number
          expires_at?: string | null
          is_single_technical?: boolean
          name?: string
          notes_internal?: string | null
          on_hold_sessions?: number
          package_id?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["package_payment_status"]
          price_source?: string
          price_total_cents?: number | null
          total_sessions?: number
          updated_at?: string
          usage_status?: Database["public"]["Enums"]["package_usage_status"]
        }
        Relationships: [
          {
            foreignKeyName: "package_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      package_consumptions: {
        Row: {
          client_package_id: string
          consumed_at: string
          created_at: string
          id: string
          reason: string | null
          session_id: string | null
          units: number
        }
        Insert: {
          client_package_id: string
          consumed_at?: string
          created_at?: string
          id?: string
          reason?: string | null
          session_id?: string | null
          units?: number
        }
        Update: {
          client_package_id?: string
          consumed_at?: string
          created_at?: string
          id?: string
          reason?: string | null
          session_id?: string | null
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_consumptions_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_consumptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      package_ledger: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          created_by: string | null
          delta_consumed: number
          delta_hold: number
          ledger_id: string
          note: string | null
          package_id: string
          reason: Database["public"]["Enums"]["ledger_reason"]
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          created_by?: string | null
          delta_consumed?: number
          delta_hold?: number
          ledger_id?: string
          note?: string | null
          package_id: string
          reason: Database["public"]["Enums"]["ledger_reason"]
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          created_by?: string | null
          delta_consumed?: number
          delta_hold?: number
          ledger_id?: string
          note?: string | null
          package_id?: string
          reason?: Database["public"]["Enums"]["ledger_reason"]
          type?: Database["public"]["Enums"]["ledger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "package_ledger_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_ledger_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package"
            referencedColumns: ["package_id"]
          },
        ]
      }
      package_settings: {
        Row: {
          coach_id: string
          created_at: string
          currency_code: string
          lock_window_hours: number
          sessions_1_duration: number
          sessions_1_price: number
          sessions_10_duration: number
          sessions_10_price: number
          sessions_20_duration: number
          sessions_20_price: number
          sessions_5_duration: number
          sessions_5_price: number
          settings_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          currency_code?: string
          lock_window_hours?: number
          sessions_1_duration?: number
          sessions_1_price?: number
          sessions_10_duration?: number
          sessions_10_price?: number
          sessions_20_duration?: number
          sessions_20_price?: number
          sessions_5_duration?: number
          sessions_5_price?: number
          settings_id?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          currency_code?: string
          lock_window_hours?: number
          sessions_1_duration?: number
          sessions_1_price?: number
          sessions_10_duration?: number
          sessions_10_price?: number
          sessions_20_duration?: number
          sessions_20_price?: number
          sessions_5_duration?: number
          sessions_5_price?: number
          settings_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_settings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      package_types: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          total_sessions: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          total_sessions: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_types_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency_code: string
          kind: string
          note: string | null
          package_id: string
          payment_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          kind: string
          note?: string | null
          package_id: string
          payment_id?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          kind?: string
          note?: string | null
          package_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package"
            referencedColumns: ["package_id"]
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
      plan_state_logs: {
        Row: {
          actor_id: string | null
          actor_type: string
          cause: string
          client_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["plan_status"] | null
          id: string
          plan_id: string
          to_status: Database["public"]["Enums"]["plan_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          cause: string
          client_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["plan_status"] | null
          id?: string
          plan_id: string
          to_status: Database["public"]["Enums"]["plan_status"]
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          cause?: string
          client_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["plan_status"] | null
          id?: string
          plan_id?: string
          to_status?: Database["public"]["Enums"]["plan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_state_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_state_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "client_plans"
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      training_sessions: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          day_id: string | null
          ended_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          plan_id: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          day_id?: string | null
          ended_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          day_id?: string | null
          ended_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
        | "EVENT_CREATED"
        | "EVENT_RECURRING_CREATED"
        | "EVENT_UPDATED"
        | "EVENT_DELETED"
        | "PACKAGE_CREATED"
        | "PACKAGE_UPDATED"
        | "SESSION_STARTED"
        | "SESSION_COMPLETED"
      approval_mode: "AUTO" | "MANUAL"
      booking_request_status:
        | "PENDING"
        | "APPROVED"
        | "DECLINED"
        | "COUNTER_PROPOSED"
      client_status: "POTENZIALE" | "ATTIVO" | "INATTIVO" | "ARCHIVIATO"
      ledger_reason:
        | "CONFIRM"
        | "CANCEL_GT_24H"
        | "CANCEL_LT_24H"
        | "COMPLETE"
        | "ADMIN_CORRECTION"
        | "RECONCILE"
      ledger_type:
        | "HOLD_CREATE"
        | "HOLD_RELEASE"
        | "CONSUME"
        | "CORRECTION"
        | "PRICE_UPDATE"
      package_payment_status: "unpaid" | "partial" | "paid" | "refunded"
      package_usage_status: "active" | "completed" | "suspended" | "archived"
      plan_status: "IN_CORSO" | "COMPLETATO" | "ELIMINATO"
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
        "EVENT_CREATED",
        "EVENT_RECURRING_CREATED",
        "EVENT_UPDATED",
        "EVENT_DELETED",
        "PACKAGE_CREATED",
        "PACKAGE_UPDATED",
        "SESSION_STARTED",
        "SESSION_COMPLETED",
      ],
      approval_mode: ["AUTO", "MANUAL"],
      booking_request_status: [
        "PENDING",
        "APPROVED",
        "DECLINED",
        "COUNTER_PROPOSED",
      ],
      client_status: ["POTENZIALE", "ATTIVO", "INATTIVO", "ARCHIVIATO"],
      ledger_reason: [
        "CONFIRM",
        "CANCEL_GT_24H",
        "CANCEL_LT_24H",
        "COMPLETE",
        "ADMIN_CORRECTION",
        "RECONCILE",
      ],
      ledger_type: [
        "HOLD_CREATE",
        "HOLD_RELEASE",
        "CONSUME",
        "CORRECTION",
        "PRICE_UPDATE",
      ],
      package_payment_status: ["unpaid", "partial", "paid", "refunded"],
      package_usage_status: ["active", "completed", "suspended", "archived"],
      plan_status: ["IN_CORSO", "COMPLETATO", "ELIMINATO"],
      sex: ["M", "F", "ALTRO"],
    },
  },
} as const

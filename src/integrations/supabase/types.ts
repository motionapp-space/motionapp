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
      ai_actions_log: {
        Row: {
          action_payload: Json
          action_type: string
          coach_id: string
          conversation_id: string
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          message_id: string | null
          status: string
        }
        Insert: {
          action_payload: Json
          action_type: string
          coach_id: string
          conversation_id: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          message_id?: string | null
          status: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          coach_id?: string
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          coach_id: string
          context_page: string | null
          created_at: string
          id: string
          last_message_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          context_page?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          context_page?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          context_snapshot: Json | null
          conversation_id: string
          created_at: string
          id: string
          intent_payload: Json | null
          intent_type: string | null
          role: string
        }
        Insert: {
          content: string
          context_snapshot?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          intent_payload?: Json | null
          intent_type?: string | null
          role: string
        }
        Update: {
          content?: string
          context_snapshot?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          intent_payload?: Json | null
          intent_type?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          approved_at: string | null
          coach_client_id: string
          counter_proposal_end_at: string | null
          counter_proposal_start_at: string | null
          created_at: string
          economic_type: string
          event_id: string | null
          finalized_end_at: string | null
          finalized_start_at: string | null
          id: string
          notes: string | null
          requested_end_at: string
          requested_start_at: string
          selected_package_id: string | null
          status: Database["public"]["Enums"]["booking_request_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          coach_client_id: string
          counter_proposal_end_at?: string | null
          counter_proposal_start_at?: string | null
          created_at?: string
          economic_type?: string
          event_id?: string | null
          finalized_end_at?: string | null
          finalized_start_at?: string | null
          id?: string
          notes?: string | null
          requested_end_at: string
          requested_start_at: string
          selected_package_id?: string | null
          status?: Database["public"]["Enums"]["booking_request_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          coach_client_id?: string
          counter_proposal_end_at?: string | null
          counter_proposal_start_at?: string | null
          created_at?: string
          economic_type?: string
          event_id?: string | null
          finalized_end_at?: string | null
          finalized_start_at?: string | null
          id?: string
          notes?: string | null
          requested_end_at?: string
          requested_start_at?: string
          selected_package_id?: string | null
          status?: Database["public"]["Enums"]["booking_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
          },
          {
            foreignKeyName: "booking_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_requests_selected_package"
            columns: ["selected_package_id"]
            isOneToOne: false
            referencedRelation: "package"
            referencedColumns: ["package_id"]
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
      client_invites: {
        Row: {
          accepted_at: string | null
          client_id: string
          coach_id: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          coach_id: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          coach_id?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invites_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
          coach_client_id: string
          completed_at: string | null
          created_at: string
          data: Json
          deleted_at: string | null
          derived_from_template_id: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          in_use_at: string | null
          is_in_use: boolean
          is_visible: boolean
          last_used_at: string | null
          locked_at: string | null
          name: string
          objective: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          version: number
        }
        Insert: {
          coach_client_id: string
          completed_at?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          derived_from_template_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          in_use_at?: string | null
          is_in_use?: boolean
          is_visible?: boolean
          last_used_at?: string | null
          locked_at?: string | null
          name: string
          objective?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          coach_client_id?: string
          completed_at?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          derived_from_template_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          in_use_at?: string | null
          is_in_use?: boolean
          is_visible?: boolean
          last_used_at?: string | null
          locked_at?: string | null
          name?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_plans_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plans_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
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
          user_id: string | null
          version: number
        }
        Insert: {
          active_plan_id?: string | null
          archived_at?: string | null
          birth_date?: string | null
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
          user_id?: string | null
          version?: number
        }
        Update: {
          active_plan_id?: string | null
          archived_at?: string | null
          birth_date?: string | null
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
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          active_plan_id: string | null
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
          active_plan_id?: string | null
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
          active_plan_id?: string | null
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
            foreignKeyName: "coach_clients_active_plan_id_fkey"
            columns: ["active_plan_id"]
            isOneToOne: false
            referencedRelation: "client_plans"
            referencedColumns: ["id"]
          },
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
      coach_notifications: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notifications_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_settings: {
        Row: {
          coach_id: string
          created_at: string
          currency_code: string
          lock_window_hours: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          currency_code?: string
          lock_window_hours?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          currency_code?: string
          lock_window_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_settings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string
          id: string
          locale: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          aligned_to_slot: boolean | null
          client_request_id: string | null
          coach_client_id: string
          color: string | null
          created_at: string
          economic_type: string
          economic_warning: string | null
          end_at: string
          id: string
          is_all_day: boolean | null
          linked_day_id: string | null
          linked_plan_id: string | null
          location: string | null
          notes: string | null
          order_payment_id: string | null
          package_id: string | null
          proposal_status: string | null
          proposed_end_at: string | null
          proposed_start_at: string | null
          recurrence_rule: string | null
          reminder_offset_minutes: number | null
          series_id: string | null
          series_request_id: string | null
          session_status: string | null
          source: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          aligned_to_slot?: boolean | null
          client_request_id?: string | null
          coach_client_id: string
          color?: string | null
          created_at?: string
          economic_type?: string
          economic_warning?: string | null
          end_at: string
          id?: string
          is_all_day?: boolean | null
          linked_day_id?: string | null
          linked_plan_id?: string | null
          location?: string | null
          notes?: string | null
          order_payment_id?: string | null
          package_id?: string | null
          proposal_status?: string | null
          proposed_end_at?: string | null
          proposed_start_at?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          series_id?: string | null
          series_request_id?: string | null
          session_status?: string | null
          source?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          aligned_to_slot?: boolean | null
          client_request_id?: string | null
          coach_client_id?: string
          color?: string | null
          created_at?: string
          economic_type?: string
          economic_warning?: string | null
          end_at?: string
          id?: string
          is_all_day?: boolean | null
          linked_day_id?: string | null
          linked_plan_id?: string | null
          location?: string | null
          notes?: string | null
          order_payment_id?: string | null
          package_id?: string | null
          proposal_status?: string | null
          proposed_end_at?: string | null
          proposed_start_at?: string | null
          recurrence_rule?: string | null
          reminder_offset_minutes?: number | null
          series_id?: string | null
          series_request_id?: string | null
          session_status?: string | null
          source?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
          },
          {
            foreignKeyName: "fk_events_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package"
            referencedColumns: ["package_id"]
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
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          page: string
          section: string | null
          status: string
          type: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page: string
          section?: string | null
          status?: string
          type: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page?: string
          section?: string | null
          status?: string
          type?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      library_media: {
        Row: {
          coach_id: string
          created_at: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          filename: string
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_media_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
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
      orders: {
        Row: {
          amount_cents: number
          canceled_at: string | null
          coach_client_id: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          due_at: string | null
          event_id: string | null
          id: string
          kind: string
          note: string | null
          package_id: string | null
          paid_at: string | null
          product_id: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          canceled_at?: string | null
          coach_client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          kind: string
          note?: string | null
          package_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          canceled_at?: string | null
          coach_client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          kind?: string
          note?: string | null
          package_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_coach_client"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_coach_client"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
          },
          {
            foreignKeyName: "fk_order_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
      out_of_office_blocks: {
        Row: {
          coach_id: string
          created_at: string
          end_at: string
          id: string
          is_all_day: boolean
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
          is_all_day?: boolean
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
          is_all_day?: boolean
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
          coach_client_id: string
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
          partial_payment_cents: number | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["package_payment_status"]
          price_source: string
          price_total_cents: number | null
          total_sessions: number
          updated_at: string
          usage_status: Database["public"]["Enums"]["package_usage_status"]
        }
        Insert: {
          coach_client_id: string
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
          partial_payment_cents?: number | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["package_payment_status"]
          price_source?: string
          price_total_cents?: number | null
          total_sessions: number
          updated_at?: string
          usage_status?: Database["public"]["Enums"]["package_usage_status"]
        }
        Update: {
          coach_client_id?: string
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
          partial_payment_cents?: number | null
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
            foreignKeyName: "package_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
          },
        ]
      }
      package_ledger: {
        Row: {
          booking_request_id: string | null
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
          booking_request_id?: string | null
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
          booking_request_id?: string | null
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
            foreignKeyName: "package_ledger_booking_request_id_fkey"
            columns: ["booking_request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
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
          sessions_15_duration: number
          sessions_15_price: number
          sessions_20_duration: number
          sessions_20_price: number
          sessions_3_duration: number
          sessions_3_price: number
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
          sessions_15_duration?: number
          sessions_15_price?: number
          sessions_20_duration?: number
          sessions_20_price?: number
          sessions_3_duration?: number
          sessions_3_price?: number
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
          sessions_15_duration?: number
          sessions_15_price?: number
          sessions_20_duration?: number
          sessions_20_price?: number
          sessions_3_duration?: number
          sessions_3_price?: number
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
      products: {
        Row: {
          coach_id: string
          created_at: string
          credits_amount: number
          description: string | null
          duration_months: number
          id: string
          is_active: boolean
          is_visible: boolean
          name: string
          price_cents: number
          sort_order: number
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          credits_amount?: number
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name: string
          price_cents: number
          sort_order?: number
          type: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          credits_amount?: number
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          coach_client_id: string
          created_at: string
          day_id: string | null
          ended_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          plan_day_snapshot: Json | null
          plan_id: string | null
          scheduled_at: string | null
          source: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          coach_client_id: string
          created_at?: string
          day_id?: string | null
          ended_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          plan_day_snapshot?: Json | null
          plan_id?: string | null
          scheduled_at?: string | null
          source?: string
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          coach_client_id?: string
          created_at?: string
          day_id?: string | null
          ended_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          plan_day_snapshot?: Json | null
          plan_id?: string | null
          scheduled_at?: string | null
          source?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_coach_client_id_fkey"
            columns: ["coach_client_id"]
            isOneToOne: false
            referencedRelation: "v_coach_client_details"
            referencedColumns: ["coach_client_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_coach_client_details: {
        Row: {
          client_id: string | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          coach_client_id: string | null
          coach_id: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          relationship_status: string | null
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
    }
    Functions: {
      cancel_event_with_ledger: {
        Args: { p_actor: string; p_event_id: string; p_now?: string }
        Returns: Json
      }
      cancel_series_with_ledger: {
        Args: { p_actor: string; p_now?: string; p_series_id: string }
        Returns: Json
      }
      capture_session_snapshot: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      check_client_owns_coach_client: {
        Args: { p_coach_client_id: string }
        Returns: boolean
      }
      check_coach_owns_coach_client: {
        Args: { p_coach_client_id: string }
        Returns: boolean
      }
      compute_client_table_data_batch: {
        Args: { p_client_ids: string[] }
        Returns: {
          activity_status: string
          appointment_status: string
          client_id: string
          next_appointment_date: string
          package_status: string
          plan_weeks_since_assignment: number
        }[]
      }
      create_client_with_coach_link: {
        Args: {
          p_birth_date?: string
          p_email?: string
          p_first_name: string
          p_fiscal_code?: string
          p_last_name: string
          p_notes?: string
          p_phone?: string
          p_sex?: Database["public"]["Enums"]["sex"]
          p_with_invite?: boolean
        }
        Returns: string
      }
      create_event_with_economics: {
        Args: {
          p_amount_cents?: number
          p_client_request_id?: string
          p_coach_client_id: string
          p_economic_type: string
          p_end_at: string
          p_location?: string
          p_notes?: string
          p_package_id?: string
          p_series_id?: string
          p_start_at: string
          p_title: string
        }
        Returns: string
      }
      create_event_with_economics_internal: {
        Args: {
          p_amount_cents?: number
          p_client_request_id?: string
          p_coach_client_id: string
          p_economic_type: string
          p_end_at: string
          p_location?: string
          p_notes?: string
          p_package_id?: string
          p_series_id?: string
          p_series_request_id?: string
          p_source?: string
          p_start_at: string
          p_title: string
        }
        Returns: string
      }
      create_recurring_series_with_economics: {
        Args: {
          p_amount_cents?: number
          p_coach_client_id: string
          p_economic_type: string
          p_events: Json
          p_package_id?: string
          p_series_request_id?: string
        }
        Returns: Json
      }
      delete_plan: {
        Args: { p_coach_client_id: string; p_plan_id: string }
        Returns: boolean
      }
      expire_packages: { Args: { p_now?: string }; Returns: Json }
      finalize_booking_request: {
        Args: { p_request_id: string }
        Returns: string
      }
      finalize_past_events: { Args: { p_now?: string }; Returns: Json }
      get_coach_occupied_slots: {
        Args: { p_coach_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          end_at: string
          slot_type: string
          start_at: string
        }[]
      }
      get_my_client_id: { Args: never; Returns: string }
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      select_fefo_package_internal: {
        Args: {
          p_coach_client_id: string
          p_latest_end?: string
          p_required_sessions?: number
        }
        Returns: string
      }
      set_active_plan: {
        Args: { p_coach_client_id: string; p_plan_id?: string }
        Returns: string
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
      app_role: "coach" | "client" | "admin"
      approval_mode: "AUTO" | "MANUAL"
      booking_request_status:
        | "PENDING"
        | "APPROVED"
        | "DECLINED"
        | "COUNTER_PROPOSED"
        | "CANCELED_BY_CLIENT"
      client_status:
        | "INVITATO"
        | "POTENZIALE"
        | "ATTIVO"
        | "INATTIVO"
        | "ARCHIVIATO"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      ledger_reason:
        | "CONFIRM"
        | "CANCEL_GT_24H"
        | "CANCEL_LT_24H"
        | "COMPLETE"
        | "ADMIN_CORRECTION"
        | "RECONCILE"
        | "REQUEST_CREATE"
        | "REQUEST_CANCEL"
        | "BOOKING_CONFIRMED"
      ledger_type:
        | "HOLD_CREATE"
        | "HOLD_RELEASE"
        | "CONSUME"
        | "CORRECTION"
        | "PRICE_UPDATE"
      package_payment_status: "unpaid" | "partial" | "paid" | "refunded"
      package_usage_status: "active" | "completed" | "suspended" | "archived"
      plan_status: "IN_CORSO" | "COMPLETATO" | "ELIMINATO"
      product_type: "session_pack" | "single_session" | "subscription"
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
      app_role: ["coach", "client", "admin"],
      approval_mode: ["AUTO", "MANUAL"],
      booking_request_status: [
        "PENDING",
        "APPROVED",
        "DECLINED",
        "COUNTER_PROPOSED",
        "CANCELED_BY_CLIENT",
      ],
      client_status: [
        "INVITATO",
        "POTENZIALE",
        "ATTIVO",
        "INATTIVO",
        "ARCHIVIATO",
      ],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      ledger_reason: [
        "CONFIRM",
        "CANCEL_GT_24H",
        "CANCEL_LT_24H",
        "COMPLETE",
        "ADMIN_CORRECTION",
        "RECONCILE",
        "REQUEST_CREATE",
        "REQUEST_CANCEL",
        "BOOKING_CONFIRMED",
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
      product_type: ["session_pack", "single_session", "subscription"],
      sex: ["M", "F", "ALTRO"],
    },
  },
} as const

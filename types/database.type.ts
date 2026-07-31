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
      attendances: {
        Row: {
          ai: number | null
          created_at: string
          date: string | null
          id: number
          name: string | null
          register: number | null
          user_id: string | null
        }
        Insert: {
          ai?: number | null
          created_at?: string
          date?: string | null
          id?: number
          name?: string | null
          register?: number | null
          user_id?: string | null
        }
        Update: {
          ai?: number | null
          created_at?: string
          date?: string | null
          id?: number
          name?: string | null
          register?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compensatorys: {
        Row: {
          approve_request: boolean | null
          approved_by: string | null
          approved_by_compensated: string | null
          approved_date: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          compensated_hours: number | null
          compensated_hours_day: string | null
          created_at: string
          event_date: string | null
          event_name: string | null
          final_approve_request: boolean | null
          hours: number | null
          id: string
          t_time_finish: string | null
          t_time_start: string | null
          user_id: string | null
        }
        Insert: {
          approve_request?: boolean | null
          approved_by?: string | null
          approved_by_compensated?: string | null
          approved_date?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          compensated_hours?: number | null
          compensated_hours_day?: string | null
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          final_approve_request?: boolean | null
          hours?: number | null
          id?: string
          t_time_finish?: string | null
          t_time_start?: string | null
          user_id?: string | null
        }
        Update: {
          approve_request?: boolean | null
          approved_by?: string | null
          approved_by_compensated?: string | null
          approved_date?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          compensated_hours?: number | null
          compensated_hours_day?: string | null
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          final_approve_request?: boolean | null
          hours?: number | null
          id?: string
          t_time_finish?: string | null
          t_time_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compensatorys_approved_by_compensated_fkey"
            columns: ["approved_by_compensated"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatorys_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatorys_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatorys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_email_outbox: {
        Row: {
          created_at: string
          delivery_mode: string
          from_email: string
          html_body: string
          id: string
          payload_json: Json | null
          subject: string
          template_name: string
          text_body: string | null
          to_emails: string[]
          triggered_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_mode: string
          from_email: string
          html_body: string
          id?: string
          payload_json?: Json | null
          subject: string
          template_name: string
          text_body?: string | null
          to_emails?: string[]
          triggered_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_mode?: string
          from_email?: string
          html_body?: string
          id?: string
          payload_json?: Json | null
          subject?: string
          template_name?: string
          text_body?: string | null
          to_emails?: string[]
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_email_outbox_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_used_at: string | null
          remember_token: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          remember_token?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          remember_token?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_type: string | null
          blocked_until: string | null
          created_at: string | null
          email: string | null
          id: string
          identifier: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_type?: string | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          admin: string | null
          attendance_eligible: boolean | null
          created_at: string
          email: string
          grant_mode: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_diplomatic: boolean
          manual_next_grant_date: string | null
          name: string | null
          num_compensatorys: number | null
          num_vacations: number | null
          position: string | null
          role: string | null
          weekly_days: number | null
          weekly_hours: number | null
        }
        Insert: {
          admin?: string | null
          attendance_eligible?: boolean | null
          created_at?: string
          email: string
          grant_mode?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          is_diplomatic?: boolean
          manual_next_grant_date?: string | null
          name?: string | null
          num_compensatorys?: number | null
          num_vacations?: number | null
          position?: string | null
          role?: string | null
          weekly_days?: number | null
          weekly_hours?: number | null
        }
        Update: {
          admin?: string | null
          attendance_eligible?: boolean | null
          created_at?: string
          email?: string
          grant_mode?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_diplomatic?: boolean
          manual_next_grant_date?: string | null
          name?: string | null
          num_compensatorys?: number | null
          num_vacations?: number | null
          position?: string | null
          role?: string | null
          weekly_days?: number | null
          weekly_hours?: number | null
        }
        Relationships: []
      }
      vacation_grant_consumptions: {
        Row: {
          consumed_at: string
          created_at: string
          days_used: number
          grant_id: string
          id: string
          user_id: string
          vacation_id: string
        }
        Insert: {
          consumed_at?: string
          created_at?: string
          days_used: number
          grant_id: string
          id?: string
          user_id: string
          vacation_id: string
        }
        Update: {
          consumed_at?: string
          created_at?: string
          days_used?: number
          grant_id?: string
          id?: string
          user_id?: string
          vacation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_grant_consumptions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "vacation_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_grant_consumptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_grant_consumptions_vacation_id_fkey"
            columns: ["vacation_id"]
            isOneToOne: false
            referencedRelation: "vacations"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_grants: {
        Row: {
          created_at: string
          days_granted: number
          days_remaining: number
          expires_on: string
          granted_on: string
          id: string
          notes: string | null
          rule_type: string
          service_band: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_granted: number
          days_remaining: number
          expires_on: string
          granted_on: string
          id?: string
          notes?: string | null
          rule_type: string
          service_band: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_granted?: number
          days_remaining?: number
          expires_on?: string
          granted_on?: string
          id?: string
          notes?: string | null
          rule_type?: string
          service_band?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vacations: {
        Row: {
          approve_request: boolean | null
          approved_date: string | null
          approvedby: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          days: number | null
          finish: string | null
          id: string
          id_user: string | null
          period: number | null
          request_date: string | null
          start: string | null
        }
        Insert: {
          approve_request?: boolean | null
          approved_date?: string | null
          approvedby?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          days?: number | null
          finish?: string | null
          id?: string
          id_user?: string | null
          period?: number | null
          request_date?: string | null
          start?: string | null
        }
        Update: {
          approve_request?: boolean | null
          approved_date?: string | null
          approvedby?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          days?: number | null
          finish?: string | null
          id?: string
          id_user?: string | null
          period?: number | null
          request_date?: string | null
          start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_approvedby_fkey"
            columns: ["approvedby"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accumulate_compensatory_hours: {
        Args: { hours: number; user_id: string }
        Returns: undefined
      }
      approve_vacation_with_grants: {
        Args: {
          p_allow_legacy_fallback?: boolean
          p_approved_at: string
          p_approved_by: string
          p_days: number
          p_legacy_balance: number
          p_user_id: string
          p_vacation_id: string
        }
        Returns: {
          remaining_balance: number
          used_grant_balance: boolean
        }[]
      }
      cancel_own_compensatorio: { Args: { p_id: string }; Returns: undefined }
      cancel_own_vacation: {
        Args: { p_vacation_id: string }
        Returns: undefined
      }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      compare_first_5_letters: {
        Args: never
        Returns: {
          attendance_name: string
          comparison_result: boolean
          user_name: string
        }[]
      }
      count_failed_attempts: {
        Args: { p_identifier: string; p_window_minutes?: number }
        Returns: number
      }
      count_unapproved_records: {
        Args: never
        Returns: {
          final_approve_request_count: number
          unapproved_count: number
        }[]
      }
      get_compensatorys_for_user: {
        Args: { user_id: string }
        Returns: {
          approve_request: boolean
          approved_by: string
          approved_by_compensated: string
          approved_date: string
          compensated_hours: number
          compensated_hours_day: string
          compensatory_id: string
          event_date: string
          event_name: string
          final_approve_request: boolean
          hours: number
          t_time_finish: string
          t_time_start: string
          user_name: string
        }[]
      }
      insert_compensatory_rest: {
        Args: {
          p_compensated_hours: number
          p_compensated_hours_day: string
          p_t_time_finish: string
          p_t_time_start: string
          p_user_id: string
        }
        Returns: undefined
      }
      insertar_vacaciones: {
        Args: {
          p_days: number
          p_finish: string
          p_id_user: string
          p_start: string
        }
        Returns: {
          users_admin: string
          users_created_at: string
          users_email: string
          users_id: string
          users_name: string
          users_num_compensatorys: number
          users_num_vacations: number
          users_role: string
          vacations_approve_request: boolean
          vacations_approved_date: string
          vacations_approvedby: string
          vacations_created_at: string
          vacations_days: number
          vacations_finish: string
          vacations_id: string
          vacations_id_user: string
          vacations_period: number
          vacations_request_date: string
          vacations_start: string
        }[]
      }
      is_ip_blocked: { Args: { p_identifier: string }; Returns: boolean }
      list_hours_unapproved_compensatorys: {
        Args: never
        Returns: {
          approve_request: boolean
          approved_by: string
          approved_by_compensated: string
          approved_date: string
          compensated_hours: number
          compensated_hours_day: string
          created_at: string
          email: string
          event_date: string
          event_name: string
          final_approve_request: boolean
          hours: number
          id: string
          num_compensatorys: number
          t_time_finish: string
          t_time_start: string
          user_id: string
          user_name: string
        }[]
      }
      list_unapproved_compensatorys: {
        Args: never
        Returns: {
          approve_request: boolean
          approved_by: string
          approved_by_compensated: string
          approved_date: string
          compensated_hours: number
          compensated_hours_day: string
          created_at: string
          email: string
          event_date: string
          event_name: string
          final_approve_request: boolean
          hours: number
          id: string
          num_compensatorys: number
          t_time_finish: string
          t_time_start: string
          user_id: string
          user_name: string
        }[]
      }
      list_unapproved_vacations: {
        Args: never
        Returns: {
          approve_request: boolean
          created_at: string
          days: number
          email: string
          finish: string
          id: string
          num_vacations: number
          request_date: string
          start: string
          user_id: string
          user_name: string
        }[]
      }
      listar_horas_entrada_salida: {
        Args: never
        Returns: {
          compensated_hours_day: string
          fecha: string
          hora_entrada: string
          hora_salida: string
          id: string
          name: string
          t_time_finish: string
          t_time_start: string
        }[]
      }
      listar_vacaciones_compensatorios_no_aprobados_por_usuario: {
        Args: never
        Returns: {
          cantidad_horas_compensatorios_no_aprobados: number
          cantidad_registros_no_aprobados: number
          cantidad_vacaciones_no_aprobadas: number
          user_email: string
          user_name: string
        }[]
      }
      restore_backup: { Args: { p_data: Json }; Returns: Json }
      subtract_compensatory_hours: {
        Args: { hours: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals["public"]

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

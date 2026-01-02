Connecting to localhost 54322
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          ai: string | null
          created_at: string | null
          date: string | null
          id: string | null
          name: string | null
          register: string | null
          user_id: string | null
        }
        Insert: {
          ai?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          name?: string | null
          register?: string | null
          user_id?: string | null
        }
        Update: {
          ai?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          name?: string | null
          register?: string | null
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
          approve_request: string | null
          approved_by: string | null
          approved_by_compensated: string | null
          approved_date: string | null
          compensated_hours: string | null
          compensated_hours_day: string | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          final_approve_request: string | null
          hours: string | null
          id: string | null
          t_time_finish: string | null
          t_time_start: string | null
          user_id: string | null
        }
        Insert: {
          approve_request?: string | null
          approved_by?: string | null
          approved_by_compensated?: string | null
          approved_date?: string | null
          compensated_hours?: string | null
          compensated_hours_day?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          final_approve_request?: string | null
          hours?: string | null
          id?: string | null
          t_time_finish?: string | null
          t_time_start?: string | null
          user_id?: string | null
        }
        Update: {
          approve_request?: string | null
          approved_by?: string | null
          approved_by_compensated?: string | null
          approved_date?: string | null
          compensated_hours?: string | null
          compensated_hours_day?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          final_approve_request?: string | null
          hours?: string | null
          id?: string | null
          t_time_finish?: string | null
          t_time_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compensatorys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: string | null
          name: string | null
          num_compensatorys: string | null
          num_vacations: string | null
          role: string | null
        }
        Insert: {
          admin?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_active?: string | null
          name?: string | null
          num_compensatorys?: string | null
          num_vacations?: string | null
          role?: string | null
        }
        Update: {
          admin?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: string | null
          name?: string | null
          num_compensatorys?: string | null
          num_vacations?: string | null
          role?: string | null
        }
        Relationships: []
      }
      vacations: {
        Row: {
          approve_request: string | null
          approved_date: string | null
          approvedby: string | null
          created_at: string | null
          days: string | null
          finish: string | null
          id: string | null
          period: string | null
          request_date: string | null
          start: string | null
          user_id: string | null
        }
        Insert: {
          approve_request?: string | null
          approved_date?: string | null
          approvedby?: string | null
          created_at?: string | null
          days?: string | null
          finish?: string | null
          id?: string | null
          period?: string | null
          request_date?: string | null
          start?: string | null
          user_id?: string | null
        }
        Update: {
          approve_request?: string | null
          approved_date?: string | null
          approvedby?: string | null
          created_at?: string | null
          days?: string | null
          finish?: string | null
          id?: string | null
          period?: string | null
          request_date?: string | null
          start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_user_id_fkey"
            columns: ["user_id"]
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
      count_unapproved_records: {
        Args: Record<PropertyKey, never>
        Returns: {
          final_approve_request_count: number
          unapproved_count: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.67.1 (currently installed v2.34.3)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      compensatorys: {
        Row: {
          approve_request: boolean | null
          approved_by: string | null
          approved_by_compensated: string | null
          approved_date: string | null
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatorys_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatorys_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          admin: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          num_compensatorys: number | null
          num_vacations: number | null
          role: string | null
        }
        Insert: {
          admin?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          num_compensatorys?: number | null
          num_vacations?: number | null
          role?: string | null
        }
        Update: {
          admin?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          num_compensatorys?: number | null
          num_vacations?: number | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vacations: {
        Row: {
          approved_date: string | null
          approvedby: string | null
          created_at: string
          days: number | null
          finish: string | null
          id: number
          id_user: string | null
          period: number | null
          request_date: string | null
          start: string | null
        }
        Insert: {
          approved_date?: string | null
          approvedby?: string | null
          created_at?: string
          days?: number | null
          finish?: string | null
          id?: number
          id_user?: string | null
          period?: number | null
          request_date?: string | null
          start?: string | null
        }
        Update: {
          approved_date?: string | null
          approvedby?: string | null
          created_at?: string
          days?: number | null
          finish?: string | null
          id?: number
          id_user?: string | null
          period?: number | null
          request_date?: string | null
          start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_approvedby_fkey"
            columns: ["approvedby"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_id_user_fkey"
            columns: ["id_user"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
          unapproved_count: number
          final_approve_request_count: number
        }[]
      }
      list_hours_unapproved_compensatorys: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          user_id: string
          event_date: string
          event_name: string
          hours: number
          approve_request: boolean
          approved_by: string
          approved_date: string
          compensated_hours: number
          approved_by_compensated: string
          compensated_hours_day: string
          final_approve_request: boolean
          t_time_start: string
          t_time_finish: string
          user_name: string
          num_compensatorys: number
          email: string
        }[]
      }
      list_unapproved_compensatorys: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          user_id: string
          event_date: string
          event_name: string
          hours: number
          approve_request: boolean
          approved_by: string
          approved_date: string
          compensated_hours: number
          approved_by_compensated: string
          compensated_hours_day: string
          final_approve_request: boolean
          t_time_start: string
          t_time_finish: string
          user_name: string
          num_compensatorys: number
          email: string
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

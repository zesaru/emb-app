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
          approved_date: string | null
          created_at: string
          event_date: string | null
          event_name: string | null
          hours: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          approve_request?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          hours?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          approve_request?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          hours?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
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
          created_at: string
          email: string
          id: string
          name: string | null
          num_compensatorys: number | null
          num_vacations: number | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          num_compensatorys?: number | null
          num_vacations?: number | null
          role?: string | null
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

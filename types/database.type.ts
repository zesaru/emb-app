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

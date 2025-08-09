import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          travel_preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          travel_preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          travel_preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          budget_range: string
          travel_style: string
          status: string
          cover_image: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          budget_range?: string
          travel_style?: string
          status?: string
          cover_image?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          budget_range?: string
          travel_style?: string
          status?: string
          cover_image?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      destinations: {
        Row: {
          id: string
          trip_id: string
          name: string
          city: string | null
          country: string | null
          arrival_date: string
          departure_date: string
          order_index: number
          coordinates: any | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          city?: string | null
          country?: string | null
          arrival_date: string
          departure_date: string
          order_index?: number
          coordinates?: any | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          city?: string | null
          country?: string | null
          arrival_date?: string
          departure_date?: string
          order_index?: number
          coordinates?: any | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          destination_id: string
          title: string
          description: string | null
          activity_date: string
          start_time: string | null
          end_time: string | null
          location: string | null
          activity_type: string
          price_estimate: number | null
          booking_status: string
          order_index: number
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          destination_id: string
          title: string
          description?: string | null
          activity_date: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          activity_type?: string
          price_estimate?: number | null
          booking_status?: string
          order_index?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          destination_id?: string
          title?: string
          description?: string | null
          activity_date?: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          activity_type?: string
          price_estimate?: number | null
          booking_status?: string
          order_index?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
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
      profiles: {
        Row: {
          id: string
          email: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          location: string | null
          price: number | null
          max_places: number | null
          available_places: number | null
          images: string[] | null
          is_visible: boolean | null
          created_by: string | null
          created_at: string | null
          age_range: string | null
          category: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          price?: number | null
          max_places?: number | null
          available_places?: number | null
          images?: string[] | null
          is_visible?: boolean | null
          created_by?: string | null
          created_at?: string | null
          age_range?: string | null
          category?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          price?: number | null
          max_places?: number | null
          available_places?: number | null
          images?: string[] | null
          is_visible?: boolean | null
          created_by?: string | null
          created_at?: string | null
          age_range?: string | null
          category?: string | null
        }
      }
      reservations: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          number_of_places: number | null
          total_price: number | null
          status: string | null
          qr_code: string | null
          created_at: string | null
          user_name: string | null
          user_email: string | null
          user_phone: string | null
          buyer_name: string | null
          buyer_email: string | null
          buyer_phone: string | null
          payment_method: string | null
          payment_status: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          number_of_places?: number | null
          total_price?: number | null
          status?: string | null
          qr_code?: string | null
          created_at?: string | null
          user_name?: string | null
          user_email?: string | null
          user_phone?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          number_of_places?: number | null
          total_price?: number | null
          status?: string | null
          qr_code?: string | null
          created_at?: string | null
          user_name?: string | null
          user_email?: string | null
          user_phone?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          updated_at?: string | null
        }
      }
      tickets: {
        Row: {
          id: string
          reservation_id: string
          participant_name: string
          ticket_number: number
          qr_code_data: string
          qr_code_image: string | null
          status: string
          validated_at: string | null
          validated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          participant_name: string
          ticket_number: number
          qr_code_data: string
          qr_code_image?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          participant_name?: string
          ticket_number?: number
          qr_code_data?: string
          qr_code_image?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
          created_at?: string
        }
      }
      qr_code_validations: {
        Row: {
          id: string
          ticket_id: string | null
          action: string
          validated_by: string
          validated_at: string
          success: boolean
          verification_email: string | null
          verification_phone: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          action: string
          validated_by: string
          validated_at?: string
          success: boolean
          verification_email?: string | null
          verification_phone?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string | null
          action?: string
          validated_by?: string
          validated_at?: string
          success?: boolean
          verification_email?: string | null
          verification_phone?: string | null
          notes?: string | null
        }
      }
      party_builder_categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon: string
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
      }
      party_builder_options: {
        Row: {
          id: string
          category: string | null
          name: string
          description: string | null
          price: number | null
          max_quantity: number | null
          is_active: boolean | null
          image_url: string | null
        }
        Insert: {
          id?: string
          category?: string | null
          name: string
          description?: string | null
          price?: number | null
          max_quantity?: number | null
          is_active?: boolean | null
          image_url?: string | null
        }
        Update: {
          id?: string
          category?: string | null
          name?: string
          description?: string | null
          price?: number | null
          max_quantity?: number | null
          is_active?: boolean | null
          image_url?: string | null
        }
      }
      party_builder_orders: {
        Row: {
          id: string
          user_id: string | null
          selected_options: Json | null
          total_price: number | null
          event_date: string | null
          status: string | null
          created_at: string | null
          child_name: string | null
          child_age: number | null
          location: string | null
          guest_count: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          selected_options?: Json | null
          total_price?: number | null
          event_date?: string | null
          status?: string | null
          created_at?: string | null
          child_name?: string | null
          child_age?: number | null
          location?: string | null
          guest_count?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          selected_options?: Json | null
          total_price?: number | null
          event_date?: string | null
          status?: string | null
          created_at?: string | null
          child_name?: string | null
          child_age?: number | null
          location?: string | null
          guest_count?: number | null
        }
      }
      reviews: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          rating: number | null
          comment: string | null
          created_at: string | null
          user_name: string | null
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string | null
          user_name?: string | null
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string | null
          user_name?: string | null
        }
      }
      animators: {
        Row: {
          id: string
          name: string
          specialty: string | null
          availability: Json | null
          photo_url: string | null
          email: string | null
          phone: string | null
        }
        Insert: {
          id?: string
          name: string
          specialty?: string | null
          availability?: Json | null
          photo_url?: string | null
          email?: string | null
          phone?: string | null
        }
        Update: {
          id?: string
          name?: string
          specialty?: string | null
          availability?: Json | null
          photo_url?: string | null
          email?: string | null
          phone?: string | null
        }
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
  }
}

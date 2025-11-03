export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'manager' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'admin' | 'manager' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'manager' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          customer_id: string
          channel: 'sms' | 'whatsapp' | 'messenger'
          status: 'auto' | 'manual' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          channel: 'sms' | 'whatsapp' | 'messenger'
          status?: 'auto' | 'manual' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          channel?: 'sms' | 'whatsapp' | 'messenger'
          status?: 'auto' | 'manual' | 'paused'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender: 'customer' | 'ai' | 'staff'
          text: string
          ai_provider: string | null
          ai_model: string | null
          ai_confidence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender: 'customer' | 'ai' | 'staff'
          text: string
          ai_provider?: string | null
          ai_model?: string | null
          ai_confidence?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender?: 'customer' | 'ai' | 'staff'
          text?: string
          ai_provider?: string | null
          ai_model?: string | null
          ai_confidence?: number | null
          created_at?: string
        }
      }
      prices: {
        Row: {
          id: string
          device: string
          repair_type: string
          cost: number
          turnaround: string
          expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device: string
          repair_type: string
          cost: number
          turnaround: string
          expiry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device?: string
          repair_type?: string
          cost?: number
          turnaround?: string
          expiry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          created_at?: string
          updated_at?: string
        }
      }
      docs: {
        Row: {
          id: string
          title: string
          content: string
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          version?: number
          created_at?: string
        }
      }
      ai_settings: {
        Row: {
          id: string
          provider: string
          api_key: string
          model_name: string
          temperature: number
          max_tokens: number
          system_prompt: string
          confidence_threshold: number
          fallback_message: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          api_key: string
          model_name: string
          temperature?: number
          max_tokens?: number
          system_prompt: string
          confidence_threshold?: number
          fallback_message?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          api_key?: string
          model_name?: string
          temperature?: number
          max_tokens?: number
          system_prompt?: string
          confidence_threshold?: number
          fallback_message?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          conversation_id: string
          type: string
          notified_to: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          type: string
          notified_to: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          type?: string
          notified_to?: string
          created_at?: string
        }
      }
      staff_notes: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          note?: string
          created_at?: string
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

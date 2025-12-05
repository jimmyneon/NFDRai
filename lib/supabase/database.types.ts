export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "admin" | "manager" | "employee";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: "admin" | "manager" | "employee";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: "admin" | "manager" | "employee";
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          customer_id: string;
          channel: "sms" | "whatsapp" | "messenger" | "webchat";
          status: "auto" | "manual" | "paused";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          channel: "sms" | "whatsapp" | "messenger" | "webchat";
          status?: "auto" | "manual" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          channel?: "sms" | "whatsapp" | "messenger" | "webchat";
          status?: "auto" | "manual" | "paused";
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: "customer" | "ai" | "staff";
          text: string;
          ai_provider: string | null;
          ai_model: string | null;
          ai_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender: "customer" | "ai" | "staff";
          text: string;
          ai_provider?: string | null;
          ai_model?: string | null;
          ai_confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender?: "customer" | "ai" | "staff";
          text?: string;
          ai_provider?: string | null;
          ai_model?: string | null;
          ai_confidence?: number | null;
          created_at?: string;
        };
      };
      prices: {
        Row: {
          id: string;
          device: string;
          repair_type: string;
          cost: number;
          turnaround: string;
          expiry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device: string;
          repair_type: string;
          cost: number;
          turnaround: string;
          expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device?: string;
          repair_type?: string;
          cost?: number;
          turnaround?: string;
          expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      docs: {
        Row: {
          id: string;
          title: string;
          content: string;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          version?: number;
          created_at?: string;
        };
      };
      ai_settings: {
        Row: {
          id: string;
          provider: string;
          api_key: string;
          model_name: string;
          temperature: number;
          max_tokens: number;
          system_prompt: string;
          confidence_threshold: number;
          fallback_message: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          api_key: string;
          model_name: string;
          temperature?: number;
          max_tokens?: number;
          system_prompt: string;
          confidence_threshold?: number;
          fallback_message?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          api_key?: string;
          model_name?: string;
          temperature?: number;
          max_tokens?: number;
          system_prompt?: string;
          confidence_threshold?: number;
          fallback_message?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          conversation_id: string;
          type: string;
          notified_to: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          type: string;
          notified_to: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          type?: string;
          notified_to?: string;
          created_at?: string;
        };
      };
      staff_notes: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          note?: string;
          created_at?: string;
        };
      };
      business_info: {
        Row: {
          id: string;
          business_name: string;
          google_maps_url: string | null;
          timezone: string;
          monday_open: string | null;
          monday_close: string | null;
          tuesday_open: string | null;
          tuesday_close: string | null;
          wednesday_open: string | null;
          wednesday_close: string | null;
          thursday_open: string | null;
          thursday_close: string | null;
          friday_open: string | null;
          friday_close: string | null;
          saturday_open: string | null;
          saturday_close: string | null;
          sunday_open: string | null;
          sunday_close: string | null;
          special_hours_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name?: string;
          google_maps_url?: string | null;
          timezone?: string;
          monday_open?: string | null;
          monday_close?: string | null;
          tuesday_open?: string | null;
          tuesday_close?: string | null;
          wednesday_open?: string | null;
          wednesday_close?: string | null;
          thursday_open?: string | null;
          thursday_close?: string | null;
          friday_open?: string | null;
          friday_close?: string | null;
          saturday_open?: string | null;
          saturday_close?: string | null;
          sunday_open?: string | null;
          sunday_close?: string | null;
          special_hours_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          google_maps_url?: string | null;
          timezone?: string;
          monday_open?: string | null;
          monday_close?: string | null;
          tuesday_open?: string | null;
          tuesday_close?: string | null;
          wednesday_open?: string | null;
          wednesday_close?: string | null;
          thursday_open?: string | null;
          thursday_close?: string | null;
          friday_open?: string | null;
          friday_close?: string | null;
          saturday_open?: string | null;
          saturday_close?: string | null;
          sunday_open?: string | null;
          sunday_close?: string | null;
          special_hours_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      web_sessions: {
        Row: {
          id: string;
          session_token: string;
          customer_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          page_url: string | null;
          metadata: Record<string, unknown>;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_token: string;
          customer_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          page_url?: string | null;
          metadata?: Record<string, unknown>;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_token?: string;
          customer_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          page_url?: string | null;
          metadata?: Record<string, unknown>;
          last_activity_at?: string;
          created_at?: string;
        };
      };
      webchat_settings: {
        Row: {
          id: string;
          widget_title: string;
          welcome_message: string;
          placeholder_text: string;
          primary_color: string;
          position: string;
          show_branding: boolean;
          collect_email: boolean;
          collect_name: boolean;
          auto_open_delay_seconds: number;
          offline_message: string;
          allowed_domains: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          widget_title?: string;
          welcome_message?: string;
          placeholder_text?: string;
          primary_color?: string;
          position?: string;
          show_branding?: boolean;
          collect_email?: boolean;
          collect_name?: boolean;
          auto_open_delay_seconds?: number;
          offline_message?: string;
          allowed_domains?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          widget_title?: string;
          welcome_message?: string;
          placeholder_text?: string;
          primary_color?: string;
          position?: string;
          show_branding?: boolean;
          collect_email?: boolean;
          collect_name?: boolean;
          auto_open_delay_seconds?: number;
          offline_message?: string;
          allowed_domains?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions: string[];
          rate_limit_per_minute: number;
          last_used_at: string | null;
          expires_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions?: string[];
          rate_limit_per_minute?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          permissions?: string[];
          rate_limit_per_minute?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

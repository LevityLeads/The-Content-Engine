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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          voice_config: Json;
          visual_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          voice_config?: Json;
          visual_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          voice_config?: Json;
          visual_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_accounts: {
        Row: {
          id: string;
          brand_id: string;
          platform: string;
          platform_user_id: string;
          platform_username: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          late_account_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          platform: string;
          platform_user_id: string;
          platform_username?: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          late_account_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          platform?: string;
          platform_user_id?: string;
          platform_username?: string | null;
          access_token_encrypted?: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          late_account_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      inputs: {
        Row: {
          id: string;
          brand_id: string;
          user_id: string;
          type: "text" | "article" | "link" | "document";
          raw_content: string | null;
          file_url: string | null;
          parsed_content: Json | null;
          summary: string | null;
          key_themes: string[] | null;
          status: "pending" | "parsed" | "ideated" | "archived";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          user_id: string;
          type: "text" | "article" | "link" | "document";
          raw_content?: string | null;
          file_url?: string | null;
          parsed_content?: Json | null;
          summary?: string | null;
          key_themes?: string[] | null;
          status?: "pending" | "parsed" | "ideated" | "archived";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          user_id?: string;
          type?: "text" | "article" | "link" | "document";
          raw_content?: string | null;
          file_url?: string | null;
          parsed_content?: Json | null;
          summary?: string | null;
          key_themes?: string[] | null;
          status?: "pending" | "parsed" | "ideated" | "archived";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideas: {
        Row: {
          id: string;
          input_id: string;
          brand_id: string;
          concept: string;
          angle: string;
          target_platforms: string[];
          suggested_formats: string[] | null;
          key_points: string[] | null;
          potential_hooks: string[] | null;
          confidence_score: number | null;
          ai_reasoning: string | null;
          status: "pending" | "approved" | "rejected" | "generated";
          user_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          input_id: string;
          brand_id: string;
          concept: string;
          angle: string;
          target_platforms: string[];
          suggested_formats?: string[] | null;
          key_points?: string[] | null;
          potential_hooks?: string[] | null;
          confidence_score?: number | null;
          ai_reasoning?: string | null;
          status?: "pending" | "approved" | "rejected" | "generated";
          user_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          input_id?: string;
          brand_id?: string;
          concept?: string;
          angle?: string;
          target_platforms?: string[];
          suggested_formats?: string[] | null;
          key_points?: string[] | null;
          potential_hooks?: string[] | null;
          confidence_score?: number | null;
          ai_reasoning?: string | null;
          status?: "pending" | "approved" | "rejected" | "generated";
          user_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          idea_id: string;
          brand_id: string;
          platform: string;
          copy_primary: string;
          copy_hashtags: string[] | null;
          copy_cta: string | null;
          copy_thread_parts: string[] | null;
          copy_carousel_slides: string[] | null;
          status: "draft" | "approved" | "scheduled" | "published" | "failed";
          scheduled_for: string | null;
          published_at: string | null;
          late_post_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          brand_id: string;
          platform: string;
          copy_primary: string;
          copy_hashtags?: string[] | null;
          copy_cta?: string | null;
          copy_thread_parts?: string[] | null;
          copy_carousel_slides?: string[] | null;
          status?: "draft" | "approved" | "scheduled" | "published" | "failed";
          scheduled_for?: string | null;
          published_at?: string | null;
          late_post_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          brand_id?: string;
          platform?: string;
          copy_primary?: string;
          copy_hashtags?: string[] | null;
          copy_cta?: string | null;
          copy_thread_parts?: string[] | null;
          copy_carousel_slides?: string[] | null;
          status?: "draft" | "approved" | "scheduled" | "published" | "failed";
          scheduled_for?: string | null;
          published_at?: string | null;
          late_post_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      images: {
        Row: {
          id: string;
          content_id: string;
          prompt: string;
          url: string;
          storage_path: string | null;
          dimensions: Json | null;
          format: string | null;
          is_primary: boolean;
          platform_crops: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          prompt: string;
          url: string;
          storage_path?: string | null;
          dimensions?: Json | null;
          format?: string | null;
          is_primary?: boolean;
          platform_crops?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          prompt?: string;
          url?: string;
          storage_path?: string | null;
          dimensions?: Json | null;
          format?: string | null;
          is_primary?: boolean;
          platform_crops?: Json | null;
          created_at?: string;
        };
      };
      analytics: {
        Row: {
          id: string;
          content_id: string;
          platform: string;
          impressions: number;
          reach: number;
          engagements: number;
          likes: number;
          comments: number;
          shares: number;
          clicks: number;
          saves: number;
          collected_at: string;
          raw_data: Json;
        };
        Insert: {
          id?: string;
          content_id: string;
          platform: string;
          impressions?: number;
          reach?: number;
          engagements?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          clicks?: number;
          saves?: number;
          collected_at?: string;
          raw_data?: Json;
        };
        Update: {
          id?: string;
          content_id?: string;
          platform?: string;
          impressions?: number;
          reach?: number;
          engagements?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          clicks?: number;
          saves?: number;
          collected_at?: string;
          raw_data?: Json;
        };
      };
      feedback_events: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state: Json | null;
          after_state: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state?: Json | null;
          after_state?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          before_state?: Json | null;
          after_state?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience types
export type Organization = Tables<"organizations">;
export type Brand = Tables<"brands">;
export type Input = Tables<"inputs">;
export type Idea = Tables<"ideas">;
export type Content = Tables<"content">;
export type Image = Tables<"images">;
export type Analytics = Tables<"analytics">;
export type SocialAccount = Tables<"social_accounts">;

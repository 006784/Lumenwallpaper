export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string | number;
          email: string | null;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          email?: string | null;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          email?: string | null;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          email: string;
          token_hash: string;
          redirect_to: string | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          token_hash: string;
          redirect_to?: string | null;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          token_hash?: string;
          redirect_to?: string | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      wallpapers: {
        Row: {
          id: string | number;
          user_id: string | number | null;
          title: string;
          slug: string;
          description: string | null;
          video_url: string | null;
          status: Database["public"]["Enums"]["wallpaper_status"];
          tags: string[];
          ai_tags: string[];
          ai_category: string | null;
          ai_caption: string | null;
          ai_provider: string | null;
          ai_model: string | null;
          ai_analysis_status: string;
          ai_analysis_error: string | null;
          ai_analyzed_at: string | null;
          colors: string[];
          width: number | null;
          height: number | null;
          downloads_count: number;
          likes_count: number;
          reports_count: number;
          featured: boolean;
          license_confirmed_at: string | null;
          license_version: string | null;
          last_reported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string | number;
          user_id?: string | number | null;
          title: string;
          slug: string;
          description?: string | null;
          video_url?: string | null;
          status?: Database["public"]["Enums"]["wallpaper_status"];
          tags?: string[];
          ai_tags?: string[];
          ai_category?: string | null;
          ai_caption?: string | null;
          ai_provider?: string | null;
          ai_model?: string | null;
          ai_analysis_status?: string;
          ai_analysis_error?: string | null;
          ai_analyzed_at?: string | null;
          colors?: string[];
          width?: number | null;
          height?: number | null;
          downloads_count?: number;
          likes_count?: number;
          reports_count?: number;
          featured?: boolean;
          license_confirmed_at?: string | null;
          license_version?: string | null;
          last_reported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string | number;
          user_id?: string | number | null;
          title?: string;
          slug?: string;
          description?: string | null;
          video_url?: string | null;
          status?: Database["public"]["Enums"]["wallpaper_status"];
          tags?: string[];
          ai_tags?: string[];
          ai_category?: string | null;
          ai_caption?: string | null;
          ai_provider?: string | null;
          ai_model?: string | null;
          ai_analysis_status?: string;
          ai_analysis_error?: string | null;
          ai_analyzed_at?: string | null;
          colors?: string[];
          width?: number | null;
          height?: number | null;
          downloads_count?: number;
          likes_count?: number;
          reports_count?: number;
          featured?: boolean;
          license_confirmed_at?: string | null;
          license_version?: string | null;
          last_reported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallpapers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wallpaper_files: {
        Row: {
          id: string | number;
          wallpaper_id: string | number;
          variant: Database["public"]["Enums"]["wallpaper_variant"];
          storage_path: string;
          url: string;
          size: number | null;
          format: string | null;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          wallpaper_id: string | number;
          variant: Database["public"]["Enums"]["wallpaper_variant"];
          storage_path: string;
          url: string;
          size?: number | null;
          format?: string | null;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          wallpaper_id?: string | number;
          variant?: Database["public"]["Enums"]["wallpaper_variant"];
          storage_path?: string;
          url?: string;
          size?: number | null;
          format?: string | null;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallpaper_files_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          user_id: string | number;
          wallpaper_id: string | number;
          created_at: string;
        };
        Insert: {
          user_id: string | number;
          wallpaper_id: string | number;
          created_at?: string;
        };
        Update: {
          user_id?: string | number;
          wallpaper_id?: string | number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      downloads: {
        Row: {
          id: string | number;
          user_id: string | number;
          wallpaper_id: string | number;
          variant: Database["public"]["Enums"]["wallpaper_variant"] | null;
          downloaded_at: string;
        };
        Insert: {
          id?: string | number;
          user_id: string | number;
          wallpaper_id: string | number;
          variant?: Database["public"]["Enums"]["wallpaper_variant"] | null;
          downloaded_at?: string;
        };
        Update: {
          id?: string | number;
          user_id?: string | number;
          wallpaper_id?: string | number;
          variant?: Database["public"]["Enums"]["wallpaper_variant"] | null;
          downloaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "downloads_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string | number;
          user_id: string | number;
          name: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          user_id: string | number;
          name: string;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          user_id?: string | number;
          name?: string;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_items: {
        Row: {
          collection_id: string | number;
          wallpaper_id: string | number;
          added_at: string;
        };
        Insert: {
          collection_id: string | number;
          wallpaper_id: string | number;
          added_at?: string;
        };
        Update: {
          collection_id?: string | number;
          wallpaper_id?: string | number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_items_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      wallpaper_favorites: {
        Row: {
          id: string | number;
          wallpaper_id: string | number;
          guest_session_id: string;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          wallpaper_id: string | number;
          guest_session_id: string;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          wallpaper_id?: string | number;
          guest_session_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallpaper_favorites_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      wallpaper_reports: {
        Row: {
          id: string | number;
          wallpaper_id: string | number;
          reporter_user_id: string | number | null;
          reporter_email: string | null;
          reporter_ip: string | null;
          reason: string;
          details: string | null;
          status: Database["public"]["Enums"]["wallpaper_report_status"];
          created_at: string;
          reviewed_at: string | null;
          review_note: string | null;
        };
        Insert: {
          id?: string | number;
          wallpaper_id: string | number;
          reporter_user_id?: string | number | null;
          reporter_email?: string | null;
          reporter_ip?: string | null;
          reason: string;
          details?: string | null;
          status?: Database["public"]["Enums"]["wallpaper_report_status"];
          created_at?: string;
          reviewed_at?: string | null;
          review_note?: string | null;
        };
        Update: {
          id?: string | number;
          wallpaper_id?: string | number;
          reporter_user_id?: string | number | null;
          reporter_email?: string | null;
          reporter_ip?: string | null;
          reason?: string;
          details?: string | null;
          status?: Database["public"]["Enums"]["wallpaper_report_status"];
          created_at?: string;
          reviewed_at?: string | null;
          review_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wallpaper_reports_reporter_user_id_fkey";
            columns: ["reporter_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallpaper_reports_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string | number;
          user_id: string | number;
          wallpaper_id: string | number | null;
          kind: string;
          title: string;
          body: string;
          href: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          user_id: string | number;
          wallpaper_id?: string | number | null;
          kind: string;
          title: string;
          body: string;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          user_id?: string | number;
          wallpaper_id?: string | number | null;
          kind?: string;
          title?: string;
          body?: string;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_wallpaper_id_fkey";
            columns: ["wallpaper_id"];
            isOneToOne: false;
            referencedRelation: "wallpapers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_wallpaper_favorite_state: {
        Args: {
          p_identifier: string;
          p_guest_session_id?: string | null;
        };
        Returns: {
          wallpaper_id: string;
          likes_count: number;
          is_favorited: boolean;
        }[];
      };
      increment_wallpaper_downloads: {
        Args: {
          p_identifier: string;
        };
        Returns: {
          wallpaper_id: string;
          downloads_count: number;
        }[];
      };
      toggle_wallpaper_favorite: {
        Args: {
          p_identifier: string;
          p_guest_session_id: string;
        };
        Returns: {
          wallpaper_id: string;
          likes_count: number;
          is_favorited: boolean;
        }[];
      };
    };
    Enums: {
      wallpaper_status: "processing" | "published" | "rejected";
      wallpaper_variant: "original" | "4k" | "thumb" | "preview";
      wallpaper_report_status:
        | "pending"
        | "reviewing"
        | "resolved"
        | "dismissed";
    };
    CompositeTypes: Record<string, never>;
  };
}

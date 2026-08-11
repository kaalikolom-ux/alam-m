export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null
          content_bn: string | null
          content_en: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt_bn: string | null
          excerpt_en: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title_bn: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content_bn?: string | null
          content_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt_bn?: string | null
          excerpt_en?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title_bn: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content_bn?: string | null
          content_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt_bn?: string | null
          excerpt_en?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title_bn?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          bio_bn: string | null
          bio_en: string | null
          created_at: string
          id: string
          image_url: string | null
          name_bn: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          bio_bn?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name_bn: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          bio_bn?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name_bn?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          article_id: string | null
          ayah: number | null
          created_at: string
          id: string
          kind: string
          label: string | null
          note: string | null
          surah: number | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          ayah?: number | null
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          note?: string | null
          surah?: number | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          ayah?: number | null
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          note?: string | null
          surah?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      quran_chapters: {
        Row: {
          id: number
          lang: string
          name_arabic: string
          name_simple: string
          revelation_place: string | null
          translated_name: string
          updated_at: string
          verses_count: number
        }
        Insert: {
          id: number
          lang?: string
          name_arabic: string
          name_simple: string
          revelation_place?: string | null
          translated_name: string
          updated_at?: string
          verses_count: number
        }
        Update: {
          id?: number
          lang?: string
          name_arabic?: string
          name_simple?: string
          revelation_place?: string | null
          translated_name?: string
          updated_at?: string
          verses_count?: number
        }
        Relationships: []
      }
      quran_sync_state: {
        Row: {
          surah: number
          synced_at: string
          verses_synced: number
        }
        Insert: {
          surah: number
          synced_at?: string
          verses_synced?: number
        }
        Update: {
          surah?: number
          synced_at?: string
          verses_synced?: number
        }
        Relationships: []
      }
      quran_verses: {
        Row: {
          audio_url: string | null
          ayah: number
          bn_text: string | null
          en_text: string | null
          surah: number
          text_uthmani: string
          updated_at: string
          words: Json
        }
        Insert: {
          audio_url?: string | null
          ayah: number
          bn_text?: string | null
          en_text?: string | null
          surah: number
          text_uthmani: string
          updated_at?: string
          words?: Json
        }
        Update: {
          audio_url?: string | null
          ayah?: number
          bn_text?: string | null
          en_text?: string | null
          surah?: number
          text_uthmani?: string
          updated_at?: string
          words?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verse_translations: {
        Row: {
          ayah: number
          created_at: string
          created_by: string | null
          id: string
          lang: string
          note: string | null
          surah: number
          text: string
          updated_at: string
        }
        Insert: {
          ayah: number
          created_at?: string
          created_by?: string | null
          id?: string
          lang: string
          note?: string | null
          surah: number
          text: string
          updated_at?: string
        }
        Update: {
          ayah?: number
          created_at?: string
          created_by?: string | null
          id?: string
          lang?: string
          note?: string | null
          surah?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          notes: string | null
          organization: string | null
          person_name: string
          source: Database["public"]["Enums"]["contact_source"]
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[] | null
          title: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          organization?: string | null
          person_name: string
          source?: Database["public"]["Enums"]["contact_source"]
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          organization?: string | null
          person_name?: string
          source?: Database["public"]["Enums"]["contact_source"]
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      extension_sync: {
        Row: {
          created_at: string
          data: Json
          id: string
          processed: boolean | null
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          processed?: boolean | null
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          processed?: boolean | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduler_links: {
        Row: {
          confidence_score: number | null
          contact_id: string
          context_snippet: string | null
          discovered_at: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_checked: string | null
          platform: Database["public"]["Enums"]["scheduler_platform"]
          url: string
          verification_date: string | null
        }
        Insert: {
          confidence_score?: number | null
          contact_id: string
          context_snippet?: string | null
          discovered_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_checked?: string | null
          platform: Database["public"]["Enums"]["scheduler_platform"]
          url: string
          verification_date?: string | null
        }
        Update: {
          confidence_score?: number | null
          contact_id?: string
          context_snippet?: string | null
          discovered_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_checked?: string | null
          platform?: Database["public"]["Enums"]["scheduler_platform"]
          url?: string
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduler_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_sessions: {
        Row: {
          completed_at: string | null
          id: string
          results_count: number | null
          search_params: Json
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          results_count?: number | null
          search_params: Json
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          results_count?: number | null
          search_params?: Json
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          api_keys: Json | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_keys?: Json | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_keys?: Json | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_source: "extension" | "web_app" | "manual" | "import"
      contact_status:
        | "new"
        | "contacted"
        | "responded"
        | "meeting_scheduled"
        | "closed"
      scheduler_platform:
        | "calendly"
        | "cal.com"
        | "acuity"
        | "hubspot"
        | "zoom"
        | "other"
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
      contact_source: ["extension", "web_app", "manual", "import"],
      contact_status: [
        "new",
        "contacted",
        "responded",
        "meeting_scheduled",
        "closed",
      ],
      scheduler_platform: [
        "calendly",
        "cal.com",
        "acuity",
        "hubspot",
        "zoom",
        "other",
      ],
    },
  },
} as const

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          headline: string
          id: string
          impact: number
          occurred_at: string
          personality_id: string
        }
        Insert: {
          headline: string
          id?: string
          impact: number
          occurred_at?: string
          personality_id: string
        }
        Update: {
          headline?: string
          id?: string
          impact?: number
          occurred_at?: string
          personality_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          avg_cost: number
          id: string
          personality_id: string
          shares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost?: number
          id?: string
          personality_id: string
          shares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          id?: string
          personality_id?: string
          shares?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      news_history: {
        Row: {
          id: number
          personality_id: string
          title: string
          url: string | null
          source: string
          sentiment: string
          published_at: string | null
          processed_at: string
        }
        Insert: {
          id?: number
          personality_id: string
          title: string
          url?: string | null
          source: string
          sentiment: string
          published_at?: string | null
          processed_at?: string
        }
        Update: {
          id?: number
          personality_id?: string
          title?: string
          url?: string | null
          source?: string
          sentiment?: string
          published_at?: string | null
          processed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_history_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      personalities: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: Database["public"]["Enums"]["category"]
          change_pct: number
          created_at: string
          current_price: number
          id: string
          last_reality_score: number | null
          last_subscriber_count: number | null
          name: string
          score_updated_at: string | null
          slug: string
          youtube_channel_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category: Database["public"]["Enums"]["category"]
          change_pct?: number
          created_at?: string
          current_price: number
          id?: string
          last_reality_score?: number | null
          last_subscriber_count?: number | null
          name: string
          score_updated_at?: string | null
          slug: string
          youtube_channel_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: Database["public"]["Enums"]["category"]
          change_pct?: number
          created_at?: string
          current_price?: number
          id?: string
          last_reality_score?: number | null
          last_subscriber_count?: number | null
          name?: string
          score_updated_at?: string | null
          slug?: string
          youtube_channel_id?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: number
          personality_id: string
          price: number
          recorded_at: string
        }
        Insert: {
          id?: number
          personality_id: string
          price: number
          recorded_at?: string
        }
        Update: {
          id?: number
          personality_id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          balance?: number
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          id: string
          personality_id: string
          price: number
          shares: number
          side: Database["public"]["Enums"]["txn_side"]
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          personality_id: string
          price: number
          shares: number
          side: Database["public"]["Enums"]["txn_side"]
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          personality_id?: string
          price?: number
          shares?: number
          side?: Database["public"]["Enums"]["txn_side"]
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tick_market: { Args: never; Returns: undefined }
      tick_market_with_delta: {
        Args: { p_personality_id: string; p_delta_pct: number }
        Returns: undefined
      }
    }
    Enums: {
      category: "Sport" | "Entertainment" | "Tech" | "Politics"
      txn_side: "buy" | "sell"
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
      category: ["Sport", "Entertainment", "Tech", "Politics"],
      txn_side: ["buy", "sell"],
    },
  },
} as const

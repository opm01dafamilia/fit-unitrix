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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string
          user_name: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
          user_name: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      activity_reactions: {
        Row: {
          activity_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          emoji?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_reactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      body_tracking: {
        Row: {
          arm: number | null
          body_fat: number | null
          chest: number | null
          created_at: string
          hip: number | null
          id: string
          leg: number | null
          user_id: string
          waist: number | null
          weight: number
        }
        Insert: {
          arm?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          hip?: number | null
          id?: string
          leg?: number | null
          user_id: string
          waist?: number | null
          weight: number
        }
        Update: {
          arm?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          hip?: number | null
          id?: string
          leg?: number | null
          user_id?: string
          waist?: number | null
          weight?: number
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          activity_level: string
          created_at: string
          height: number
          id: string
          objective: string
          plan_data: Json
          user_id: string
          weight: number
        }
        Insert: {
          activity_level: string
          created_at?: string
          height: number
          id?: string
          objective: string
          plan_data: Json
          user_id: string
          weight: number
        }
        Update: {
          activity_level?: string
          created_at?: string
          height?: number
          id?: string
          objective?: string
          plan_data?: Json
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      diet_tracking: {
        Row: {
          adherence_pct: number
          all_completed: boolean
          created_at: string
          id: string
          meals_done: number
          meals_failed: number
          meals_total: number
          tracked_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adherence_pct?: number
          all_completed?: boolean
          created_at?: string
          id?: string
          meals_done?: number
          meals_failed?: number
          meals_total?: number
          tracked_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adherence_pct?: number
          all_completed?: boolean
          created_at?: string
          id?: string
          meals_done?: number
          meals_failed?: number
          meals_total?: number
          tracked_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_history: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          muscle_group: string
          reps: number
          set_number: number
          user_id: string
          weight: number
          workout_session_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          muscle_group: string
          reps?: number
          set_number?: number
          user_id: string
          weight?: number
          workout_session_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          muscle_group?: string
          reps?: number
          set_number?: number
          user_id?: string
          weight?: number
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_history_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          user_id: string
          user_name: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
          user_name?: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_goals: {
        Row: {
          created_at: string
          current_value: number
          goal_type: string | null
          id: string
          status: string
          target_date: string | null
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          goal_type?: string | null
          id?: string
          status?: string
          target_date?: string | null
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          goal_type?: string | null
          id?: string
          status?: string
          target_date?: string | null
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          experience_level: string | null
          friend_code: string | null
          full_name: string | null
          gender: string | null
          height: number | null
          id: string
          objective: string | null
          onboarding_completed: boolean
          privacy_level: string
          state: string | null
          training_location: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          experience_level?: string | null
          friend_code?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          objective?: string | null
          onboarding_completed?: boolean
          privacy_level?: string
          state?: string | null
          training_location?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          experience_level?: string | null
          friend_code?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          objective?: string | null
          onboarding_completed?: boolean
          privacy_level?: string
          state?: string | null
          training_location?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          created_at: string
          has_subscription: boolean
          id: string
          invite_code: string
          invited_email: string | null
          invited_user_id: string | null
          inviter_id: string
          status: string
          updated_at: string
          validated: boolean
          validated_at: string | null
          workouts_completed: number
        }
        Insert: {
          created_at?: string
          has_subscription?: boolean
          id?: string
          invite_code: string
          invited_email?: string | null
          invited_user_id?: string | null
          inviter_id: string
          status?: string
          updated_at?: string
          validated?: boolean
          validated_at?: string | null
          workouts_completed?: number
        }
        Update: {
          created_at?: string
          has_subscription?: boolean
          id?: string
          invite_code?: string
          invited_email?: string | null
          invited_user_id?: string | null
          inviter_id?: string
          status?: string
          updated_at?: string
          validated?: boolean
          validated_at?: string | null
          workouts_completed?: number
        }
        Relationships: []
      }
      user_ranking_stats: {
        Row: {
          achievements_count: number
          diet_streak: number
          id: string
          rank_tier: string
          ranking_score: number
          total_series: number
          total_workouts: number
          total_xp: number
          updated_at: string
          user_id: string
          user_name: string
          week_start: string
          weekly_xp: number
          workout_streak: number
        }
        Insert: {
          achievements_count?: number
          diet_streak?: number
          id?: string
          rank_tier?: string
          ranking_score?: number
          total_series?: number
          total_workouts?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          user_name?: string
          week_start?: string
          weekly_xp?: number
          workout_streak?: number
        }
        Update: {
          achievements_count?: number
          diet_streak?: number
          id?: string
          rank_tier?: string
          ranking_score?: number
          total_series?: number
          total_workouts?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          user_name?: string
          week_start?: string
          weekly_xp?: number
          workout_streak?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          icon: string
          id: string
          target_value: number
          title: string
          week_start: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          target_value?: number
          title: string
          week_start?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          target_value?: number
          title?: string
          week_start?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          body_focus: string | null
          created_at: string
          days_per_week: number
          experience_level: string
          id: string
          objective: string
          plan_data: Json
          user_id: string
        }
        Insert: {
          body_focus?: string | null
          created_at?: string
          days_per_week: number
          experience_level: string
          id?: string
          objective: string
          plan_data: Json
          user_id: string
        }
        Update: {
          body_focus?: string | null
          created_at?: string
          days_per_week?: number
          experience_level?: string
          id?: string
          objective?: string
          plan_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string
          day_index: number
          day_name: string
          exercises_completed: number
          exercises_total: number
          id: string
          muscle_group: string
          user_id: string
          workout_plan_id: string | null
        }
        Insert: {
          completed_at?: string
          day_index: number
          day_name: string
          exercises_completed?: number
          exercises_total?: number
          id?: string
          muscle_group: string
          user_id: string
          workout_plan_id?: string | null
        }
        Update: {
          completed_at?: string
          day_index?: number
          day_name?: string
          exercises_completed?: number
          exercises_total?: number
          id?: string
          muscle_group?: string
          user_id?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
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
    Enums: {},
  },
} as const

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
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
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
      fitness_scores: {
        Row: {
          city: string | null
          experience_level: string | null
          id: string
          score: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          experience_level?: string | null
          id?: string
          score?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          experience_level?: string | null
          id?: string
          score?: number
          tier?: string
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
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      trainer_students: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          student_email: string | null
          student_name: string
          student_user_id: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          student_email?: string | null
          student_name: string
          student_user_id?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          student_email?: string | null
          student_name?: string
          student_user_id?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainer_workout_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plan_data: Json
          student_id: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_data?: Json
          student_id: string
          title?: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_data?: Json
          student_id?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_workout_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "trainer_students"
            referencedColumns: ["id"]
          },
        ]
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
      user_files: {
        Row: {
          ai_extracted_data: Json | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          user_id: string
        }
        Update: {
          ai_extracted_data?: Json | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      user_leagues: {
        Row: {
          created_at: string
          group_number: number
          id: string
          league: string
          season_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_number?: number
          id?: string
          league?: string
          season_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_number?: number
          id?: string
          league?: string
          season_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
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
      user_season_progress: {
        Row: {
          created_at: string
          final_position: number | null
          id: string
          season_id: string
          season_level: number
          season_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          final_position?: number | null
          id?: string
          season_id: string
          season_level?: number
          season_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          final_position?: number | null
          id?: string
          season_id?: string
          season_level?: number
          season_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_logs: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          icon: string
          id: string
          target_value: number
          title: string
          week_start: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          difficulty?: string
          icon?: string
          id?: string
          target_value?: number
          title: string
          week_start?: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string
          id?: string
          target_value?: number
          title?: string
          week_start?: string
          xp_reward?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "personal" | "user" | "admin_master" | "admin_viewer"
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
      app_role: ["admin", "personal", "user", "admin_master", "admin_viewer"],
    },
  },
} as const

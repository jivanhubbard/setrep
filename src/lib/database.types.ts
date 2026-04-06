export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GoalType = "bulk" | "cut" | "recomp" | "maintain" | "performance";
export type WeightUnitType = "lb" | "kg";
export type ExperienceLevelType = "beginner" | "intermediate" | "advanced";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          goal: GoalType | null;
          experience_level: ExperienceLevelType | null;
          days_per_week: number | null;
          equipment: string | null;
          injuries_notes: string | null;
          program_template_id: string | null;
          weight_unit: WeightUnitType;
          timezone: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          goal?: GoalType | null;
          experience_level?: ExperienceLevelType | null;
          days_per_week?: number | null;
          equipment?: string | null;
          injuries_notes?: string | null;
          program_template_id?: string | null;
          weight_unit?: WeightUnitType;
          timezone?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          goal?: GoalType | null;
          experience_level?: ExperienceLevelType | null;
          days_per_week?: number | null;
          equipment?: string | null;
          injuries_notes?: string | null;
          program_template_id?: string | null;
          weight_unit?: WeightUnitType;
          timezone?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      program_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          days_per_week: number;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
      };
      template_days: {
        Row: {
          id: string;
          template_id: string;
          day_index: number;
          focus_label: string;
          muscle_groups: string[];
        };
      };
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          muscle_group: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          muscle_group: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          muscle_group?: string;
          created_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          performed_at: string;
          title: string;
          notes: string | null;
          duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          performed_at: string;
          title?: string;
          notes?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          performed_at?: string;
          title?: string;
          notes?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_entries: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string | null;
          sort_order: number;
          custom_exercise_name: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id?: string | null;
          sort_order?: number;
          custom_exercise_name?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string | null;
          sort_order?: number;
          custom_exercise_name?: string | null;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          entry_id: string;
          set_index: number;
          reps: number;
          weight: number;
        };
        Insert: {
          id?: string;
          entry_id: string;
          set_index: number;
          reps: number;
          weight: number;
        };
        Update: {
          id?: string;
          entry_id?: string;
          set_index?: number;
          reps?: number;
          weight?: number;
        };
      };
    };
    Enums: {
      goal_type: GoalType;
      weight_unit_type: WeightUnitType;
      experience_level_type: ExperienceLevelType;
    };
  };
};

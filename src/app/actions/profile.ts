"use server";

import { revalidatePath } from "next/cache";

import type { GoalType } from "@/lib/onboarding";
import { suggestProgramTemplateId } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(form: {
  goal: GoalType;
  daysPerWeek: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  equipment: string;
  injuriesNotes: string;
  weightUnit: "lb" | "kg";
  programTemplateId?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const templateId =
    form.programTemplateId ?? suggestProgramTemplateId(form.goal, form.daysPerWeek);

  const { error } = await supabase
    .from("profiles")
    .update({
      goal: form.goal,
      days_per_week: form.daysPerWeek,
      experience_level: form.experienceLevel,
      equipment: form.equipment,
      injuries_notes: form.injuriesNotes || null,
      weight_unit: form.weightUnit,
      program_template_id: templateId,
      onboarding_completed: true,
    })
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function updateProfileSettings(form: {
  displayName?: string | null;
  weightUnit?: "lb" | "kg";
  programTemplateId?: string | null;
  daysPerWeek?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: form.displayName ?? null,
      weight_unit: form.weightUnit,
      program_template_id:
        form.programTemplateId && form.programTemplateId.length > 0
          ? form.programTemplateId
          : null,
      days_per_week: form.daysPerWeek,
    })
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/", "layout");
}

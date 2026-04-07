"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Replace the user's saved starter exercises for one weekday slot on their program template.
 */
export async function saveTemplateDayExercises(input: {
  programTemplateId: string;
  dayIndex: number;
  exerciseIds: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { programTemplateId, dayIndex, exerciseIds } = input;
  if (dayIndex < 0 || dayIndex > 6) throw new Error("Invalid day");
  const ids = exerciseIds.filter(Boolean);
  if (ids.length === 0) throw new Error("Add at least one exercise");

  const { error: delErr } = await supabase
    .from("user_template_day_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("program_template_id", programTemplateId)
    .eq("day_index", dayIndex);

  if (delErr) throw delErr;

  const rows = ids.map((exercise_id, sort_order) => ({
    user_id: user.id,
    program_template_id: programTemplateId,
    day_index: dayIndex,
    exercise_id,
    sort_order,
  }));

  const { error: insErr } = await supabase.from("user_template_day_exercises").insert(rows);
  if (insErr) throw insErr;

  revalidatePath("/");
  revalidatePath("/settings");
}

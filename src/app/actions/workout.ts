"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const setSchema = z.object({
  reps: z.number().int().min(0),
  weight: z.number().min(0),
});

const entrySchema = z
  .object({
    exerciseId: z.string().uuid().optional(),
    customName: z.string().optional(),
    muscleGroup: z.string().min(1).optional(),
    sets: z.array(setSchema).min(1),
  })
  .refine(
    (d) =>
      Boolean(d.exerciseId) ||
      (d.customName !== undefined && d.customName.trim().length > 0),
    { message: "Each exercise needs a library pick or a custom name." }
  );

const saveWorkoutSchema = z.object({
  title: z.string().min(1).max(200),
  performedAt: z.string(),
  notes: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional().nullable(),
  entries: z.array(entrySchema).min(1),
});

export type SaveWorkoutInput = z.infer<typeof saveWorkoutSchema>;

async function resolveExerciseId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entry: z.infer<typeof entrySchema>
): Promise<string> {
  if (entry.exerciseId) return entry.exerciseId;

  const name = entry.customName!.trim();
  const muscle = entry.muscleGroup ?? "general";

  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("exercises")
    .insert({ user_id: userId, name, muscle_group: muscle })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

async function insertEntriesForSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
  entries: z.infer<typeof saveWorkoutSchema>["entries"]
) {
  let sort = 0;
  for (const entry of entries) {
    const exerciseId = await resolveExerciseId(supabase, userId, entry);
    const { data: we, error: eErr } = await supabase
      .from("workout_entries")
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        sort_order: sort++,
        custom_exercise_name: null,
      })
      .select("id")
      .single();

    if (eErr) throw eErr;

    let setIndex = 0;
    for (const s of entry.sets) {
      const { error: sErr } = await supabase.from("workout_sets").insert({
        entry_id: we.id,
        set_index: setIndex++,
        reps: s.reps,
        weight: s.weight,
      });
      if (sErr) throw sErr;
    }
  }
}

export async function saveWorkout(raw: SaveWorkoutInput) {
  const parsed = saveWorkoutSchema.parse(raw);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      title: parsed.title,
      performed_at: parsed.performedAt,
      notes: parsed.notes ?? null,
      duration_minutes: parsed.durationMinutes ?? null,
    })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  await insertEntriesForSession(supabase, user.id, session.id, parsed.entries);

  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return { sessionId: session.id };
}

export async function updateWorkout(sessionId: string, raw: SaveWorkoutInput) {
  const parsed = saveWorkoutSchema.parse(raw);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: exErr } = await supabase
    .from("workout_sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();

  if (exErr || !existing || existing.user_id !== user.id) {
    throw new Error("Session not found");
  }

  const { error: upErr } = await supabase
    .from("workout_sessions")
    .update({
      title: parsed.title,
      performed_at: parsed.performedAt,
      notes: parsed.notes ?? null,
      duration_minutes: parsed.durationMinutes ?? null,
    })
    .eq("id", sessionId);

  if (upErr) throw upErr;

  await supabase.from("workout_entries").delete().eq("session_id", sessionId);

  await insertEntriesForSession(supabase, user.id, sessionId, parsed.entries);

  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath(`/workouts/${sessionId}`);
  return { sessionId };
}

export async function duplicateWorkout(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_entries (
        id,
        sort_order,
        exercise_id,
        custom_exercise_name,
        exercises (*),
        workout_sets (*)
      )
    `
    )
    .eq("id", sessionId)
    .single();

  if (sErr || !session || session.user_id !== user.id) throw new Error("Not found");

  const entries = (session.workout_entries as {
    sort_order: number;
    exercise_id: string | null;
    custom_exercise_name: string | null;
    exercises: { id: string; muscle_group: string; name: string } | null;
    workout_sets: { reps: number; weight: number; set_index: number }[];
  }[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const payload: SaveWorkoutInput = {
    title: `${session.title} (copy)`,
    performedAt: new Date().toISOString(),
    notes: session.notes ?? undefined,
    durationMinutes: session.duration_minutes,
    entries: [],
  };

  for (const e of entries) {
    if (!e.exercise_id) continue;
    const sets = e.workout_sets
      .slice()
      .sort((a, b) => a.set_index - b.set_index)
      .map((ws) => ({ reps: ws.reps, weight: Number(ws.weight) }));
    payload.entries.push({
      exerciseId: e.exercise_id,
      sets,
    });
  }

  if (payload.entries.length === 0) throw new Error("Nothing to duplicate");

  const result = await saveWorkout(payload);
  redirect(`/workouts/${result.sessionId}`);
}

export async function deleteWorkout(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  redirect("/workouts");
}

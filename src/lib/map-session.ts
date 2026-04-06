import type { SaveWorkoutInput } from "@/app/actions/workout";

export function mapSessionToSaveInput(session: {
  title: string;
  performed_at: string;
  notes: string | null;
  duration_minutes: number | null;
  workout_entries: Array<{
    sort_order: number;
    exercise_id: string | null;
    custom_exercise_name: string | null;
    exercises: { id: string; name: string; muscle_group: string } | null;
    workout_sets: Array<{ set_index: number; reps: number; weight: number | string }>;
  }>;
}): SaveWorkoutInput {
  const entries = session.workout_entries
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((e) => {
      const sets = e.workout_sets
        .slice()
        .sort((a, b) => a.set_index - b.set_index)
        .map((ws) => ({
          reps: ws.reps,
          weight: Number(ws.weight),
        }));
      if (e.exercise_id) {
        return { exerciseId: e.exercise_id, sets };
      }
      return {
        customName: e.custom_exercise_name ?? e.exercises?.name ?? "Custom",
        muscleGroup: e.exercises?.muscle_group ?? "general",
        sets,
      };
    });

  return {
    title: session.title,
    performedAt: session.performed_at,
    notes: session.notes ?? undefined,
    durationMinutes: session.duration_minutes,
    entries,
  };
}

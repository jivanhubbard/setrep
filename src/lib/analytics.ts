import { startOfWeek, format } from "date-fns";

import type { Database } from "@/lib/database.types";

type SessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
type EntryRow = Database["public"]["Tables"]["workout_entries"]["Row"];
type SetRow = Database["public"]["Tables"]["workout_sets"]["Row"];
type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export type SessionWithLines = SessionRow & {
  workout_entries: (EntryRow & {
    exercises: ExerciseRow | null;
    workout_sets: SetRow[];
  })[];
};

export function weekKeyMonday(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function aggregateWeeklyVolume(sessions: SessionWithLines[]): {
  week: string;
  volume: number;
  sessions: number;
}[] {
  const map = new Map<string, { volume: number; sessions: number }>();
  for (const s of sessions) {
    const wk = weekKeyMonday(new Date(s.performed_at));
    const cur = map.get(wk) ?? { volume: 0, sessions: 0 };
    cur.sessions += 1;
    for (const e of s.workout_entries) {
      for (const st of e.workout_sets) {
        cur.volume += st.reps * Number(st.weight);
      }
    }
    map.set(wk, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({ week, volume: Math.round(v.volume), sessions: v.sessions }));
}

export function computePRs(
  sessions: SessionWithLines[]
): { exerciseId: string; name: string; maxWeight: number; muscle: string }[] {
  const best = new Map<string, { name: string; muscle: string; maxWeight: number }>();
  for (const s of sessions) {
    for (const e of s.workout_entries) {
      const name = e.exercises?.name ?? e.custom_exercise_name ?? "Unknown";
      const muscle = e.exercises?.muscle_group ?? "custom";
      const id = e.exercise_id ?? e.id;
      for (const st of e.workout_sets) {
        const w = Number(st.weight);
        const prev = best.get(id);
        if (!prev || w > prev.maxWeight) {
          best.set(id, { name, muscle, maxWeight: w });
        }
      }
    }
  }
  return Array.from(best.entries())
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => b.maxWeight - a.maxWeight);
}

export function muscleVolumeLastWindow(
  sessions: SessionWithLines[],
  days: number
): { muscle: string; volume: number }[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (new Date(s.performed_at).getTime() < cutoff) continue;
    for (const e of s.workout_entries) {
      const muscle = e.exercises?.muscle_group ?? "custom";
      for (const st of e.workout_sets) {
        map.set(muscle, (map.get(muscle) ?? 0) + st.reps * Number(st.weight));
      }
    }
  }
  return Array.from(map.entries())
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);
}

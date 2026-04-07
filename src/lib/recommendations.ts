import { differenceInHours } from "date-fns";

import type { Database } from "@/lib/database.types";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
type TemplateDayRow = Database["public"]["Tables"]["template_days"]["Row"];
type SessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
type EntryRow = Database["public"]["Tables"]["workout_entries"]["Row"];

const RECOVERY_HOURS_MIN = 48;

export type RecommendationResult = {
  dayIndex: number;
  templateFocus: string | null;
  templateMuscles: string[];
  suggestedTitle: string;
  reasons: string[];
  suggestedExercises: { id: string; name: string; muscle_group: string; reason: string }[];
  muscleRecovery: { muscle: string; hoursSinceLast: number | null; needsRest: boolean }[];
};

/** Monday = 0 … Sunday = 6 */
export function mondayBasedDayIndex(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

/**
 * Last trained time per muscle from recent sessions (entries join exercises or custom name muscle inference).
 */
export function buildMuscleLastTrainedMap(
  sessions: (SessionRow & {
    workout_entries: (EntryRow & { exercises: ExerciseRow | null })[];
  })[],
  now: Date
): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const s of sessions) {
    const at = new Date(s.performed_at);
    for (const e of s.workout_entries) {
      let muscle: string | null = null;
      if (e.exercises?.muscle_group) {
        muscle = e.exercises.muscle_group;
      } else if (e.custom_exercise_name) {
        muscle = "general";
      }
      if (!muscle) continue;
      const prev = map.get(muscle);
      if (!prev || at > prev) map.set(muscle, at);
    }
  }
  return map;
}

export function computeRecommendations(input: {
  now: Date;
  templateDays: TemplateDayRow[];
  exercises: ExerciseRow[];
  recentSessions: (SessionRow & {
    workout_entries: (EntryRow & { exercises: ExerciseRow | null })[];
  })[];
  /** When set, overrides heuristic picks for this weekday slot */
  savedDayExercises?: ExerciseRow[] | null;
}): RecommendationResult {
  const { now, templateDays, exercises, recentSessions, savedDayExercises } = input;
  const dayIndex = mondayBasedDayIndex(now);
  const td = templateDays.find((t) => t.day_index === dayIndex) ?? null;

  const reasons: string[] = [];
  const templateFocus = td?.focus_label ?? null;
  const templateMuscles = td?.muscle_groups ?? [];

  if (td) {
    reasons.push(`Your program expects "${td.focus_label}" today (${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIndex]}).`);
  } else {
    reasons.push("No template slot for today — train by feel or pick a focus.");
  }

  const muscleLast = buildMuscleLastTrainedMap(recentSessions, now);
  const muscleRecovery: RecommendationResult["muscleRecovery"] = [];

  for (const m of templateMuscles.length ? templateMuscles : Array.from(muscleLast.keys())) {
    const last = muscleLast.get(m) ?? null;
    const hours = last ? differenceInHours(now, last) : null;
    const needsRest = hours !== null && hours < RECOVERY_HOURS_MIN;
    muscleRecovery.push({ muscle: m, hoursSinceLast: hours, needsRest });
    if (needsRest) {
      reasons.push(`${m} was trained ${hours}h ago — consider lighter volume or a different focus.`);
    }
  }

  const targetMuscles =
    templateMuscles.filter((m) => {
      const last = muscleLast.get(m);
      if (!last) return true;
      return differenceInHours(now, last) >= RECOVERY_HOURS_MIN;
    }) ?? templateMuscles;

  const pickMuscles = targetMuscles.length ? targetMuscles : templateMuscles;

  const globalExercises = exercises.filter((e) => !e.user_id);
  let suggestedExercises: RecommendationResult["suggestedExercises"] = [];

  if (savedDayExercises && savedDayExercises.length > 0) {
    reasons.push("Using your saved starter exercises for this weekday.");
    suggestedExercises = savedDayExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      reason: "Saved for this day in your program",
    }));
  } else {
    for (const muscle of pickMuscles.slice(0, 3)) {
      const candidates = globalExercises.filter((ex) => ex.muscle_group === muscle);
      const lastSession = recentSessions[0];
      let best = candidates[0];
      if (lastSession) {
        const prev = lastSession.workout_entries.find(
          (en) => en.exercises?.muscle_group === muscle
        );
        if (prev?.exercises) {
          const same = candidates.find((c) => c.id === prev.exercises?.id);
          if (same) {
            best = same;
            reasons.push(`Progress ${same.name}: try a small weight bump or +1 rep from last time.`);
          }
        }
      }
      if (best) {
        suggestedExercises.push({
          id: best.id,
          name: best.name,
          muscle_group: best.muscle_group,
          reason: `Matches today's "${muscle}" focus`,
        });
      }
    }
  }

  const suggestedTitle = td?.focus_label
    ? `${td.focus_label} — ${now.toLocaleDateString(undefined, { weekday: "long" })}`
    : "Training session";

  return {
    dayIndex,
    templateFocus,
    templateMuscles,
    suggestedTitle,
    reasons,
    suggestedExercises,
    muscleRecovery,
  };
}

export type GoalType = "bulk" | "cut" | "recomp" | "maintain" | "performance";

/** Fixed UUIDs from seed migration — must match `supabase/migrations/20260405000001_seed_templates_and_exercises.sql` */
export const PROGRAM_TEMPLATE_IDS = {
  ppl6: "a0000001-0000-4000-8000-000000000001",
  ul4: "a0000001-0000-4000-8000-000000000002",
  fb3: "a0000001-0000-4000-8000-000000000003",
  bro5: "a0000001-0000-4000-8000-000000000004",
} as const;

/**
 * Map goal + training frequency to a preset program template.
 * Heuristic: higher frequency → PPL or bro; lower → full body; cut/recomp → upper/lower for recovery.
 */
export function suggestProgramTemplateId(goal: GoalType, daysPerWeek: number): string {
  if (daysPerWeek >= 6) {
    return PROGRAM_TEMPLATE_IDS.ppl6;
  }
  if (daysPerWeek <= 3) {
    return PROGRAM_TEMPLATE_IDS.fb3;
  }
  if (goal === "bulk" && daysPerWeek >= 5) {
    return PROGRAM_TEMPLATE_IDS.bro5;
  }
  if (goal === "cut" || goal === "recomp") {
    return PROGRAM_TEMPLATE_IDS.ul4;
  }
  if (daysPerWeek === 4) {
    return PROGRAM_TEMPLATE_IDS.ul4;
  }
  return PROGRAM_TEMPLATE_IDS.bro5;
}

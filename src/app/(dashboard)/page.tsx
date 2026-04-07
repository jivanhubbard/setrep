import Link from "next/link";
import { subDays } from "date-fns";
import { Dumbbell } from "lucide-react";

import { RecommendationsPanel } from "@/components/recommendations-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";
import { computeRecommendations, mondayBasedDayIndex } from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
type SessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
type EntryRow = Database["public"]["Tables"]["workout_entries"]["Row"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const now = new Date();
  const from = subDays(now, 21);

  const { data: sessionsRaw } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_entries (
        *,
        exercises (*)
      )
    `
    )
    .eq("user_id", user.id)
    .gte("performed_at", from.toISOString())
    .order("performed_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as (SessionRow & {
    workout_entries: (EntryRow & { exercises: ExerciseRow | null })[];
  })[];

  const templateId = profile?.program_template_id;
  const todayDayIndex = mondayBasedDayIndex(now);

  let templateDays: Database["public"]["Tables"]["template_days"]["Row"][] = [];
  if (templateId) {
    const { data: td } = await supabase
      .from("template_days")
      .select("*")
      .eq("template_id", templateId)
      .order("day_index");
    templateDays = td ?? [];
  }

  const { data: exercisesRaw } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`);

  const exercises = (exercisesRaw ?? []) as ExerciseRow[];
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  let savedDayExercises: ExerciseRow[] = [];
  if (templateId) {
    const { data: savedRows } = await supabase
      .from("user_template_day_exercises")
      .select("exercise_id, sort_order")
      .eq("user_id", user.id)
      .eq("program_template_id", templateId)
      .eq("day_index", todayDayIndex)
      .order("sort_order");
    savedDayExercises = (savedRows ?? [])
      .map((r) => exerciseById.get(r.exercise_id))
      .filter((ex): ex is ExerciseRow => ex != null);
  }

  const rec = computeRecommendations({
    now,
    templateDays,
    exercises,
    recentSessions: sessions,
    savedDayExercises: savedDayExercises.length > 0 ? savedDayExercises : null,
  });

  const weeklyTarget = profile?.days_per_week ?? 4;
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekSessions = sessions.filter((s) => new Date(s.performed_at) >= startOfWeek).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Situation report</h1>
        <p className="text-muted-foreground mt-1">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly cadence</CardTitle>
            <CardDescription>
              {thisWeekSessions} / {weeklyTarget} sessions this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${Math.min(100, (thisWeekSessions / Math.max(weeklyTarget, 1)) * 100)}%`,
                }}
              />
            </div>
            {thisWeekSessions >= weeklyTarget ? (
              <p className="text-xs text-muted-foreground mt-2">On track for your volume target.</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {weeklyTarget - thisWeekSessions} more session
                {weeklyTarget - thisWeekSessions === 1 ? "" : "s"} to hit your weekly goal.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/workouts/new">
                <Dumbbell className="h-4 w-4 mr-2" />
                Log workout
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/calendar">Calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <RecommendationsPanel
        rec={rec}
        suggestedTitle={rec.suggestedTitle}
        programTemplateId={templateId ?? null}
        dayIndex={todayDayIndex}
      />
    </div>
  );
}

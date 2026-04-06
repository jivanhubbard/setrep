import { subWeeks } from "date-fns";

import { SessionsChart, VolumeChart } from "@/components/analytics-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  aggregateWeeklyVolume,
  computePRs,
  muscleVolumeLastWindow,
  type SessionWithLines,
} from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const from = subWeeks(new Date(), 12).toISOString();

  const { data: sessionsRaw } = await supabase
    .from("workout_sessions")
    .select(
      `
      *,
      workout_entries (
        *,
        exercises (*),
        workout_sets (*)
      )
    `
    )
    .eq("user_id", user.id)
    .gte("performed_at", from)
    .order("performed_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as SessionWithLines[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal, days_per_week")
    .eq("user_id", user.id)
    .single();

  const weekly = aggregateWeeklyVolume(sessions);
  const weeklyVolume = weekly.map((w) => ({ week: w.week, volume: w.volume }));
  const weeklySessions = weekly.map((w) => ({ week: w.week, sessions: w.sessions }));

  const prs = computePRs(sessions).slice(0, 12);
  const muscles = muscleVolumeLastWindow(sessions, 28);

  const target = profile?.days_per_week ?? 4;
  const avgSessions =
    weekly.length > 0
      ? weekly.reduce((acc, w) => acc + w.sessions, 0) / weekly.length
      : 0;
  const onTrack = avgSessions >= target * 0.85;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Last 12 weeks of training volume, frequency, and personal records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goal alignment</CardTitle>
          <CardDescription>
            Target: {target} sessions / week
            {profile?.goal ? ` · Goal: ${profile.goal}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Rolling average sessions per week: <strong>{avgSessions.toFixed(1)}</strong>
          </p>
          <p className={`text-sm mt-2 ${onTrack ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
            {onTrack
              ? "You are within range of your weekly frequency target."
              : "Below your weekly frequency target — consider adding a short session if recovery allows."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly volume</CardTitle>
            <CardDescription>Sum of reps × weight across all lifts</CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={weeklyVolume} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions per week</CardTitle>
            <CardDescription>How often you trained</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsChart data={weeklySessions} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Muscle volume (28 days)</CardTitle>
            <CardDescription>Approximate tonnage by tag</CardDescription>
          </CardHeader>
          <CardContent>
            {!muscles.length ? (
              <p className="text-sm text-muted-foreground">Log more workouts to see breakdown.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {muscles.map((m) => (
                  <li key={m.muscle} className="flex justify-between gap-4">
                    <span className="capitalize">{m.muscle.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {m.volume.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top weight PRs (period)</CardTitle>
            <CardDescription>Heaviest single set logged</CardDescription>
          </CardHeader>
          <CardContent>
            {!prs.length ? (
              <p className="text-sm text-muted-foreground">No PRs yet in this window.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {prs.map((p) => (
                  <li key={p.exerciseId} className="flex justify-between gap-4">
                    <span className="truncate">{p.name}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {p.maxWeight} · <span className="capitalize">{p.muscle}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

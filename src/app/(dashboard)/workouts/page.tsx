import Link from "next/link";
import { format } from "date-fns";

import { duplicateWorkout } from "@/app/actions/workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, title, performed_at, duration_minutes")
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false })
    .limit(80);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Workouts</h1>
          <p className="text-muted-foreground mt-1">Recent sessions, newest first.</p>
        </div>
        <Button asChild>
          <Link href="/workouts/new">Log workout</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!sessions?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No workouts yet. Log your first one.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40"
                >
                  <div>
                    <Link href={`/workouts/${s.id}`} className="font-medium hover:underline">
                      {s.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.performed_at), "MMM d, yyyy h:mm a")}
                      {s.duration_minutes != null ? ` · ${s.duration_minutes} min` : ""}
                    </p>
                  </div>
                  <form action={duplicateWorkout.bind(null, s.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Duplicate
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

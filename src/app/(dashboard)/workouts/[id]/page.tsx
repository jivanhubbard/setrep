import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";

import { deleteWorkout } from "@/app/actions/workout";
import { WorkoutForm } from "@/components/workout-form";
import { Button } from "@/components/ui/button";
import { mapSessionToSaveInput } from "@/lib/map-session";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session, error } = await supabase
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
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !session) notFound();

  const { data: exercisesRaw } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("muscle_group")
    .order("name");

  const exercises = (exercisesRaw ?? []) as Pick<ExerciseRow, "id" | "name" | "muscle_group">[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("user_id", user.id)
    .single();

  const initial = mapSessionToSaveInput(
    session as unknown as Parameters<typeof mapSessionToSaveInput>[0]
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Workout</p>
          <h1 className="text-3xl font-semibold tracking-tight">{session.title}</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(session.performed_at), "MMM d, yyyy h:mm a")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/workouts">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to list
            </Link>
          </Button>
          <form action={deleteWorkout.bind(null, id)}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <WorkoutForm
        exercises={exercises}
        weightUnit={profile?.weight_unit ?? "lb"}
        initial={initial}
        sessionId={id}
      />
    </div>
  );
}

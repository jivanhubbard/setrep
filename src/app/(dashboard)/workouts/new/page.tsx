import { WorkoutForm } from "@/components/workout-form";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ suggestedTitle?: string; exercises?: string }>;
}) {
  const { suggestedTitle, exercises: exercisesQuery } = await searchParams;

  const suggestedExerciseIds = exercisesQuery
    ? exercisesQuery
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("user_id", user.id)
    .single();

  const { data: exercisesRaw } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("muscle_group")
    .order("name");

  const exercises = (exercisesRaw ?? []) as Pick<ExerciseRow, "id" | "name" | "muscle_group">[];

  const allowedIds = new Set(exercises.map((e) => e.id));
  const filteredSuggestionIds = suggestedExerciseIds.filter((id) => allowedIds.has(id));

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Log workout</h1>
        <p className="text-muted-foreground mt-1">Title, exercises, sets, and weights.</p>
      </div>
      <WorkoutForm
        exercises={exercises}
        weightUnit={profile?.weight_unit ?? "lb"}
        suggestedTitle={suggestedTitle}
        suggestedExerciseIds={filteredSuggestionIds.length > 0 ? filteredSuggestionIds : undefined}
      />
    </div>
  );
}

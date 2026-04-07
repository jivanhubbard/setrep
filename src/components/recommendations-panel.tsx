import Link from "next/link";

import { SaveProgramDayButton } from "@/components/save-program-day-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendationResult } from "@/lib/recommendations";

/** Query string for /workouts/new: title + comma-separated exercise UUIDs */
export function buildLogWorkoutHref(suggestedTitle: string, exerciseIds: string[]) {
  const params = new URLSearchParams();
  params.set("suggestedTitle", suggestedTitle);
  if (exerciseIds.length > 0) {
    params.set("exercises", exerciseIds.join(","));
  }
  return `/workouts/new?${params.toString()}`;
}

export function RecommendationsPanel({
  rec,
  suggestedTitle,
  programTemplateId,
  dayIndex,
}: {
  rec: RecommendationResult;
  suggestedTitle: string;
  programTemplateId: string | null;
  dayIndex: number;
}) {
  const exerciseIds = rec.suggestedExercises.map((e) => e.id);
  return (
    <Card className="border-accent/30">
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s suggestion</CardTitle>
        <CardDescription>
          {rec.templateFocus
            ? `Template focus: ${rec.templateFocus}`
            : "Pick a focus that matches your energy and schedule."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Suggested session title</p>
          <p className="text-sm text-muted-foreground">{suggestedTitle}</p>
        </div>
        {rec.suggestedExercises.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Starter exercises</p>
            <ul className="text-sm space-y-1">
              {rec.suggestedExercises.map((ex) => (
                <li key={ex.id} className="flex justify-between gap-2">
                  <span>{ex.name}</span>
                  <span className="text-muted-foreground capitalize">{ex.muscle_group}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-sm font-medium mb-2">Why</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {rec.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        {rec.muscleRecovery.some((m) => m.needsRest) && (
          <div className="rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
            Some muscle groups may need more recovery before heavy work — adjust volume if you feel
            fatigued.
          </div>
        )}
        <div className="flex flex-wrap items-start gap-3">
          <Button asChild>
            <Link href={buildLogWorkoutHref(rec.suggestedTitle, exerciseIds)}>
              Log this workout
            </Link>
          </Button>
          {programTemplateId && exerciseIds.length > 0 ? (
            <SaveProgramDayButton
              programTemplateId={programTemplateId}
              dayIndex={dayIndex}
              exerciseIds={exerciseIds}
            />
          ) : (
            <p className="text-xs text-muted-foreground self-center max-w-[14rem]">
              {programTemplateId
                ? "No starter exercises to save yet."
                : "Pick a program in Settings to save a reusable starter list for each weekday."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

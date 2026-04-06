import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendationResult } from "@/lib/recommendations";

export function RecommendationsPanel({
  rec,
  suggestedTitle,
}: {
  rec: RecommendationResult;
  suggestedTitle: string;
}) {
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
        <Button asChild>
          <Link
            href={`/workouts/new?suggestedTitle=${encodeURIComponent(rec.suggestedTitle)}`}
          >
            Log this workout
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

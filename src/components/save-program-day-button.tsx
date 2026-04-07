"use client";

import { useState, useTransition } from "react";

import { saveTemplateDayExercises } from "@/app/actions/template-day";
import { Button } from "@/components/ui/button";

export function SaveProgramDayButton({
  programTemplateId,
  dayIndex,
  exerciseIds,
  disabled,
}: {
  programTemplateId: string;
  dayIndex: number;
  exerciseIds: string[];
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveTemplateDayExercises({
          programTemplateId,
          dayIndex,
          exerciseIds,
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || pending || exerciseIds.length === 0}
        onClick={onClick}
      >
        {pending ? "Saving…" : "Save to my program"}
      </Button>
      {saved && (
        <p className="text-xs text-muted-foreground">Saved — future suggestions for this weekday will use this list.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

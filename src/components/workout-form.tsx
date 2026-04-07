"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { saveWorkout, updateWorkout, type SaveWorkoutInput } from "@/app/actions/workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ExerciseOption = { id: string; name: string; muscle_group: string };

type EntryState = {
  key: string;
  mode: "library" | "custom";
  exerciseId: string;
  customName: string;
  muscleGroup: string;
  sets: { reps: string; weight: string }[];
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildEntryFromInitial(e: SaveWorkoutInput["entries"][0]): EntryState {
  return {
    key: uid(),
    mode: e.exerciseId ? "library" : "custom",
    exerciseId: e.exerciseId ?? "",
    customName: e.customName ?? "",
    muscleGroup: e.muscleGroup ?? "general",
    sets: e.sets.map((s) => ({
      reps: String(s.reps),
      weight: String(s.weight),
    })),
  };
}

function buildEntriesFromSuggestedIds(
  suggestedExerciseIds: string[],
  exerciseOptions: ExerciseOption[]
): EntryState[] {
  const byId = new Map(exerciseOptions.map((e) => [e.id, e]));
  const defaultSets = () => [
    { reps: "8", weight: "0" },
    { reps: "8", weight: "0" },
    { reps: "8", weight: "0" },
  ];
  return suggestedExerciseIds
    .map((id) => byId.get(id))
    .filter((e): e is ExerciseOption => Boolean(e))
    .map((ex) => ({
      key: uid(),
      mode: "library" as const,
      exerciseId: ex.id,
      customName: "",
      muscleGroup: ex.muscle_group,
      sets: defaultSets(),
    }));
}

export function WorkoutForm({
  exercises,
  weightUnit,
  suggestedTitle,
  suggestedExerciseIds,
  initial,
  sessionId,
}: {
  exercises: ExerciseOption[];
  weightUnit: "lb" | "kg";
  suggestedTitle?: string;
  /** From home recommendations — pre-fills exercises in order */
  suggestedExerciseIds?: string[];
  initial?: SaveWorkoutInput;
  sessionId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? suggestedTitle ?? "Workout");
  const [performedAt, setPerformedAt] = useState(() => {
    if (initial?.performedAt) {
      const d = new Date(initial.performedAt);
      return d.toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [duration, setDuration] = useState(
    initial?.durationMinutes != null ? String(initial.durationMinutes) : ""
  );
  const [entries, setEntries] = useState<EntryState[]>(() => {
    if (initial?.entries?.length) {
      return initial.entries.map(buildEntryFromInitial);
    }
    if (suggestedExerciseIds?.length) {
      const fromSuggestion = buildEntriesFromSuggestedIds(suggestedExerciseIds, exercises);
      if (fromSuggestion.length > 0) {
        return fromSuggestion;
      }
    }
    return [
      {
        key: uid(),
        mode: "library",
        exerciseId: exercises[0]?.id ?? "",
        customName: "",
        muscleGroup: "general",
        sets: [
          { reps: "8", weight: "0" },
          { reps: "8", weight: "0" },
          { reps: "8", weight: "0" },
        ],
      },
    ];
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const byMuscle = useMemo(() => {
    const m = new Map<string, ExerciseOption[]>();
    for (const ex of exercises) {
      const list = m.get(ex.muscle_group) ?? [];
      list.push(ex);
      m.set(ex.muscle_group, list);
    }
    return m;
  }, [exercises]);

  function addExercise() {
    setEntries((prev) => [
      ...prev,
      {
        key: uid(),
        mode: "library",
        exerciseId: exercises[0]?.id ?? "",
        customName: "",
        muscleGroup: "general",
        sets: [{ reps: "8", weight: "0" }],
      },
    ]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.key !== key)));
  }

  function updateEntry(key: string, patch: Partial<EntryState>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function addSet(key: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key
          ? { ...e, sets: [...e.sets, { reps: "8", weight: e.sets[e.sets.length - 1]?.weight ?? "0" }] }
          : e
      )
    );
  }

  function removeSet(entryKey: string, setIdx: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === entryKey && e.sets.length > 1
          ? { ...e, sets: e.sets.filter((_, i) => i !== setIdx) }
          : e
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: SaveWorkoutInput = {
        title: title.trim(),
        performedAt: new Date(performedAt).toISOString(),
        notes: notes.trim() || undefined,
        durationMinutes: duration ? parseInt(duration, 10) : null,
        entries: entries.map((en) => {
          const sets = en.sets.map((s) => ({
            reps: parseInt(s.reps, 10) || 0,
            weight: parseFloat(s.weight) || 0,
          }));
          if (en.mode === "library") {
            return { exerciseId: en.exerciseId, sets };
          }
          return {
            customName: en.customName.trim(),
            muscleGroup: en.muscleGroup,
            sets,
          };
        }),
      };

      if (sessionId) {
        await updateWorkout(sessionId, payload);
      } else {
        await saveWorkout(payload);
      }
      router.push("/workouts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save workout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="when">Date &amp; time</Label>
            <Input
              id="when"
              type="datetime-local"
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dur">Duration (minutes)</Label>
            <Input
              id="dur"
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {entries.map((entry) => (
        <Card key={entry.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Exercise</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeEntry(entry.key)}
              aria-label="Remove exercise"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={entry.mode === "library" ? "default" : "outline"}
                onClick={() => updateEntry(entry.key, { mode: "library" })}
              >
                From library
              </Button>
              <Button
                type="button"
                size="sm"
                variant={entry.mode === "custom" ? "default" : "outline"}
                onClick={() => updateEntry(entry.key, { mode: "custom" })}
              >
                Custom name
              </Button>
            </div>

            {entry.mode === "library" ? (
              <div className="space-y-2">
                <Label>Exercise</Label>
                <Select
                  value={entry.exerciseId}
                  onValueChange={(v) => updateEntry(entry.key, { exerciseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose exercise" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Array.from(byMuscle.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([muscle, list]) => (
                        <div key={muscle}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground capitalize">
                            {muscle.replace(/_/g, " ")}
                          </div>
                          {list.map((ex) => (
                            <SelectItem key={ex.id} value={ex.id}>
                              {ex.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Custom name</Label>
                  <Input
                    value={entry.customName}
                    onChange={(e) => updateEntry(entry.key, { customName: e.target.value })}
                    placeholder="e.g. Landmine press"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Muscle / tag</Label>
                  <Input
                    value={entry.muscleGroup}
                    onChange={(e) => updateEntry(entry.key, { muscleGroup: e.target.value })}
                    placeholder="e.g. shoulders"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sets ({weightUnit})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addSet(entry.key)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add set
                </Button>
              </div>
              <div className="space-y-2">
                {entry.sets.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-muted-foreground">Reps</span>
                      <Input
                        inputMode="numeric"
                        value={s.reps}
                        onChange={(e) => {
                          const sets = [...entry.sets];
                          sets[idx] = { ...sets[idx], reps: e.target.value };
                          updateEntry(entry.key, { sets });
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-muted-foreground">Weight</span>
                      <Input
                        inputMode="decimal"
                        value={s.weight}
                        onChange={(e) => {
                          const sets = [...entry.sets];
                          sets[idx] = { ...sets[idx], weight: e.target.value };
                          updateEntry(entry.key, { sets });
                        }}
                      />
                    </div>
                    {entry.sets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeSet(entry.key, idx)}
                        aria-label="Remove set"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={addExercise}>
          <Plus className="h-4 w-4 mr-2" />
          Add exercise
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : sessionId ? "Update workout" : "Save workout"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

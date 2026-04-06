"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { completeOnboarding } from "@/app/actions/profile";
import type { GoalType } from "@/lib/onboarding";
import { suggestProgramTemplateId } from "@/lib/onboarding";
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

const schema = z.object({
  goal: z.enum(["bulk", "cut", "recomp", "maintain", "performance"]),
  daysPerWeek: z.coerce.number().min(1).max(7),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.enum(["gym", "home"]),
  injuriesNotes: z.string().optional(),
  weightUnit: z.enum(["lb", "kg"]),
  programTemplateId: z.string().uuid().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  days_per_week: number;
  description: string | null;
};

export function OnboardingForm({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      goal: "bulk",
      daysPerWeek: 4,
      experienceLevel: "intermediate",
      equipment: "gym",
      injuriesNotes: "",
      weightUnit: "lb",
      programTemplateId: null,
    },
  });

  const goal = useWatch({ control: form.control, name: "goal" });
  const days = useWatch({ control: form.control, name: "daysPerWeek" });
  const experienceLevel = useWatch({ control: form.control, name: "experienceLevel" });
  const equipment = useWatch({ control: form.control, name: "equipment" });
  const weightUnit = useWatch({ control: form.control, name: "weightUnit" });
  const programTemplateId = useWatch({ control: form.control, name: "programTemplateId" });

  const suggestedId = useMemo(
    () => suggestProgramTemplateId(goal as GoalType, days),
    [goal, days]
  );

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await completeOnboarding({
        goal: values.goal as GoalType,
        daysPerWeek: values.daysPerWeek,
        experienceLevel: values.experienceLevel,
        equipment: values.equipment,
        injuriesNotes: values.injuriesNotes ?? "",
        weightUnit: values.weightUnit,
        programTemplateId: values.programTemplateId ?? suggestedId,
      });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Primary goal</Label>
            <Select
              value={goal}
              onValueChange={(v) => form.setValue("goal", v as FormValues["goal"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulk">Bulk — build muscle & strength</SelectItem>
                <SelectItem value="cut">Cut — lose fat, keep muscle</SelectItem>
                <SelectItem value="recomp">Recomp — body recomposition</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
                <SelectItem value="performance">Performance / sport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days">Days per week</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={7}
                {...form.register("daysPerWeek", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Select
                value={experienceLevel}
                onValueChange={(v) =>
                  form.setValue("experienceLevel", v as FormValues["experienceLevel"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipment</Label>
            <Select
              value={equipment}
              onValueChange={(v) => form.setValue("equipment", v as "gym" | "home")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gym">Full gym</SelectItem>
                <SelectItem value="home">Home / limited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Weight unit</Label>
            <Select
              value={weightUnit}
              onValueChange={(v) => form.setValue("weightUnit", v as "lb" | "kg")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lb">lb</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Program (recommended)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Default pick from your goal and frequency — override if you prefer.
            </p>
            <Select
              value={programTemplateId ?? suggestedId}
              onValueChange={(v) => form.setValue("programTemplateId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.id === suggestedId ? " (suggested)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="injuries">Injuries / limitations (optional)</Label>
            <Textarea
              id="injuries"
              placeholder="e.g. sensitive lower back — prefer machines for hinge patterns"
              {...form.register("injuriesNotes")}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Start training"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

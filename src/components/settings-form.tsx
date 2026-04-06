"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateProfileSettings } from "@/app/actions/profile";
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
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function SettingsForm({
  profile,
  templates,
}: {
  profile: Profile | null;
  templates: { id: string; name: string; days_per_week: number }[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">(profile?.weight_unit ?? "lb");
  const [programTemplateId, setProgramTemplateId] = useState(profile?.program_template_id ?? "");
  const [daysPerWeek, setDaysPerWeek] = useState(profile?.days_per_week ?? 4);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateProfileSettings({
        displayName: displayName.trim() || null,
        weightUnit,
        programTemplateId: programTemplateId || null,
        daysPerWeek,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight unit</Label>
            <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as "lb" | "kg")}>
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
            <Label>Program template</Label>
            <Select value={programTemplateId} onValueChange={setProgramTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d">Days per week (target)</Label>
            <Input
              id="d"
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

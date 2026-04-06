import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: templates } = await supabase
    .from("program_templates")
    .select("id, name, days_per_week")
    .order("sort_order");

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Program, units, and profile.</p>
      </div>
      <SettingsForm
        profile={profile}
        templates={templates ?? []}
      />
    </div>
  );
}

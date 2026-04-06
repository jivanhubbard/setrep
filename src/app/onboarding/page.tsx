import Link from "next/link";

import { OnboardingForm } from "@/components/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("program_templates")
    .select("id, name, slug, days_per_week, description")
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to Setrep</h1>
          <p className="text-muted-foreground text-sm">
            A quick situation report on your goals — we&apos;ll suggest a split you can change anytime.
          </p>
        </div>
        <OnboardingForm templates={templates ?? []} />
        <p className="text-center text-xs text-muted-foreground">
          Already set up?{" "}
          <Link href="/" className="underline underline-offset-2">
            Continue to app
          </Link>
        </p>
      </div>
    </div>
  );
}

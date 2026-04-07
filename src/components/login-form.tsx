"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ authError }: { authError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setStatus("loading");
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setSubmitError(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">Setrep</CardTitle>
          <CardDescription>
            Sign in with a magic link sent to your email. No password to remember.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError === "auth" && (
            <p className="text-sm text-destructive mb-4">Could not complete sign-in. Try again.</p>
          )}
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">
              Check <strong>{email}</strong> for your login link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Sending…" : "Send magic link"}
              </Button>
              {status === "error" && submitError && (
                <p className="text-sm text-destructive" role="alert">
                  {submitError}
                </p>
              )}
              {status === "error" && !submitError && (
                <p className="text-sm text-destructive">Something went wrong. Try again.</p>
              )}
            </form>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="underline underline-offset-2">
              Back to app
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

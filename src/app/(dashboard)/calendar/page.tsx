import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ym = monthParam ?? format(new Date(), "yyyy-MM");
  const monthStart = startOfMonth(parseISO(`${ym}-01T12:00:00.000Z`));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, title, performed_at")
    .eq("user_id", user.id)
    .gte("performed_at", gridStart.toISOString())
    .lte("performed_at", gridEnd.toISOString())
    .order("performed_at", { ascending: true });

  const byDay = new Map<string, { id: string; title: string }[]>();
  for (const s of sessions ?? []) {
    const key = s.performed_at.slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push({ id: s.id, title: s.title });
    byDay.set(key, list);
  }

  const prev = format(addMonths(monthStart, -1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">{format(monthStart, "MMMM yyyy")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?month=${prev}`}>Previous</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?month=${format(new Date(), "yyyy-MM")}`}>Today</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?month=${next}`}>Next</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Month view</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px rounded-lg border bg-border text-center text-xs font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="bg-card p-2">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const list = byDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthStart);
              return (
                <div
                  key={key}
                  className={`bg-card min-h-[88px] p-2 text-left align-top ${
                    inMonth ? "" : "opacity-40"
                  }`}
                >
                  <div className="text-xs font-medium text-foreground mb-1">{format(day, "d")}</div>
                  <ul className="space-y-1">
                    {list.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/workouts/${s.id}`}
                          className="block truncate rounded bg-secondary/60 px-1.5 py-0.5 text-[11px] hover:bg-secondary"
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

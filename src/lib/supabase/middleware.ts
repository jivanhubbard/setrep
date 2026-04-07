import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on each request. Runs on Vercel Edge — must not throw
 * or the whole site returns 500 (MIDDLEWARE_INVOCATION_FAILED).
 *
 * If env vars are missing, we pass the request through so you can still load the app
 * and see errors in layouts; auth will not work until Vercel env is fixed.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
    console.error(
      "[setrep] Middleware: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel (Settings → Environment Variables) for Production and Preview."
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getUser();
  } catch (err) {
    console.error("[setrep] Middleware session refresh failed:", err);
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

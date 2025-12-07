import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (!code) {
    return redirectTo(`/admin?error=${encodeURIComponent("Missing authorization code")}`);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    const message = error?.message ?? "Unable to complete Google sign-in.";
    return redirectTo(`/admin?error=${encodeURIComponent(message)}`);
  }

  (await cookies()).set(
    ADMIN_SESSION_COOKIE,
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      email: data.user?.email ?? "admin",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return redirectTo("/admin/bags");
}


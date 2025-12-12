import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
  const expiresAt = url.searchParams.get("expires_at");

  if (!accessToken) {
    return NextResponse.redirect(url.origin + "/admin?error=Missing access token");
  }

  (await cookies()).set(
    ADMIN_SESSION_COOKIE,
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      email: "Email",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return NextResponse.redirect(url.origin + "/admin/bags");
}

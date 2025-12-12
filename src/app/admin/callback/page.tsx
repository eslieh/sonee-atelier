"use client";

import { useEffect } from "react";

export default function AdminCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresAt = params.get("expires_at");

    if (!accessToken) {
      window.location.href = "/admin?error=Missing access token";
      return;
    }

    // Redirect to your server route with tokens
    const url = `/admin/callback/complete?access_token=${accessToken}&refresh_token=${refreshToken}&expires_at=${expiresAt}`;
    window.location.href = url;
  }, []);

  return <p>Authenticating...</p>;
}

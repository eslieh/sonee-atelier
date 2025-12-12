"use client";

import { useEffect } from "react";

export default function HashRedirect() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);

    if (hash) {
      // Convert hash (#...) into URL params (?...)
      const params = new URLSearchParams(hash);
      window.location.href = `/admin/callback?${params.toString()}`;
    }
  }, []);

  return null;
}

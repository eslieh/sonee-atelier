import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "sonie-admin-session";

type StoredAdminSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
};

export async function getStoredAdminSession(): Promise<StoredAdminSession | null> {
  const cookieStore = await cookies();
  const serialized = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(serialized) as StoredAdminSession;
  } catch {
    return null;
  }
}

export async function getAdminUser() {
  const session = await getStoredAdminSession();
  if (!session?.access_token) {
    return null;
  }

  const supabase = getSupabaseServerClient(session.access_token);
  const { data, error } = await supabase.auth.getUser(session.access_token);

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin");
  }

  return user;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}


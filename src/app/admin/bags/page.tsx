import { BagTable, type BagRecord } from "@/components/admin/BagTable";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function BagsPage() {
  await requireAdmin();

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("bags")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminDashboardLayout>
      <BagTable bags={(data ?? []) as BagRecord[]} />
    </AdminDashboardLayout>
  );
}


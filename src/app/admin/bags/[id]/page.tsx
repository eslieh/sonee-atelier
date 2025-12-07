import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditBagForm } from "@/components/admin/EditBagForm";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BagRecord } from "@/components/admin/BagTable";

import styles from "./page.module.css";

type BagDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BagDetailPage({ params }: BagDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const bagId = Number(id);
  if (Number.isNaN(bagId)) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bags")
    .select("*")
    .eq("id", bagId)
    .single();

  if (error || !data) {
    notFound();
  }

  // Transform the data to match BagRecord type
  const bag: BagRecord = {
    id: data.id,
    created_at: data.created_at,
    name: data.name,
    description: data.description,
    color: data.color,
    size: data.size,
    pricing: data.pricing,
    available: data.available,
    images: Array.isArray(data.images)
      ? data.images.map((img: any) => ({
          url: img.url,
          isDefault: img.isDefault ?? img.is_default ?? false,
          publicId: img.publicId ?? img.public_id,
        }))
      : null,
  };

  return (
    <AdminDashboardLayout>
      <div className={styles.canvas}>
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />
        <Link href="/admin/bags" className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} size={18} />
          <span>Back to Bags</span>
        </Link>
        <section className={styles.layout}>
          <div className={styles.copy}>
            <p className={styles.tag}>Inventory · Management</p>
            <h1>Manage your bag.</h1>
            <p>
              Update details, modify imagery, and control availability. Changes are saved instantly to your collection
              dashboard.
            </p>
          </div>
          <EditBagForm bag={bag} />
        </section>
      </div>
    </AdminDashboardLayout>
  );
}


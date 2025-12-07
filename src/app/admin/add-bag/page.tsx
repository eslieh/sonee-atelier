import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BagForm } from "@/components/admin/BagForm";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { requireAdmin } from "@/lib/auth";

import styles from "./add-bag.module.css";

export default async function AddBagPage() {
  await requireAdmin();

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
            <p className={styles.tag}>Inventory · Creation</p>
            <h1>Craft the next release.</h1>
            <p>
              Upload editorial shots, define sizing, and toggle availability from a single atelier panel. Once published,
              every silhouette flows into the collection dashboard instantly.
            </p>
          </div>
          <BagForm />
        </section>
      </div>
    </AdminDashboardLayout>
  );
}


import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";
import { WhatsAppNumberForm } from "@/components/admin/WhatsAppNumberForm";
import { requireAdmin, getAdminUser } from "@/lib/auth";
import { logoutAction, getSettings } from "@/app/admin/actions";

import styles from "./settings.module.css";

export default async function SettingsPage() {
  await requireAdmin();
  const user = await getAdminUser();
  const settings = await getSettings();

  return (
    <AdminDashboardLayout>
      <section className={styles.settings}>
        <header className={styles.header}>
          <div>
            <p className={styles.tag}>Account</p>
            <h1>Settings</h1>
            <p className={styles.subtitle}>Manage your account preferences and security settings.</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Account Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.label}>Email</label>
                <p className={styles.value}>{user?.email ?? "—"}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.label}>User ID</label>
                <p className={styles.value}>{user?.id ?? "—"}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.label}>Account Created</label>
                <p className={styles.value}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact Settings</h2>
            <WhatsAppNumberForm initialValue={settings?.whatsapp_number ?? null} />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Actions</h2>
            <form action={logoutAction} className={styles.logoutForm}>
              <button type="submit" className={styles.logoutButton}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </section>
    </AdminDashboardLayout>
  );
}


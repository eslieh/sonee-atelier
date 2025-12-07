import type { ReactNode } from "react";
import { AdminTabs } from "./AdminTabs";

import styles from "./AdminDashboardLayout.module.css";

type AdminDashboardLayoutProps = {
  children: ReactNode;
};

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  return (
    <div className={styles.container}>
      <AdminTabs />
      <div className={styles.content}>{children}</div>
    </div>
  );
}


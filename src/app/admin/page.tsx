import { AuthSwitcher } from "@/components/admin/AuthSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

import styles from "./admin.module.css";

type AdminLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const errorParam = params?.error;
  const modeParam = params?.mode;

  const error = typeof errorParam === "string" ? errorParam : undefined;
  const modeValue = typeof modeParam === "string" ? modeParam : Array.isArray(modeParam) ? modeParam[0] : undefined;
  const initialMode = modeValue === "signup" ? "signup" : "login";

  return (
    <div className={styles.canvas}>
      <div className={styles.utilities}>
        <ThemeToggle />
      </div>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />
      <section className={styles.panel}>
        <div className={styles.copy}>
          <p className={styles.tag}>Sonie Atelier · Admin</p>
          <h1 className={styles.heading}>Curate every bag with confidence.</h1>
          <p className={styles.body}>
            Sign in to the atelier console to launch new drops, track stock, and craft the next collection.
          </p>
        </div>
        <div className={styles.formStack}>
          <AuthSwitcher initialMode={initialMode} loginError={error} />
        </div>
      </section>
    </div>
  );
}


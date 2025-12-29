"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { SignupForm } from "@/components/admin/SignupForm";

import styles from "./AuthSwitcher.module.css";
type AuthSwitcherProps = {
  initialMode?: "login" | "signup";
  loginError?: string;
};

export function AuthSwitcher({ initialMode = "login", loginError }: AuthSwitcherProps) {
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  const [mode, setMode] = useState<"login" | "signup">(
    isProduction && initialMode === 'signup' ? 'login' : initialMode
  );

  // Ensure we don't show signup in production even if initialMode is signup
  useEffect(() => {
    if (isProduction && mode === 'signup') {
      setMode('login');
    }
  }, [isProduction, mode]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <motion.button
          type="button"
          className={clsx(styles.tab, mode === "login" && styles.active)}
          onClick={() => setMode("login")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogIn className={styles.tabIcon} size={16} />
          <span>Sign in</span>
        </motion.button>
        {!isProduction && (
          <motion.button
            type="button"
            className={clsx(styles.tab, mode === "signup" && styles.active)}
            onClick={() => setMode("signup")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className={styles.tabIcon} size={16} />
            <span>Create account</span>
          </motion.button>
        )}
      </div>

      <div className={styles.formSurface}>
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm initialServerError={loginError} />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <SignupForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


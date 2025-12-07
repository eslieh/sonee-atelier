"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let frame: number | null = null;

    const schedule = () => {
      frame = window.requestAnimationFrame(() => {
        const stored = window.localStorage.getItem("sonie-theme") as Theme | null;
        if (stored === "light" || stored === "dark") {
          setTheme(stored);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setTheme("dark");
        }
        setReady(true);
      });
    };

    schedule();

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sonie-theme", theme);
  }, [theme]);

  if (!ready) {
    return null;
  }

  const toggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label="Toggle theme">
      <motion.span
        className={styles.switch}
        animate={{ backgroundColor: theme === "light" ? "#f8c5e6" : "#1a0812" }}
      >
        <motion.span
          className={styles.knob}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ justifyContent: theme === "light" ? "flex-start" : "flex-end" }}
        >
          <span className={styles.icon}>{theme === "light" ? "☀️" : "🌙"}</span>
        </motion.span>
      </motion.span>
      <span className={styles.label}>{theme === "light" ? "Light" : "Dark"} mode</span>
    </button>
  );
}


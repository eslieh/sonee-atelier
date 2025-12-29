"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../app/page.module.css";

export default function InteractiveHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Parallax effect - content moves slower than scroll
  const parallaxY = scrollY * 0.5;
  const opacity = Math.max(0, 1 - scrollY / 600);

  return (
    <section className={styles.hero}>
      <div
        className={styles.heroContent}
        style={{
          transform: `translateY(${parallaxY}px)`,
          opacity: opacity,
        }}
      >
        <h1 className={styles.heroTitle}>Grip glamour, stride in couture.</h1>
        <p className={styles.heroSubtitle}>
          Luxury reimagined for the modern muse.
        </p>
        <Link href="#collection" className={styles.ctaButton}>
          Shop now
        </Link>
      </div>
      <div className={styles.heroVisual}>
        <div
          className={styles.heroCurve}
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            opacity: Math.max(0.2, 0.4 - scrollY / 800),
          }}
        />
      </div>
    </section>
  );
}


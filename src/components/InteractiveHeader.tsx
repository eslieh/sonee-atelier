"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../app/page.module.css";

export default function InteractiveHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      setIsScrolled(scrollPosition > 50);
    };

    // Throttle scroll events for better performance
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
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Calculate scale based on scroll (from 1 to 0.5)
  const scale = Math.max(0.5, 1 - scrollY / 500);
  // Calculate opacity for backdrop
  const backdropOpacity = Math.min(0.98, scrollY / 250);
  // Calculate translateY for floating effect with subtle bounce
  const translateY = isScrolled ? Math.min(10, scrollY / 25) : 0;
  // Calculate padding reduction
  const paddingReduction = isScrolled ? Math.min(1.25, scrollY / 250) : 0;
  // Calculate subtle rotation for bubbly effect
  const rotation = isScrolled ? Math.sin(scrollY / 100) * 0.5 : 0;
  // Calculate scale for header itself (slight shrink)
  const headerScale = isScrolled ? Math.max(0.95, 1 - scrollY / 1000) : 1;

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
      style={{
        transform: `translateY(${translateY}px) scale(${headerScale}) rotate(${rotation}deg)`,
        paddingTop: `${2 - paddingReduction}rem`,
        paddingBottom: `${2 - paddingReduction}rem`,
        background: `rgba(255, 255, 255, ${backdropOpacity})`,
        boxShadow: isScrolled
          ? `0 8px 32px rgba(0, 0, 0, ${Math.min(0.12, scrollY / 600)})`
          : "none",
        transformOrigin: "center top",
      }}
    >
      <div
        className={styles.logoContainer}
        style={{
          transform: `scale(${scale}) translateY(${isScrolled ? -3 : 0}px)`,
        }}
      >
        <Image
          src="/logo.png"
          alt="Sonie Atelier"
          width={500}
          height={60}
          priority
          className={styles.logo}
          style={{
            filter: isScrolled
              ? `drop-shadow(0 4px 12px rgba(0, 0, 0, ${Math.min(0.2, scrollY / 500)}))`
              : "none",
          }}
        />
      </div>
    </header>
  );
}


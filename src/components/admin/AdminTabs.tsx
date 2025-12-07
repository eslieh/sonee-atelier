"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ShoppingBag, Settings } from "lucide-react";

import styles from "./AdminTabs.module.css";

export function AdminTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/bags", label: "Bags", icon: ShoppingBag },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(styles.tab, isActive && styles.tabActive)}
          >
            <Icon className={styles.icon} size={20} />
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}


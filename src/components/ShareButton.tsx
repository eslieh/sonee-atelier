"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import styles from "./ShareButton.module.css";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButton({ url, title, description }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title,
      text: description || title,
      url,
    };

    // Try Web Share API first (mobile and modern browsers)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // User cancelled or error occurred, fall through to clipboard
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button onClick={handleShare} className={styles.shareButton} type="button">
      {copied ? (
        <>
          <Check size={18} className={styles.icon} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={18} className={styles.icon} />
          <span>Share</span>
        </>
      )}
    </button>
  );
}


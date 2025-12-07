"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./BagImageGallery.module.css";

export function BagImageGallery({ images, bagName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const allImages = images || [];
  const hasImages = allImages.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleNext = () => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    };

    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, allImages.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
  };

  if (!hasImages) {
    return <div className={styles.placeholderImage} />;
  }

  const heroImage = allImages.find((img) => img.isDefault) || allImages[0];
  const otherImages = allImages.filter((img) => img.url !== heroImage?.url);

  return (
    <>
      <div className={styles.gallery}>
        <div 
          className={styles.heroImageContainer}
          onClick={() => openLightbox(0)}
        >
          <Image
            src={heroImage.url}
            alt={bagName ?? "Bag"}
            fill
            className={styles.heroImage}
            priority
            unoptimized
          />
          <div className={styles.imageOverlay}>
            <span className={styles.viewText}>Click to view</span>
          </div>
        </div>
        {otherImages.length > 0 && (
          <div className={styles.imageThumbnails}>
            {otherImages.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className={styles.thumbnail}
                onClick={() => openLightbox(idx + 1)}
              >
                <Image
                  src={img.url}
                  alt={`${bagName ?? "Bag"} view ${idx + 2}`}
                  fill
                  className={styles.thumbnailImage}
                  unoptimized
                />
                <div className={styles.thumbnailOverlay} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isOpen && mounted && createPortal(
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button
            className={styles.closeButton}
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {allImages.length > 1 && (
              <button
                className={styles.navButton}
                onClick={handlePrevious}
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className={styles.lightboxImageContainer}>
              <Image
                src={allImages[currentIndex].url}
                alt={`${bagName ?? "Bag"} - Image ${currentIndex + 1}`}
                fill
                className={styles.lightboxImage}
                unoptimized
                priority
              />
            </div>
            {allImages.length > 1 && (
              <button
                className={styles.navButton}
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
          {allImages.length > 1 && (
            <div className={styles.imageCounter}>
              {currentIndex + 1} / {allImages.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}


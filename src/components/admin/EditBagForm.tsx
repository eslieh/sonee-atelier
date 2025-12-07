"use client";

import Image from "next/image";
import clsx from "clsx";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";

import { updateBagAction, deleteBagAction } from "@/app/admin/actions";
import type { BagRecord } from "./BagTable";

import styles from "./BagForm.module.css";

type UpdateBagState = {
  error?: string;
  success?: boolean;
};

type UploadItem = {
  id: string;
  file?: File;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  url?: string;
  publicId?: string;
  error?: string;
  isExisting?: boolean;
};

const initialState: UpdateBagState = {
  error: undefined,
  success: false,
};

const CLOUDINARY_FOLDER = "sonie-atelier/bags";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  return (
    <motion.button
      type="submit"
      className={styles.submitButton}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      disabled={isDisabled}
    >
      {pending ? "Saving changes..." : "Update bag"}
    </motion.button>
  );
}

type EditBagFormProps = {
  bag: BagRecord;
};

export function EditBagForm({ bag }: EditBagFormProps) {
  const router = useRouter();
  const updateAction = useCallback(
    (prevState: UpdateBagState, formData: FormData) => updateBagAction(bag.id, prevState, formData),
    [bag.id],
  );
  const [state, formAction] = useActionState(updateAction, initialState);
  const [uploads, setUploads] = useState<UploadItem[]>(() => {
    // Initialize with existing images
    if (bag.images && bag.images.length > 0) {
      return bag.images.map((img, index) => ({
        id: `existing-${index}`,
        previewUrl: img.url,
        status: "uploaded" as const,
        url: img.url,
        publicId: img.publicId ?? undefined,
        isExisting: true,
      }));
    }
    return [];
  });
  const [defaultIndex, setDefaultIndex] = useState(() => {
    // Find default image index
    if (bag.images && bag.images.length > 0) {
      const defaultIdx = bag.images.findIndex((img) => img.isDefault);
      return defaultIdx >= 0 ? defaultIdx : 0;
    }
    return 0;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uploadsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    if (state.success) {
      alert("Bag updated successfully!");
      router.push("/admin/bags");
    }
  }, [state.success, router]);

  // Clean up object URLs when component unmounts or uploads change
  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((item) => {
        if (item.file && item.previewUrl && !item.isExisting) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this bag? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteBagAction(bag.id);
      if (result.error) {
        alert(`Error deleting bag: ${result.error}`);
        setIsDeleting(false);
      } else {
        alert("Bag deleted successfully!");
        router.push("/admin/bags");
      }
    } catch (error) {
      alert(`Error deleting bag: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsDeleting(false);
    }
  }, [bag.id, router]);

  const startUpload = useCallback(async (id: string, file: File) => {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "uploading", error: undefined } : item)),
    );

    try {
      const signatureResponse = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: CLOUDINARY_FOLDER }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Unable to start Cloudinary upload.");
      }

      const signaturePayload = await signatureResponse.json();
      if (signaturePayload.error) {
        throw new Error(signaturePayload.error);
      }

      const { signature, timestamp, apiKey, cloudName, folder } = signaturePayload as {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder?: string;
      };

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", String(timestamp));
      uploadData.append("signature", signature);
      if (folder) {
        uploadData.append("folder", folder);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Upload failed.");
      }

      setUploads((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "uploaded",
                url: payload.secure_url ?? payload.url,
                publicId: payload.public_id,
                isExisting: false,
              }
            : item,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "error", error: message } : item)),
      );
    }
  }, []);

  const appendFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) {
        return;
      }

      const entries: UploadItem[] = incoming.map((file) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      }));

      setUploads((current) => [...current, ...entries]);
      entries.forEach((entry) => {
        if (entry.file) {
          startUpload(entry.id, entry.file);
        }
      });
    },
    [startUpload],
  );

  const handleFilesChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const selected = Array.from(event.target.files ?? []);
    appendFiles(selected);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDefaultChange = (index: number) => {
    if (!uploads[index] || uploads[index].status !== "uploaded") {
      return;
    }
    setDefaultIndex(index);
  };

  const handleImageClick = (index: number) => {
    if (uploads[index]?.status === "uploaded") {
      setPreviewIndex(index);
    }
  };

  const handleClosePreview = () => {
    setPreviewIndex(null);
  };

  const handleSetAsHero = (index: number) => {
    if (uploads[index]?.status === "uploaded") {
      setDefaultIndex(index);
      setPreviewIndex(null);
    }
  };

  const handlePrevImage = () => {
    if (previewIndex === null) return;
    const uploadedIndices = uploads
      .map((item, idx) => (item.status === "uploaded" ? idx : -1))
      .filter((idx) => idx !== -1);
    const currentPos = uploadedIndices.indexOf(previewIndex);
    const prevPos = currentPos > 0 ? currentPos - 1 : uploadedIndices.length - 1;
    setPreviewIndex(uploadedIndices[prevPos]);
  };

  const handleNextImage = () => {
    if (previewIndex === null) return;
    const uploadedIndices = uploads
      .map((item, idx) => (item.status === "uploaded" ? idx : -1))
      .filter((idx) => idx !== -1);
    const currentPos = uploadedIndices.indexOf(previewIndex);
    const nextPos = currentPos < uploadedIndices.length - 1 ? currentPos + 1 : 0;
    setPreviewIndex(uploadedIndices[nextPos]);
  };

  useEffect(() => {
    if (previewIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewIndex(null);
      } else if (e.key === "ArrowLeft") {
        const uploadedIndices = uploads
          .map((item, idx) => (item.status === "uploaded" ? idx : -1))
          .filter((idx) => idx !== -1);
        const currentPos = uploadedIndices.indexOf(previewIndex);
        const prevPos = currentPos > 0 ? currentPos - 1 : uploadedIndices.length - 1;
        setPreviewIndex(uploadedIndices[prevPos]);
      } else if (e.key === "ArrowRight") {
        const uploadedIndices = uploads
          .map((item, idx) => (item.status === "uploaded" ? idx : -1))
          .filter((idx) => idx !== -1);
        const currentPos = uploadedIndices.indexOf(previewIndex);
        const nextPos = currentPos < uploadedIndices.length - 1 ? currentPos + 1 : 0;
        setPreviewIndex(uploadedIndices[nextPos]);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, uploads]);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    appendFiles(droppedFiles);
  };

  const handleDropzoneKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleBrowseClick();
    }
  };

  const handleRemoveImage = (id: string, index: number) => {
    setUploads((current) => {
      const target = current.find((item) => item.id === id);
      if (target && target.file && target.previewUrl && !target.isExisting) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const next = current.filter((item) => item.id !== id);
      setDefaultIndex((prev) => {
        if (!next.length) return 0;
        if (prev === index) return 0;
        if (prev > index) return prev - 1;
        return prev;
      });
      return next;
    });
  };

  const uploadedImages = useMemo(
    () => uploads.filter((item) => item.status === "uploaded" && item.url),
    [uploads],
  );

  const imagesPayload = useMemo(() => {
    // Include all images (both existing and new) so removals are reflected
    if (uploadedImages.length === 0) return "";
    return JSON.stringify(
      uploadedImages.map((item) => ({
        url: item.url,
        publicId: item.publicId,
      })),
    );
  }, [uploadedImages]);

  const uploadsInFlight = uploads.some((item) => item.status === "uploading" || item.status === "pending");
  const canSubmit = uploadedImages.length > 0 && !uploadsInFlight;

  return (
    <section className={styles.formPanel}>
      <header>
        <p className={styles.tag}>Edit bag</p>
        <h2>Update {bag.name ?? "bag"}</h2>
        <p className={styles.copy}>
          Modify the silhouette details, pricing, and availability. Add new images or manage existing ones.
        </p>
      </header>

      <motion.form
        ref={formRef}
        action={formAction}
        className={styles.form}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <input type="hidden" name="defaultImageIndex" value={defaultIndex.toString()} />
        <input type="hidden" name="imagesPayload" value={imagesPayload} />

        <div className={styles.grid}>
          <label className={styles.label}>
            Name
            <input name="name" type="text" placeholder="The Atelier Weekender" defaultValue={bag.name ?? ""} required />
          </label>
          <label className={styles.label}>
            Color story
            <input name="color" type="text" placeholder="Rose Garnet" defaultValue={bag.color ?? ""} />
          </label>
          <label className={styles.label}>
            Size & fit
            <input name="size" type="text" placeholder="43 × 28 × 14 cm" defaultValue={bag.size ?? ""} />
          </label>
          <label className={styles.label}>
            Pricing (KES)
            <input
              name="pricing"
              type="number"
              step="0.01"
              min="0"
              placeholder="1250"
              defaultValue={bag.pricing ?? ""}
            />
          </label>
        </div>

        <label className={styles.label}>
          Description
          <textarea
            name="description"
            placeholder="Tell a story about craftsmanship, capacity, and styling."
            rows={4}
            defaultValue={bag.description ?? ""}
          />
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" name="available" defaultChecked={bag.available ?? false} />
          <span>Available for sale</span>
        </label>

        <div className={styles.mediaBlock}>
          <div className={styles.mediaHeader}>
            <div>
              <p className={styles.labelTitle}>Imagery</p>
              <p className={styles.labelSubtitle}>Upload new angles or manage existing images. Choose the hero image.</p>
            </div>
            <button type="button" className={styles.browseButton} onClick={handleBrowseClick}>
              Browse files
            </button>
          </div>
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
          />
          <div
            className={clsx(styles.dropzone, isDragging && styles.dropzoneActive)}
            role="button"
            tabIndex={0}
            onClick={handleBrowseClick}
            onKeyDown={handleDropzoneKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={styles.dropzoneIcon}>+</div>
            <div>
              <p className={styles.dropzoneTitle}>Drop imagery or paste captures</p>
              <p className={styles.dropzoneSubtitle}>
                Unlimited uploads · JPG / PNG / WEBP · Select one hero image afterward
              </p>
            </div>
            <span className={styles.dropzoneCta}>Add imagery</span>
          </div>
          {uploads.length > 0 ? (
            <div className={styles.previews}>
              {uploads.map((item, index) => {
                const badgeLabel =
                  item.status === "uploaded"
                    ? index === defaultIndex
                      ? "Hero shot"
                      : "Alt view"
                    : item.status === "uploading"
                      ? "Uploading"
                      : item.status === "error"
                        ? "Upload failed"
                        : "Queued";
                const badgeClass = clsx(styles.previewBadge, {
                  [styles.previewBadgeUploading]: item.status === "uploading",
                  [styles.previewBadgeError]: item.status === "error",
                });

                return (
                  <label key={item.id} className={styles.previewCard}>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleRemoveImage(item.id, index);
                      }}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                    <input
                      type="radio"
                      name="defaultPreview"
                      checked={index === defaultIndex}
                      disabled={item.status !== "uploaded"}
                      onChange={() => handleDefaultChange(index)}
                      aria-label={`Set image ${index + 1} as hero`}
                    />
                    <span className={badgeClass}>{badgeLabel}</span>
                    <div
                      className={styles.previewImageWrapper}
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.status === "uploaded") {
                          handleImageClick(index);
                        }
                      }}
                      style={{ cursor: item.status === "uploaded" ? "pointer" : "default" }}
                    >
                      <Image
                        src={item.previewUrl}
                        alt="Bag preview"
                        className={styles.previewImage}
                        width={320}
                        height={220}
                        unoptimized
                      />
                    </div>
                    {item.status !== "uploaded" ? (
                      <div className={styles.previewOverlay}>
                        {item.status === "uploading" ? (
                          <span className={styles.loader} aria-label="Uploading" />
                        ) : (
                          <span>{item.error ?? "Waiting to upload"}</span>
                        )}
                      </div>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Drag and drop editorial shots or tap "Add imagery" to open your library. Hero image selection happens
              below.
            </p>
          )}
        </div>

        {!uploadedImages.length ? <p className={styles.hint}>Upload at least one image to publish.</p> : null}
        {uploadsInFlight ? <p className={styles.hint}>Hang tight while we finish uploading to Cloudinary.</p> : null}
        {state.error ? <p className={styles.error}>{state.error}</p> : null}

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <SubmitButton disabled={!canSubmit} />
          <motion.button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            style={{
              padding: "0.9rem 1.8rem",
              borderRadius: "999px",
              border: "1px solid var(--panel-border)",
              background: "transparent",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete bag"}
          </motion.button>
        </div>
      </motion.form>

      {/* Image Preview Modal */}
      {previewIndex !== null && uploads[previewIndex]?.status === "uploaded" && (
        <div className={styles.modalOverlay} onClick={handleClosePreview}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={handleClosePreview}
              aria-label="Close preview"
            >
              ×
            </button>
            <div className={styles.modalImageContainer}>
              <Image
                src={uploads[previewIndex].previewUrl}
                alt={`Preview ${previewIndex + 1}`}
                fill
                className={styles.modalImage}
                unoptimized
                priority
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalNavButton}
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.modalHeroButton}
                onClick={() => handleSetAsHero(previewIndex)}
                disabled={previewIndex === defaultIndex}
              >
                {previewIndex === defaultIndex ? "✓ Hero Image" : "Set as Hero"}
              </button>
              <button
                type="button"
                className={styles.modalNavButton}
                onClick={handleNextImage}
                aria-label="Next image"
              >
                →
              </button>
            </div>
            <div className={styles.modalInfo}>
              <span>Image {previewIndex + 1} of {uploadedImages.length}</span>
              {previewIndex === defaultIndex && <span className={styles.heroBadge}>Hero Image</span>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


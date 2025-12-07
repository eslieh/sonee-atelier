"use client";

import Image from "next/image";
import clsx from "clsx";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";

import { createBagAction } from "@/app/admin/actions";

import styles from "./BagForm.module.css";

type CreateBagState = {
  error?: string;
  success?: boolean;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  url?: string;
  publicId?: string;
  error?: string;
};

const initialState: CreateBagState = {
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
      {pending ? "Saving bag..." : "Publish bag"}
    </motion.button>
  );
}

export function BagForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createBagAction, initialState);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uploadsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    if (state.success) {
      // Show success alert and redirect
      alert('Bag created successfully!');
      router.push('/admin/bags');
    }
  }, [state.success, router]);

  // Clean up object URLs when component unmounts or uploads change
  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

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
      entries.forEach((entry) => startUpload(entry.id, entry.file));
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
      if (target) {
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
    () => uploads.filter((item) => item.status === "uploaded" && item.url && item.publicId),
    [uploads],
  );

  const imagesPayload = useMemo(
    () => JSON.stringify(uploadedImages.map((item) => ({ url: item.url, publicId: item.publicId }))),
    [uploadedImages],
  );

  const uploadsInFlight = uploads.some((item) => item.status === "uploading" || item.status === "pending");
  const canSubmit = uploadedImages.length > 0 && !uploadsInFlight;

  return (
    <section className={styles.formPanel}>
      <header>
        <p className={styles.tag}>New bag</p>
        <h2>Create a centerpiece</h2>
        <p className={styles.copy}>
          Describe the silhouette, pricing, and mood. Add as many images as you like, then choose one hero shot to lead
          the collection page.
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
            <input name="name" type="text" placeholder="The Atelier Weekender" required />
          </label>
          <label className={styles.label}>
            Color story
            <input name="color" type="text" placeholder="Rose Garnet" />
          </label>
          <label className={styles.label}>
            Size & fit
            <input name="size" type="text" placeholder="43 × 28 × 14 cm" />
          </label>
          <label className={styles.label}>
            Pricing (KES)
            <input name="pricing" type="number" step="0.01" min="0" placeholder="1250" />
          </label>
        </div>

        <label className={styles.label}>
          Description
          <textarea name="description" placeholder="Tell a story about craftsmanship, capacity, and styling." rows={4} />
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" name="available" />
          <span>Available for sale</span>
        </label>

        <div className={styles.mediaBlock}>
          <div className={styles.mediaHeader}>
            <div>
              <p className={styles.labelTitle}>Imagery</p>
              <p className={styles.labelSubtitle}>Upload multiple angles, then choose the hero image.</p>
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
                    <Image
                      src={item.previewUrl}
                      alt="Bag preview"
                      className={styles.previewImage}
                      width={320}
                      height={220}
                      unoptimized
                    />
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
              Drag and drop editorial shots or tap “Add imagery” to open your library. Hero image selection happens
              below.
            </p>
          )}
        </div>

        {!uploadedImages.length ? <p className={styles.hint}>Upload at least one image to publish.</p> : null}
        {uploadsInFlight ? <p className={styles.hint}>Hang tight while we finish uploading to Cloudinary.</p> : null}
        {state.error ? <p className={styles.error}>{state.error}</p> : null}

        <SubmitButton disabled={!canSubmit} />
      </motion.form>
    </section>
  );
}


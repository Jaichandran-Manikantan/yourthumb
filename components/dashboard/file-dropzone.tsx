"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus, AlertCircle, X, Loader2 } from "lucide-react";
import {
  uploadFileToStorage,
  removeFileFromStorage,
  validateImageFile,
  type UploadResult,
} from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

export type UploadedFile = UploadResult & { preview?: string };

type FileDropzoneProps = {
  maxFiles: number;
  bucket: string;
  pathPrefix?: string;
  files: Array<UploadedFile | null>;
  onFilesChange: (files: Array<UploadedFile | null>, changedIndices?: number[]) => void | Promise<void>;
  label?: ReactNode;
  hint?: ReactNode;
  variant?: "area" | "slots";
  slotLabels?: string[];
  dropTitle?: string;
  className?: string;
  previewClassName?: string;
  onUploadsActiveChange?: (active: boolean) => void;
};

function UploadProgressIndicator() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div
        className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-[2px]"
        role="progressbar"
        aria-label="Uploading image"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Loader2 className="size-5 animate-spin text-white" />
      </div>
      <span className="text-[11px] font-medium tracking-wide text-white drop-shadow animate-pulse">
        Uploading...
      </span>
    </div>
  );
}

function DropSurface({
  dragOver,
  uploading,
  title,
  subtitle,
  compact,
}: {
  dragOver: boolean;
  uploading: boolean;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-3 text-center transition-colors",
        compact ? "aspect-video min-h-0 py-0" : "min-h-44 py-10",
        dragOver
          ? "border-red-500 bg-red-50 dark:bg-red-950/40"
          : "border-zinc-300 bg-zinc-50/70 hover:border-red-300 dark:border-zinc-700 dark:bg-zinc-900/50"
      )}
    >
      {uploading ? (
        <UploadProgressIndicator />
      ) : (
        <>
          <ImagePlus className="size-6 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-500">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function FileDropzone({
  maxFiles,
  bucket,
  pathPrefix,
  files,
  onFilesChange,
  label,
  hint,
  variant = "area",
  slotLabels,
  dropTitle,
  className,
  previewClassName,
  onUploadsActiveChange,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const slotIndexRef = useRef<number | null>(null);
  const filesRef = useRef(files);
  const activeUploadsRef = useRef(0);
  const uploadingAreaIndicesRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    // While uploads are in flight, `filesRef` is the authoritative snapshot.
    // React parent props can temporarily lag behind optimistic local updates,
    // so blindly copying `files` here can resurrect a stale snapshot and erase
    // another upload that is still running. Once all uploads finish, the
    // parent state is safe to synchronize back into the ref.
    if (activeUploadsRef.current > 0) return;
    filesRef.current = files;
  }, [files]);

  const beginUploads = useCallback((count: number) => {
    if (count <= 0) return;
    activeUploadsRef.current += count;
    onUploadsActiveChange?.(true);
  }, [onUploadsActiveChange]);

  const endUpload = useCallback(() => {
    activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1);
    if (activeUploadsRef.current === 0) {
      onUploadsActiveChange?.(false);
    }
  }, [onUploadsActiveChange]);

  // Keep the local snapshot synchronous. Parallel upload completions can
  // otherwise each read the same stale React-rendered `files` value and one
  // completion can overwrite another before the next render commits.
  const emitFilesChange = useCallback(
    (nextFiles: Array<UploadedFile | null>, changedIndices?: number[]) => {
      filesRef.current = nextFiles;
      return onFilesChange(nextFiles, changedIndices);
    },
    [onFilesChange]
  );

  const [dragOver, setDragOver] = useState(false);
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const uploadingSlotsRef = useRef<Record<number, boolean>>({});
  const [uploadingAreaIndices, setUploadingAreaIndices] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [optimisticRemoving, setOptimisticRemoving] = useState<Record<number, boolean>>({});

  const remaining = maxFiles - files.filter(Boolean).length;

  const setSlotUploading = useCallback((slot: number, active: boolean) => {
    const next = { ...uploadingSlotsRef.current };
    if (active) {
      next[slot] = true;
    } else {
      delete next[slot];
    }
    uploadingSlotsRef.current = next;
    setUploadingSlots(next);
  }, []);


  const processFiles = useCallback(
    async (incoming: FileList | File[], startSlotIndex?: number) => {
      setError(null);

      const rawList = Array.from(incoming);
      if (rawList.length === 0) return;

      const validFiles: File[] = [];
      for (const file of rawList) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      if (variant === "slots") {
        let targetSlots: number[] = [];

        if (validFiles.length === 1 && startSlotIndex !== undefined) {
          if (uploadingSlotsRef.current[startSlotIndex]) {
            setError("Please wait for the current upload in this slot to finish.");
            return;
          }
          targetSlots = [startSlotIndex];
        } else if (startSlotIndex !== undefined) {
          let curr = startSlotIndex;
          while (curr < maxFiles && targetSlots.length < validFiles.length) {
            if (!uploadingSlotsRef.current[curr]) {
              targetSlots.push(curr);
            }
            curr++;
          }
          for (let i = 0; i < maxFiles && targetSlots.length < validFiles.length; i++) {
            if (!targetSlots.includes(i) && !uploadingSlotsRef.current[i]) {
              targetSlots.push(i);
            }
          }
        } else {
          for (let i = 0; i < maxFiles && targetSlots.length < validFiles.length; i++) {
            if (!filesRef.current[i] && !uploadingSlotsRef.current[i]) {
              targetSlots.push(i);
            }
          }
          for (let i = 0; i < maxFiles && targetSlots.length < validFiles.length; i++) {
            if (!targetSlots.includes(i) && !uploadingSlotsRef.current[i]) {
              targetSlots.push(i);
            }
          }
        }

        const filesToUpload = validFiles.slice(0, targetSlots.length);
        if (filesToUpload.length === 0) return;

        const currentFilesState = Array.from(
          { length: Math.max(maxFiles, filesRef.current.length) },
          (_, i) => filesRef.current[i] ?? null
        );

        const slotBlobs: Record<number, string> = {};

        filesToUpload.forEach((file, idx) => {
          const slot = targetSlots[idx];
          const blobUrl = URL.createObjectURL(file);
          slotBlobs[slot] = blobUrl;
          currentFilesState[slot] = {
            url: "",
            path: "",
            preview: blobUrl,
          };
        });

        emitFilesChange(currentFilesState);

        targetSlots.forEach((slot) => setSlotUploading(slot, true));
        beginUploads(filesToUpload.length);

        await Promise.allSettled(
          filesToUpload.map(async (file, idx) => {
            const slot = targetSlots[idx];
            try {
              const res = await uploadFileToStorage(file, bucket, pathPrefix);

              
              if (slotBlobs[slot]) {
                URL.revokeObjectURL(slotBlobs[slot]);
              }

              const updatedState = Array.from(
                { length: Math.max(maxFiles, filesRef.current.length) },
                (_, i) => filesRef.current[i] ?? null
              );

              updatedState[slot] = {
                ...res,
                preview: res.url,
              };

              emitFilesChange(updatedState, [slot]);
            } catch (uploadErr) {
              setError(
                uploadErr instanceof Error
                  ? uploadErr.message
                  : `Failed to upload image for slot ${slot + 1}`
              );

              const revertedState = Array.from(
                { length: Math.max(maxFiles, filesRef.current.length) },
                (_, i) => filesRef.current[i] ?? null
              );
              revertedState[slot] = null;
              emitFilesChange(revertedState, [slot]);
            } finally {
              setSlotUploading(slot, false);
              endUpload();
            }
          })
        );
      } else {
        // Area upload mode with parallel processing support.
        // Reserve stable indices before starting any network requests so
        // concurrent completions can never shift another upload's position.
        const currentLength = Math.max(maxFiles, filesRef.current.length);
        const targetIndices: number[] = [];
        const nextUploading = uploadingAreaIndicesRef.current;

        for (let i = 0; i < currentLength && targetIndices.length < validFiles.length; i++) {
          if (!filesRef.current[i] && !nextUploading[i]) {
            targetIndices.push(i);
          }
        }

        const filesToUpload = validFiles.slice(0, targetIndices.length);
        if (filesToUpload.length === 0) return;

        const reservedState = Array.from(
          { length: Math.max(currentLength, ...targetIndices.map((index) => index + 1)) },
          (_, i) => filesRef.current[i] ?? null
        );
        const localPreviews: Record<number, string> = {};

        filesToUpload.forEach((file, idx) => {
          const targetIndex = targetIndices[idx];
          const preview = URL.createObjectURL(file);
          localPreviews[targetIndex] = preview;
          reservedState[targetIndex] = {
            url: "",
            path: "",
            preview,
          };
          uploadingAreaIndicesRef.current[targetIndex] = true;
        });

        emitFilesChange(reservedState);
        setUploadingAreaIndices({ ...uploadingAreaIndicesRef.current });
        beginUploads(filesToUpload.length);

        await Promise.allSettled(
          filesToUpload.map(async (file, idx) => {
            const targetIndex = targetIndices[idx];
            try {
              const res = await uploadFileToStorage(file, bucket, pathPrefix);
              const currentState = Array.from(
                { length: Math.max(filesRef.current.length, targetIndex + 1) },
                (_, i) => filesRef.current[i] ?? null
              );

              if (localPreviews[targetIndex]) {
                URL.revokeObjectURL(localPreviews[targetIndex]);
              }

              currentState[targetIndex] = {
                ...res,
                preview: res.url,
              };

              emitFilesChange(currentState, [targetIndex]);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");

              const currentState = Array.from(
                { length: Math.max(filesRef.current.length, targetIndex + 1) },
                (_, i) => filesRef.current[i] ?? null
              );
              currentState[targetIndex] = null;
              // Keep the other concurrent uploads in their reserved positions.
              // Never compact with filter(Boolean) while sibling uploads are alive.
              emitFilesChange(currentState, [targetIndex]);
            } finally {
              delete uploadingAreaIndicesRef.current[targetIndex];
              setUploadingAreaIndices({ ...uploadingAreaIndicesRef.current });
              endUpload();
            }
          })
        );
      }
    },
    [
      bucket,
      pathPrefix,
      emitFilesChange,
      maxFiles,
      variant,
      setSlotUploading,
      beginUploads,
      endUpload,
    ]
  );

  async function handleRemove(index: number) {
    const currentFiles = Array.from(
      { length: filesRef.current.length },
      (_, i) => filesRef.current[i] ?? null
    );
    const file = currentFiles[index];
    if (!file) return;

    const next = [...currentFiles];
    next[index] = null;
    const nextFiles = variant === "slots" ? next : next.filter(Boolean);

    // Hide the item locally before starting any parent persistence work. This
    // guarantees the click-to-disappear path is identical even when the parent
    // callback performs asynchronous persistence (notably reference slots).
    setOptimisticRemoving((prev) => ({ ...prev, [index]: true }));

    // Remove optimistically so every uploader has the same instant-delete UX
    // as the foundational-frame uploader. The parent persistence call can be
    // asynchronous, but the local UI should not wait for it.
    const persistence = emitFilesChange(nextFiles, [index]);

    try {
      await persistence;
    } catch (persistError) {
      // Restore the previous UI state if the durable update fails.
      setOptimisticRemoving((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      emitFilesChange(currentFiles, [index]);
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Could not save the removed image"
      );
      return;
    }

    // Delete the old Storage object only after its durable pointer has been
    // removed. Storage cleanup is best-effort once the DB state is safe.
    setOptimisticRemoving((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    try {
      if (file.path) {
        await removeFileFromStorage(bucket, file.path);
      }
    } catch {
      // Storage removal is best-effort after the durable pointer is gone.
    }
  }

  function openPicker(slotIndex?: number) {
    slotIndexRef.current = slotIndex ?? null;
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  const slots =
    slotLabels ??
    Array.from({ length: maxFiles }, (_, i) => `Slot ${i + 1}`);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {label}
        </div>
      )}

      {hint && (
        <div className="text-xs text-zinc-500">
          {hint}
        </div>
      )}

      {variant === "slots" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {slots.slice(0, maxFiles).map((slotLabel, i) => {
            const file = files[i];
            const isSlotUploading = Boolean(uploadingSlots[i]);
            const isOptimisticallyRemoving = Boolean(optimisticRemoving[i]);
            const imageSrc = file ? file.preview || file.url : null;

            return (
              <div
                key={slotLabel}
                className="flex flex-col gap-1.5"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragSlot(i);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragSlot(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragSlot(null);
                  if (isSlotUploading || uploadingSlotsRef.current[i]) {
                    setError("Please wait for the current upload in this slot to finish.");
                    return;
                  }
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    void processFiles(e.dataTransfer.files, i);
                  }
                }}
              >
                <p className="flex min-h-8 items-end text-xs font-medium text-zinc-500">
                  {slotLabel}
                </p>

                {imageSrc && !isOptimisticallyRemoving ? (
                  <div className="group relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    <img
                      src={imageSrc}
                      alt={slotLabel}
                      className={cn(
                        "size-full object-cover transition-opacity",
                        isSlotUploading && "opacity-40"
                      )}
                    />

                    {isSlotUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[2px]">
                        <UploadProgressIndicator />
                      </div>
                    )}

                    {!isSlotUploading && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90"
                        onClick={() => handleRemove(i)}
                        aria-label={`Remove ${slotLabel}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSlotUploading}
                    onClick={() => openPicker(i)}
                    className="w-full text-left"
                  >
                    <DropSurface
                      compact
                      dragOver={dragSlot === i}
                      uploading={isSlotUploading}
                      title="Drop image"
                      subtitle="PNG, JPG, WEBP"
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {files.some(Boolean) && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => {
                if (!f) return null;
                const src = f.preview || f.url;
                const isUploadingThisItem = Boolean(uploadingAreaIndices[i]);
                const isOptimisticallyRemoving = Boolean(optimisticRemoving[i]);

                return src && !isOptimisticallyRemoving ? (
                  <div
                    key={f.path || i}
                    className={cn(
                      "group relative size-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900",
                      previewClassName
                    )}
                  >
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      className={cn(
                        "size-full object-cover transition-opacity",
                        isUploadingThisItem && "opacity-40"
                      )}
                    />

                    {isUploadingThisItem && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[2px]">
                        <UploadProgressIndicator />
                      </div>
                    )}

                    {!isUploadingThisItem && (
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleRemove(i)}
                        aria-label="Remove image"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          )}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => openPicker()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  void processFiles(e.dataTransfer.files);
                }
              }}
              disabled={Object.keys(uploadingAreaIndices).length > 0}
              className="w-full"
            >
              <DropSurface
                dragOver={dragOver}
                uploading={Object.keys(uploadingAreaIndices).length > 0}
                title={dropTitle ?? "Drag & drop or click to upload"}
                subtitle={`PNG, JPG, WEBP · ${remaining} remaining`}
              />
            </button>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const slot = slotIndexRef.current;
            void processFiles(e.target.files, slot !== null ? slot : undefined);
          }
          e.target.value = "";
          slotIndexRef.current = null;
        }}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";
import {
  isDisplayableImageSrc,
  processUploadedImageFile,
} from "@/lib/image-upload";

/**
 * Left-aligned optional drag-and-drop / file-picker image uploader for a voting option.
 */
export function OptionImageUpload({
  label,
  value,
  onChange,
  optionLabel,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  optionLabel: string;
}) {
  const { t } = useLanguage();
  const vt = t.admin.voting;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const hasPreview = isDisplayableImageSrc(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    setProcessing(true);
    try {
      const dataUrl = await processUploadedImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "TOO_LARGE") {
        setLocalError(vt.optionImageFileTooLarge);
      } else if (code === "INVALID_TYPE") {
        setLocalError(vt.optionImageInvalidType);
      } else {
        setLocalError(vt.optionImageProcessingError);
      }
    } finally {
      setProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0]);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="w-full space-y-2 sm:w-44 sm:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-parchment-200">{label}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileInputChange}
        className="sr-only"
        aria-label={label}
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cx(
          "group relative flex h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden border transition-colors",
          hasPreview ? "border-solid" : "border-dashed",
          dragging
            ? "border-gold-300 bg-gold-500/10"
            : localError
              ? "border-blood-500 bg-canvas-surface"
              : hasPreview
                ? "border-gold-sovereign/60 bg-canvas-surface hover:border-gold-300"
                : "border-canvas-border bg-canvas-surface/80 hover:border-gold-sovereign/70",
        )}
      >
        {hasPreview ? (
          <>
            <img
              src={value.trim()}
              alt={optionLabel || vt.optionImagePreviewAlt}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-obsidian-950/80 px-2 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
              {vt.optionImageChangeBtn}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-3 text-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7 text-gold-400/75 transition-colors group-hover:text-gold-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-wider text-gold-300/90">
              {vt.optionImageOptionalBadge}
            </span>
            <p className="text-[11px] leading-snug text-stone-300">
              {vt.optionImageDropHint}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 flex-1 border border-[#8c6239] bg-canvas-surface px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-gold-300 transition-colors hover:border-gold-300 hover:bg-canvas-subtle disabled:opacity-50"
        >
          {processing
            ? t.common.loading
            : hasPreview
              ? vt.optionImageChangeBtn
              : vt.optionImageBrowseBtn}
        </button>

        {value ? (
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onChange("");
            }}
            className="min-h-11 border border-red-900/60 bg-canvas-surface px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
          >
            {vt.optionImageRemoveBtn}
          </button>
        ) : null}
      </div>

      {localError ? (
        <p role="alert" className="text-xs leading-snug text-blood-300">
          {localError}
        </p>
      ) : (
        <p className="text-[11px] leading-snug text-stone-400">
          {vt.optionImageFormatsHint}
        </p>
      )}
    </div>
  );
}


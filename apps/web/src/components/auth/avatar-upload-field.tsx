"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cx } from "@/lib/cx";
import { useLanguage } from "@/lib/i18n";
import {
  isDisplayableImageSrc,
  processUploadedImageFile,
} from "@/lib/image-upload";

export function AvatarUploadField({
  value,
  googleDefaultUrl,
  onChange,
  error,
}: {
  value: string;
  googleDefaultUrl?: string;
  onChange: (nextValue: string) => void;
  error?: string;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const displayError = error ?? localError;
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
        setLocalError(t.auth.onboarding.avatarFileTooLarge);
      } else if (code === "INVALID_TYPE") {
        setLocalError(t.auth.onboarding.avatarInvalidType);
      } else {
        setLocalError(t.auth.onboarding.avatarProcessingError);
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
    <div className="space-y-2">
      <label className="block font-display text-[11px] font-bold uppercase tracking-widest text-gold-300">
        {t.auth.onboarding.avatarUploadLabel}
      </label>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cx(
          "flex flex-col gap-3 border border-dashed p-3.5 transition-colors sm:flex-row sm:items-center",
          dragging
            ? "border-gold-300 bg-gold-500/10"
            : displayError
              ? "border-blood-500 bg-canvas-base"
              : "border-gold-sovereign/40 bg-canvas-base/80 hover:border-gold-300/70",
        )}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-gold-sovereign/50 bg-canvas-surface">
          {hasPreview ? (
            <img
              src={value.trim()}
              alt={t.auth.onboarding.avatarPreviewAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-lg text-gold-400/60">DH</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs leading-relaxed text-stone-300">
            {t.auth.onboarding.avatarDropHint}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onFileInputChange}
            className="sr-only"
            aria-label={t.auth.onboarding.avatarUploadLabel}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
              className="min-h-9 border border-[#8c6239] bg-canvas-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-gold-300 transition-colors hover:border-gold-300 hover:bg-canvas-subtle disabled:opacity-50"
            >
              {processing ? t.common.loading : t.auth.onboarding.avatarBrowseBtn}
            </button>

            {value ? (
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onChange("");
                }}
                className="min-h-9 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-stone-400 underline underline-offset-4 hover:text-parchment-50"
              >
                {t.auth.onboarding.avatarRemove}
              </button>
            ) : null}

            {googleDefaultUrl && value !== googleDefaultUrl ? (
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onChange(googleDefaultUrl);
                }}
                className="min-h-9 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-gold-300/80 underline underline-offset-4 hover:text-gold-300"
              >
                {t.auth.onboarding.avatarUseGoogle}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {displayError ? (
        <p role="alert" className="text-xs text-blood-300">
          {displayError}
        </p>
      ) : (
        <p className="text-xs text-stone-400">
          {t.auth.onboarding.avatarFormatsHint}
        </p>
      )}
    </div>
  );
}


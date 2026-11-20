"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { uploadCat } from "@/lib/api-client";
import { prepareImage } from "@/lib/prepare-image";
import { MAX_CAPTION_LENGTH, MAX_UPLOAD_BYTES } from "@/lib/storage";
import type { CatImage } from "@/lib/types";
import { Modal } from "./modal";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (cat: CatImage) => void;
}

export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  const [selection, setSelection] = useState<{ file: File; previewUrl: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputId = useId();
  const captionId = useId();

  const file = selection?.file ?? null;

  useEffect(() => {
    if (!selection) return;
    return () => URL.revokeObjectURL(selection.previewUrl);
  }, [selection]);

  const reset = () => {
    setSelection(null);
    setCaption("");
    setDragging(false);
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const pickFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) {
      toast.error("That doesn't look like a photo.");
      return;
    }
    setSelection({ file: candidate, previewUrl: URL.createObjectURL(candidate) });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const prepared = await prepareImage(file);
      if (prepared.blob.size > MAX_UPLOAD_BYTES) throw new Error("That photo is too big, even after resizing.");
      const cat = await uploadCat(prepared.blob, prepared.fileName, caption);
      onUploaded(cat);
      toast.success("New cat added to the scrapbook 🐾");
      reset();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a cat"
      busy={uploading}
      footer={
        <>
          <button type="button" className="btn btn-quiet" onClick={close} disabled={uploading}>
            Cancel
          </button>
          <button type="submit" form={`${inputId}-form`} className="btn btn-primary" disabled={!file || uploading}>
            {uploading ? "Uploading…" : "Add to the scrapbook"}
          </button>
        </>
      }
    >
      <form id={`${inputId}-form`} onSubmit={submit} className="space-y-5">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pickFile(event.dataTransfer.files[0]);
          }}
          className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
            dragging ? "border-tangerine bg-tangerine-soft" : "border-ink/40 bg-paper hover:border-tangerine"
          }`}
        >
          {selection ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: previews can't go through next/image */}
              <img src={selection.previewUrl} alt="Preview of the selected photo" className="max-h-64 rounded-lg object-contain shadow-photo" />
              <span className="max-w-full truncate text-sm text-ink-soft">{selection.file.name} · tap to change</span>
            </>
          ) : (
            <>
              <span className="grid size-14 place-items-center rounded-full border-2 border-ink bg-card text-3xl shadow-hard-sm transition-transform group-hover:-rotate-6">
                📸
              </span>
              <span className="font-display text-lg font-bold">Drop a photo here</span>
              <span className="text-sm text-ink-soft">or tap to choose one. Location data is removed automatically.</span>
            </>
          )}
        </label>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={captionId} className="label">
              Caption
            </label>
            <span className={`text-xs tabular-nums ${caption.length > MAX_CAPTION_LENGTH - 20 ? "text-tangerine" : "text-ink-soft"}`}>
              {caption.length}/{MAX_CAPTION_LENGTH}
            </span>
          </div>
          <textarea
            id={captionId}
            rows={2}
            maxLength={MAX_CAPTION_LENGTH}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="who's this little guy?"
            className="field resize-none font-hand text-2xl leading-tight"
          />
        </div>
      </form>
    </Modal>
  );
}

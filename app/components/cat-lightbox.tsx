"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { toast } from "sonner";
import { updateCaption } from "@/lib/api-client";
import { MAX_CAPTION_LENGTH } from "@/lib/storage";
import type { CatImage } from "@/lib/types";

interface CatLightboxProps {
  cats: CatImage[];
  index: number | null;
  isAdmin: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onNearEnd: () => void;
  onCaptionSaved: (key: string, caption: string) => void;
  onRequestDelete: (cat: CatImage) => void;
}

export function CatLightbox({
  cats,
  index,
  isAdmin,
  onIndexChange,
  onClose,
  onNearEnd,
  onCaptionSaved,
  onRequestDelete,
}: CatLightboxProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = index === null ? undefined : cats[index];

  const save = async () => {
    if (!current || draft === null) return;
    setSaving(true);
    try {
      const caption = draft.trim();
      await updateCaption(current.key, caption);
      onCaptionSaved(current.key, caption);
      setDraft(null);
      toast.success("Caption saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the caption.");
    } finally {
      setSaving(false);
    }
  };

  const adminButtons = isAdmin
    ? [
        <button
          key="edit"
          type="button"
          className="yarl__button font-sans text-sm font-bold"
          onClick={() => setDraft(current?.caption ?? "")}
        >
          Edit caption
        </button>,
        <button
          key="delete"
          type="button"
          className="yarl__button font-sans text-sm font-bold"
          onClick={() => current && onRequestDelete(current)}
        >
          Delete
        </button>,
      ]
    : [];

  return (
    <Lightbox
      open={index !== null}
      index={index ?? 0}
      close={() => {
        setDraft(null);
        onClose();
      }}
      slides={cats.map((cat) => ({ src: cat.url, alt: cat.caption || "A cat photo", description: cat.caption }))}
      plugins={[Captions, Counter]}
      carousel={{ finite: true }}
      captions={{ descriptionTextAlign: "center", descriptionMaxLines: 4 }}
      counter={{ container: { style: { top: 0, bottom: "unset" } } }}
      toolbar={{ buttons: [...adminButtons, "close"] }}
      styles={{
        container: { backgroundColor: "rgb(27 23 18 / 0.96)" },
        captionsDescription: { fontFamily: "var(--font-caveat), cursive", fontSize: "1.75rem", lineHeight: 1.2 },
      }}
      on={{
        view: ({ index: viewed }) => {
          onIndexChange(viewed);
          setDraft(null);
          if (viewed >= cats.length - 3) onNearEnd();
        },
      }}
      render={{
        controls: () =>
          draft === null ? null : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
              onKeyDown={(event) => event.stopPropagation()}
              className="absolute inset-x-3 bottom-4 z-10 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border-2 border-ink bg-card p-3 shadow-hard sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="lightbox-caption">
                Caption
              </label>
              <input
                id="lightbox-caption"
                autoFocus
                maxLength={MAX_CAPTION_LENGTH}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setDraft(null)}
                placeholder="Add a caption…"
                className="field flex-1 py-2 font-hand text-2xl"
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-quiet" onClick={() => setDraft(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ),
      }}
    />
  );
}

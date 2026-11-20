"use client";

import type { CatImage } from "@/lib/types";
import { Polaroid } from "./polaroid";

interface GalleryProps {
  cats: CatImage[];
  status: "loading" | "idle" | "error";
  hasMore: boolean;
  sentinelRef: (node: HTMLElement | null) => void;
  onRetry: () => void;
  onOpen: (index: number, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SKELETON_HEIGHTS = ["h-64", "h-80", "h-56", "h-72"];

export function Gallery({ cats, status, hasMore, sentinelRef, onRetry, onOpen }: GalleryProps) {
  const isEmpty = cats.length === 0;

  if (isEmpty && status === "idle") {
    return (
      <p className="mx-auto max-w-sm py-16 text-center font-hand text-3xl text-ink-soft">
        No cats yet. They&apos;re probably napping. 💤
      </p>
    );
  }

  return (
    <section aria-label="Cat photos">
      <ul className="columns-2 gap-4 sm:columns-3 sm:gap-7 lg:columns-4">
        {cats.map((cat, index) => (
          <Polaroid key={cat.key} cat={cat} index={index} onOpen={(event) => onOpen(index, event)} />
        ))}
        {status === "loading" &&
          SKELETON_HEIGHTS.map((height, i) => (
            <li key={`skeleton-${i}`} aria-hidden className="mb-6 break-inside-avoid sm:mb-8">
              <div className="rounded-[3px] bg-card p-2.5 pb-10 shadow-photo">
                <div className={`${height} animate-pulse rounded-[2px] bg-paper-deep`} />
              </div>
            </li>
          ))}
      </ul>

      {status === "error" && (
        <div role="alert" className="mx-auto my-10 flex max-w-md flex-col items-center gap-4 text-center">
          <p className="font-hand text-3xl">The cats knocked something over.</p>
          <p className="text-ink-soft">We couldn&apos;t load {isEmpty ? "the gallery" : "more photos"} just now.</p>
          <button type="button" className="btn btn-quiet" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {hasMore && status !== "error" && <div ref={sentinelRef} aria-hidden className="h-px" />}

      {!hasMore && !isEmpty && (
        <p className="py-10 text-center font-hand text-2xl text-ink-soft">That&apos;s every cat so far. 🐾</p>
      )}
    </section>
  );
}

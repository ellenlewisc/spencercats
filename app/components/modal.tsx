"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  busy?: boolean;
}

export function Modal({ open, onClose, title, children, footer, busy = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0 text-ink open:animate-pop motion-reduce:open:animate-none"
    >
      <div className="relative rounded-3xl border-2 border-ink bg-card p-6 shadow-hard sm:p-8">
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-2 bg-tape shadow-sm"
        />
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-2xl leading-none text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink disabled:opacity-40"
          >
            ×
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </dialog>
  );
}

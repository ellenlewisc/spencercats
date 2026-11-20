"use client";

import { useState } from "react";
import { MotionConfig } from "motion/react";
import { toast } from "sonner";
import { deleteCat } from "@/lib/api-client";
import type { CatImage } from "@/lib/types";
import { useAdmin } from "../hooks/use-admin";
import { useCatFeed } from "../hooks/use-cat-feed";
import { meowPoint, useMeows } from "../hooks/use-meows";
import { CatLightbox } from "./cat-lightbox";
import { ConfirmDialog } from "./confirm-dialog";
import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { Masthead } from "./masthead";
import { MeowLayer } from "./meow-layer";
import { SiteFooter } from "./site-footer";
import { UploadDialog } from "./upload-dialog";

export function CatScrapbook() {
  const { user, isAdmin, signOut } = useAdmin();
  const feed = useCatFeed();
  const { meows, spawnMeow } = useMeows();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CatImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCat(pendingDelete.key);
      feed.removeCat(pendingDelete.key);
      toast.success("Photo deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete the photo.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative mx-auto max-w-7xl px-4 pb-[env(safe-area-inset-bottom)] sm:px-8">
        <Masthead signedIn={Boolean(user)} onSignOut={signOut} />
        <main>
          <Hero onMeow={spawnMeow} />

          <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">The cat files</h2>
            <p className="hidden font-hand text-2xl text-ink-soft sm:block">tap a photo for a closer look</p>
          </div>

          <Gallery
            cats={feed.cats}
            status={feed.status}
            hasMore={feed.hasMore}
            sentinelRef={feed.sentinelRef}
            onRetry={feed.retry}
            onOpen={(index, event) => {
              spawnMeow(...meowPoint(event));
              setLightboxIndex(index);
            }}
          />
        </main>
        <SiteFooter />
        <MeowLayer meows={meows} />
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="btn btn-primary fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-14 px-6 text-base shadow-hard sm:right-8 sm:bottom-8"
        >
          <span aria-hidden className="text-xl leading-none">+</span> Add a cat
        </button>
      )}

      <CatLightbox
        cats={feed.cats}
        index={lightboxIndex}
        isAdmin={isAdmin}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNearEnd={() => void feed.loadMore()}
        onCaptionSaved={feed.setCaption}
        onRequestDelete={(cat) => {
          setLightboxIndex(null);
          setPendingDelete(cat);
        }}
      />

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={feed.addCat} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this photo?"
        message="It'll be removed from the gallery and storage for good. This can't be undone."
        confirmLabel="Delete photo"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </MotionConfig>
  );
}

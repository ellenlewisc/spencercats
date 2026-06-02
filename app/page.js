"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./page.module.css";
import { TextField } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "./components/supabaseclient";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import Masonry from "react-masonry-css";
import { toast } from "sonner";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

export default function CatGallery() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  const [visibleKeys, setVisibleKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [caption, setCaption] = useState("");
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionValue, setEditCaptionValue] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const perPage = 20;
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const fetchImages = useCallback(async (pageToFetch = 1, force = false) => {
    if (!force && loadingRef.current) return;
    if (!force && !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setFetchError(false);

    try {
      const res = await fetch(`/api/list?page=${pageToFetch}&limit=${perPage}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const { data } = await res.json();

      if (!data || data.length === 0) {
        setHasMore(false);
        if (pageToFetch === 1) setVisibleKeys([]);
        return;
      }

      if (pageToFetch === 1) {
        setVisibleKeys(data);
      } else {
        setVisibleKeys((prev) => [...prev, ...data]);
      }

      if (data.length < perPage) setHasMore(false);
      pageRef.current = pageToFetch;
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setHasMore(false);
      if (pageToFetch === 1) {
        setVisibleKeys([]);
        setFetchError(true);
      } else {
        toast.error("Couldn't load more cats");
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => { fetchImages(1); }, [fetchImages]);

  // Infinite scroll via sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          fetchImages(pageRef.current + 1);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchImages]);

  const spawnMeow = (e) => {
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;
    const id = Math.random().toString(36).slice(2, 11);
    setMeows((prev) => [...prev, { id, top, left }]);
    setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);
  };

  const handleCatClick = (index, e) => {
    spawnMeow(e);
    setLightboxIndex(index);
    setEditingCaption(false);
    setLightboxOpen(true);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("fileUpload", file);
    formData.append("caption", caption);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: await authHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      setFile(null);
      setCaption("");
      setUploadMode(false);
      fetchImages(1, true);
      toast.success("Cat uploaded! 🐱");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key) => {
    try {
      const res = await fetch(`/api/delete/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");

      setDeleteKey(null);
      setLightboxOpen(false);
      fetchImages(1, true);
      toast.success("Cat deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    }
  };

  const handleSaveCaption = async () => {
    const cat = visibleKeys[lightboxIndex];
    if (!cat) return;
    setSavingCaption(true);
    try {
      const res = await fetch(`/api/caption/${encodeURIComponent(cat.key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ caption: editCaptionValue }),
      });
      if (!res.ok) throw new Error("Failed to update caption");

      setVisibleKeys((prev) =>
        prev.map((item) =>
          item.key === cat.key ? { ...item, caption: editCaptionValue } : item
        )
      );
      setEditingCaption(false);
      toast.success("Caption saved");
    } catch (err) {
      console.error("Caption update error:", err);
      toast.error("Couldn't save caption");
    } finally {
      setSavingCaption(false);
    }
  };

  const slides = visibleKeys.map(({ url, caption }) => ({
    src: url,
    description: caption || "",
  }));
  const currentCat = visibleKeys[lightboxIndex] || null;

  const ownerButtons = user
    ? [
        <button
          key="edit"
          type="button"
          className={styles.lbToolButton}
          onClick={() => {
            setEditCaptionValue(currentCat?.caption || "");
            setEditingCaption(true);
          }}
        >
          Edit caption
        </button>,
        <button
          key="del"
          type="button"
          className={styles.lbToolButton}
          onClick={() => currentCat && setDeleteKey(currentCat.key)}
        >
          Delete
        </button>,
      ]
    : [];

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.page}>
        <div className={styles.topControls}>
          {user ? (
            <>
              <button className={styles.loginButton} onClick={handleLogout}>
                Logout
              </button>
              <button
                className={styles.catToggleButton}
                onClick={() => setUploadMode((prev) => !prev)}
                title="Upload a cat"
              >
                🐱
              </button>
            </>
          ) : (
            <button className={styles.loginButton} onClick={() => router.push("/login")}>
              Login
            </button>
          )}
        </div>

        {/* Upload Section */}
        <AnimatePresence>
          {uploadMode && (
            <motion.div
              className={styles.uploadOverlay}
              onClick={() => setUploadMode(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={styles.uploadPanel}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                <button
                  className={styles.uploadCloseButton}
                  onClick={() => setUploadMode(false)}
                  title="Close"
                >
                  ×
                </button>

                <h2 className={styles.uploadTitle}>Upload a Cat</h2>

                <input
                  type="file"
                  accept="image/*"
                  id="fileUpload"
                  onChange={(e) => setFile(e.target.files[0])}
                  className={styles.hiddenInput}
                />
                <label htmlFor="fileUpload" className={styles.uploadDropZone}>
                  {file ? (
                    <div className={styles.uploadPreview}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className={styles.uploadPreviewImage}
                      />
                      <span className={styles.uploadFileName}>{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <span className={styles.uploadIcon}>+</span>
                      <span className={styles.uploadDropText}>Choose a photo</span>
                    </>
                  )}
                </label>

                <TextField
                  label="Caption"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  sx={{
                    "& label": { color: "rgba(255,255,255,0.5)" },
                    "& label.Mui-focused": { color: "#ff9800" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                      "&:hover fieldset": { borderColor: "rgba(255,152,0,0.4)" },
                      "&.Mui-focused fieldset": { borderColor: "#ff9800" },
                      "& input": { color: "white" },
                    },
                  }}
                />

                <button
                  className={styles.uploadButton}
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className={styles.title}>SPENCIE AND CATS</h1>
        <p className={styles.subtitle}>meow meow pspspsi</p>

        <div className={styles.hero}>
          <Image
            src="/images/cat.png"
            alt="CAT"
            fill
            style={{ objectFit: "contain", cursor: "pointer" }}
            onClick={spawnMeow}
          />
        </div>

        {/* Cat Grid */}
        {fetchError && visibleKeys.length === 0 ? (
          <p className={styles.errorMessage}>No photos found or failed to load.</p>
        ) : (
          <Masonry
            breakpointCols={{ default: 4, 1200: 3, 800: 2, 500: 2 }}
            className={styles.masonry}
            columnClassName={styles.masonryColumn}
          >
            {visibleKeys.map(({ key, url }, index) => (
              <motion.div
                key={key}
                className={styles.masonryTile}
                onClick={(e) => handleCatClick(index, e)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(index, 8) * 0.04,
                }}
                whileTap={{ scale: 0.96 }}
              >
                {!loadedImages.has(key) && (
                  <div className={styles.skeletonTile} />
                )}
                <Image
                  src={url}
                  alt="cat"
                  width={400}
                  height={500}
                  sizes="(max-width: 800px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  {...(index < 4 ? { priority: true } : { loading: "lazy" })}
                  onLoad={() =>
                    setLoadedImages((prev) => new Set(prev).add(key))
                  }
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "12px",
                    opacity: loadedImages.has(key) ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />
              </motion.div>
            ))}
          </Masonry>
        )}

        {/* Loading skeletons at list bottom */}
        {loading && hasMore && (
          <div className={styles.bottomSkeletons}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonTile} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className={styles.sentinel} />

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => { setLightboxOpen(false); setEditingCaption(false); }}
          index={lightboxIndex}
          slides={slides}
          plugins={[Zoom, Captions, Counter]}
          carousel={{ finite: true }}
          zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 300 }}
          captions={{ descriptionTextAlign: "center" }}
          counter={{ container: { style: { top: "unset", bottom: 0 } } }}
          on={{
            view: ({ index }) => {
              setLightboxIndex(index);
              setEditingCaption(false);
              if (index >= visibleKeys.length - 3 && hasMoreRef.current && !loadingRef.current) {
                fetchImages(pageRef.current + 1);
              }
            },
          }}
          toolbar={{ buttons: [...ownerButtons, "close"] }}
          render={{
            controls: () =>
              editingCaption ? (
                <div
                  className={styles.lbCaptionBar}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    className={styles.captionInput}
                    value={editCaptionValue}
                    onChange={(e) => setEditCaptionValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCaption();
                      if (e.key === "Escape") setEditingCaption(false);
                    }}
                    placeholder="Add a caption..."
                    autoFocus
                  />
                  <button
                    className={styles.captionSaveButton}
                    onClick={handleSaveCaption}
                    disabled={savingCaption}
                  >
                    {savingCaption ? "..." : "Save"}
                  </button>
                  <button
                    className={styles.captionCancelButton}
                    onClick={() => setEditingCaption(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : null,
          }}
        />

        {/* Floating Meows */}
        {meows.map(({ id, top, left }) => (
          <div key={id} className={styles.floatingMeow} style={{ top: `${top}px`, left: `${left}px` }}>
            Meow 🐱
          </div>
        ))}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteKey && (
            <motion.div
              className={styles.modalOverlay}
              style={{ zIndex: 10001 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                <p>Are you sure you want to delete this cat photo?</p>
                <div className={styles.modalButtons}>
                  <button className={styles.modalCancel} onClick={() => setDeleteKey(null)}>
                    Cancel
                  </button>
                  <button className={styles.modalConfirm} onClick={() => handleDelete(deleteKey)}>
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

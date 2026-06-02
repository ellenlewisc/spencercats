"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./page.module.css";
import { TextField } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "./components/supabaseclient";

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
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [caption, setCaption] = useState("");
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionValue, setEditCaptionValue] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  const perPage = 20;
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);


  // Keep refs in sync
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
      if (pageToFetch === 1) setVisibleKeys([]);
      setFetchError(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchImages(1); }, [fetchImages]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= docHeight - 1000) {
        fetchImages(pageRef.current + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchImages]);

  // Floating “meow” + open modal
  const handleCatClick = (cat, e) => {
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;
    const id = Math.random().toString(36).slice(2, 11);

    setMeows((prev) => [...prev, { id, top, left }]);
    setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);

    setSelectedCat(cat);
  };

  // Upload image
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);

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
      fetchImages(1, true);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1000);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDelete = async (key) => {
    try {
      const res = await fetch(`/api/delete/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");

      fetchImages(1, true);
      setDeleteKey(null);
      setSelectedCat(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Save caption
  const handleSaveCaption = async () => {
    if (!selectedCat) return;
    setSavingCaption(true);
    try {
      const res = await fetch(`/api/caption/${encodeURIComponent(selectedCat.key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ caption: editCaptionValue }),
      });
      if (!res.ok) throw new Error("Failed to update caption");

      setSelectedCat((prev) => ({ ...prev, caption: editCaptionValue }));
      setVisibleKeys((prev) =>
        prev.map((item) =>
          item.key === selectedCat.key ? { ...item, caption: editCaptionValue } : item
        )
      );
      setEditingCaption(false);
    } catch (err) {
      console.error("Caption update error:", err);
    } finally {
      setSavingCaption(false);
    }
  };

  return (
    <div className={styles.page}>
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "10px", zIndex: 100 }}>
        {user ? (
          <>
            <button className={styles.loginButton} onClick={handleLogout}>
              Logout
            </button>
            <button
              className={styles.catToggleButton}
              onClick={() => setUploadMode((prev) => !prev)}
              title="Toggle upload mode"
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
      {uploadMode && !selectedCat && (
        <div className={styles.uploadOverlay} onClick={() => setUploadMode(false)}>
          <div className={styles.uploadPanel} onClick={(e) => e.stopPropagation()}>
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

            {uploadSuccess && (
              <span className={styles.successMessage}>Upload successful!</span>
            )}
          </div>
        </div>
      )}

      <h1 className={styles.title}>SPENCIE AND CATS</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

      <div
        style={{
          position: "relative",
          width: "min(300px, 60vw)",
          height: "min(300px, 60vw)",
          padding: 20,
          marginBottom: 40,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <Image
          src="/images/cat.png"
          alt="CAT"
          fill
          style={{ objectFit: "contain", cursor: "pointer" }}
          onClick={(e) => {
            const rect = e.target.getBoundingClientRect();
            const top = rect.top + window.scrollY + rect.height / 2;
            const left = rect.left + window.scrollX + rect.width / 2;
            const id = Math.random().toString(36).slice(2, 11);
            setMeows((prev) => [...prev, { id, top, left }]);
            setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);
          }}
        />
      </div>

      {/* Cat Grid */}
      <div className={`${visibleKeys.length > 0 ? styles.gridVisible : ""}`}>
        {fetchError && visibleKeys.length === 0 ? (
          <p className={styles.errorMessage}>
            No photos found or failed to load.
          </p>
        ) : (
          <div className={styles.grid}>
            {visibleKeys.map(({ key, url, caption }, index) => (
              <div
                key={key}
                className={styles.catContainer}
                onClick={(e) =>
                  handleCatClick({ key, url, caption }, e)
                }
              >
                {!loadedImages.has(key) && (
                  <div className={styles.imagePlaceholder}>
                    <div className={styles.spinner}></div>
                  </div>
                )}
                <Image
                  src={url}
                  alt="cat"
                  width={400}
                  height={400}
                  {...(index < 4
                    ? { priority: true }
                    : { loading: "lazy" })}
                  onLoad={() =>
                    setLoadedImages((prev) => new Set(prev).add(key))
                  }
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "12px",
                    opacity: loadedImages.has(key) ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal View */}
      {selectedCat && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedCat(null); setEditingCaption(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalCloseButton}
              onClick={() => { setSelectedCat(null); setEditingCaption(false); }}
              title="Close"
            >
              ×
            </button>

            <div className={styles.modalImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedCat.url}
                alt="cat"
                className={styles.modalImage}
              />
            </div>

            {user ? (
              <div className={styles.modalActions}>
                {editingCaption ? (
                  <div className={styles.captionEditRow}>
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
                ) : (
                  <p
                    className={styles.modalCaptionEditable}
                    onClick={() => {
                      setEditCaptionValue(selectedCat.caption || "");
                      setEditingCaption(true);
                    }}
                  >
                    {selectedCat.caption?.trim() || "Add caption..."}
                  </p>
                )}
                <button
                  className={styles.modalDeleteButton}
                  onClick={() => setDeleteKey(selectedCat.key)}
                >
                  Delete
                </button>
              </div>
            ) : (
              selectedCat.caption?.trim() && (
                <p className={styles.modalCaption}>{selectedCat.caption}</p>
              )
            )}
          </div>
        </div>
      )}


      {/* Loading Spinner */}
      {loading && (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Floating Meows */}
      {meows.map(({ id, top, left }) => (
        <div key={id} className={styles.floatingMeow} style={{ top: `${top}px`, left: `${left}px` }}>
          Meow 🐱
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {deleteKey && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to delete this cat photo?</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalCancel} onClick={() => setDeleteKey(null)}>
                Cancel
              </button>
              <button className={styles.modalConfirm} onClick={() => handleDelete(deleteKey)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


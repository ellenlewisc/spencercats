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
      });
      if (!res.ok) throw new Error("Failed to delete");

      fetchImages(1, true);
      setDeleteKey(null);
      setSelectedCat(null);
    } catch (err) {
      console.error("Delete error:", err);
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
        <div className={styles.uploadContainer}>
          <input
            type="file"
            accept="image/*"
            id="fileUpload"
            onChange={(e) => setFile(e.target.files[0])}
            className={styles.hiddenInput}
          />
          <label htmlFor="fileUpload" className={styles.uploadLabel}>
            {file ? file.name : "Choose file"}
          </label>
          <TextField
            label="Caption"
            variant="outlined"
            size="small"
            fullWidth
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            sx={{
              mt: 1,
              "& label": { color: "white" },
              "& label.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "& fieldset": { borderColor: "#ff9800" },
                "&:hover fieldset": { borderColor: "#ffb74d" },
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
            <span className={styles.successMessage}>Upload successful.</span>
          )}
        </div>
      )}

      <h1 className={styles.title}>SPENCIE AND CATS</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          marginLeft: 70,
          padding: 40,
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
            {visibleKeys.map(({ key, url, caption }) => (
              <div
                key={key}
                className={styles.catContainer}
                onClick={(e) =>
                  handleCatClick({ key, url, caption }, e)
                }
              >
                <Image
                  src={url}
                  alt="cat"
                  width={400}
                  height={400}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="/images/placeholder.png"
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "12px",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal View */}
      {selectedCat && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCat(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalCloseButton}
              onClick={() => setSelectedCat(null)}
              title="Close"
            >
              ×
            </button>


            <div style={{ maxWidth: "800px", borderRadius: "20px", overflow: "hidden", margin: "0 auto" }}>
              <Image
                src={selectedCat.url}
                alt="cat"
                width={800}
                height={800}
                className={styles.modalImage}
              />
            </div>

            {selectedCat.caption?.trim() && (
              <p className={styles.modalCaption}>{selectedCat.caption}</p>
            )}

            {uploadMode && (
              <button
                className={styles.modalDeleteButton}
                onClick={() => setDeleteKey(selectedCat.key)}
              >
                Delete
              </button>
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


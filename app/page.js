"use client";
import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";

export default function CatGallery() {
  const [images, setImages] = useState([]);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  // Load cached images on mount
  useEffect(() => {
    const cached = localStorage.getItem("catKeys");
    if (cached) {
      const keys = JSON.parse(cached);
      setImages(keys);
      setHasMore(false);
    } else {
      fetchImages();
    }
  }, []);

  // Fetch images
  const fetchImages = useCallback(
    async (next = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const targetPage = next ? page + 1 : 1;
        const query = new URLSearchParams({ page: targetPage, limit: "10" });
        const res = await fetch(`/.netlify/functions/list-images?${query.toString()}`);
        const data = await res.json();
        const keys = Array.isArray(data.keys) ? data.keys : [];

        if (next) {
          setImages((prev) => {
            const combined = [...prev, ...keys];
            localStorage.setItem("catKeys", JSON.stringify(combined));
            return combined;
          });
        } else {
          setImages(keys);
          localStorage.setItem("catKeys", JSON.stringify(keys));
        }

        setPage(targetPage);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, loading]
  );

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= docHeight - 100) {
        fetchImages(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchImages, hasMore, loading]);

  // Floating "meow" effect
  const handleCatClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;
    const id = Math.random().toString(36).slice(2, 11);

    setMeows((prev) => [...prev, { id, top, left }]);
    setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);
  };

  // Handle image upload
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("fileUpload", file);

    try {
      const res = await fetch("/.netlify/functions/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      setFile(null);
      setUploadSuccess(true);

      localStorage.removeItem("catKeys");
      setPage(1);
      setHasMore(true);
      fetchImages();

      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Handle image delete
  const handleDelete = async (key) => {
    try {
      const res = await fetch(`/.netlify/functions/delete-image?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      localStorage.removeItem("catKeys");
      setPage(1);
      setHasMore(true);
      fetchImages();

      setDeleteKey(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spencie and cats</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

      <button
        className={styles.catToggleButton}
        onClick={() => setUploadMode((prev) => !prev)}
        title="Toggle upload mode"
      >
        🐱
      </button>

      {uploadMode && (
        <div className={styles.uploadContainer}>
          <input
            type="file"
            accept="image/*"
            id="fileUpload"
            onChange={(e) => setFile(e.target.files[0])}
            className={styles.hiddenInput}
          />
          <label htmlFor="fileUpload" className={styles.uploadLabel}>
            {file ? file.name : "Choose a file"}
          </label>
          <button className={styles.uploadButton} onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {uploadSuccess && <span className={styles.successMessage}>Upload successful.</span>}
        </div>
      )}

      <div className={styles.grid}>
        {images.map((key) => (
          <div key={key} className={styles.catContainer}>
            <img
              src={`/.netlify/functions/get-image?key=${encodeURIComponent(key)}`}
              alt={key}
              className={styles.catPhoto}
              onClick={handleCatClick}
            />
            {uploadMode && (
              <button className={styles.deleteButton} onClick={() => setDeleteKey(key)}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>Loading...</div>
        </div>
      )}

      {meows.map(({ id, top, left }) => (
        <div key={id} className={styles.floatingMeow} style={{ top: `${top}px`, left: `${left}px` }}>
          Meow 🐱
        </div>
      ))}

      {deleteKey && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to delete this cat photo?</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalCancel} onClick={() => setDeleteKey(null)}>
                Cancel
              </button>
              <button className={styles.modalConfirm} onClick={() => handleDelete(deleteKey)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

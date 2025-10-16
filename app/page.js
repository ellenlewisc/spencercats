"use client";
import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";

export default function CatGallery() {
  const [visibleKeys, setVisibleKeys] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;
  const [hasMore, setHasMore] = useState(true);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  const loadingRef = useRef(false);

  const fetchImages = async (pageToFetch = 1, force = false) => {
    console.log("RE-FETCHING", pageToFetch);
    if (!force && (loadingRef.current || !hasMore)) {
      console.log("SKIPPING FETCH");
      return;
    }
    loadingRef.current = true;
    setLoading(true);

    try {
      console.log("IN FETCH");
      const res = await fetch(`/.netlify/functions/list-images?page=${pageToFetch}&limit=${perPage}`);
      const { data } = await res.json();

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      if (pageToFetch === 1) {
        setVisibleKeys(data);
      } else {
        setVisibleKeys((prev) => [...prev, ...data]);
      }

      if (data.length < perPage) setHasMore(false);

      setPage(pageToFetch);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchImages(1);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= docHeight - 1000) {
        fetchImages(page + 1);
      }
    };


    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleKeys, page, total]);


  // Floating "meow" effect
  const handleCatClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;
    const id = Math.random().toString(36).slice(2, 11);

    setMeows((prev) => [...prev, { id, top, left }]);
    setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);
  };

  // Upload image
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
      loadingRef.current = false;
      fetchImages(1, true);
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
      const res = await fetch(`/.netlify/functions/delete-image?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      // Refresh first page
      fetchImages(1, true);
      setDeleteKey(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className={styles.page}>
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
            {file ? file.name : "Choose file"}
          </label>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {uploadSuccess && <span className={styles.successMessage}>Upload successful.</span>}
        </div>
      )}

      <h1 className={styles.title}>SPENCIE AND CATS</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

      <button
        className={styles.catToggleButton}
        onClick={() => setUploadMode((prev) => !prev)}
        title="Toggle upload mode"
      >
        🐱
      </button>

      <img
        src="/images/cat.png"
        alt="CAT"
        onClick={handleCatClick}
        style={{
          width: "300px",
          height: "auto",
          display: "block",
          cursor: "pointer",
          objectFit: "contain",
          padding: "40px",
          borderRadius: "20px",
          marginLeft: "50px",
        }}
      />

      <div className={`${visibleKeys.length > 0 ? styles.gridVisible : ""}`}>
        <div className={styles.grid}>
          {visibleKeys.map(({ key, url }) => (
            <div key={key} className={styles.catContainer}>
              <img
                src={url}
                alt="cat"
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
      </div>

      {loading && (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
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

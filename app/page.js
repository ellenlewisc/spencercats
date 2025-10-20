"use client";
import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";

export default function CatGallery() {
  const [visibleKeys, setVisibleKeys] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [hasMore, setHasMore] = useState(true);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const loadingRef = useRef(false);

  const fetchImages = async (pageToFetch = 1, force = false) => {
    if (!force && (loadingRef.current || !hasMore)) return;
    loadingRef.current = true;
    setLoading(true);
    setFetchError(false); // reset on new attempt

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
      setPage(pageToFetch);
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setHasMore(false); // stop infinite scroll
      if (pageToFetch === 1) setVisibleKeys([]);
      setFetchError(true); // show error message
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
  }, [page, hasMore]);

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

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      setFile(null);
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

      <button
        className={styles.catToggleButton}
        onClick={() => setUploadMode((prev) => !prev)}
        title="Toggle upload mode"
      >
        🐱
      </button>

      {/* Cute cat image button */}
      <img
        src="/images/cat.png"
        alt="CAT"
        onClick={(e) => handleCatClick({ url: "/images/cat.png" }, e)}
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

      {/* Cat Grid */}
      <div className={`${visibleKeys.length > 0 ? styles.gridVisible : ""}`}>
        {fetchError && visibleKeys.length === 0 ? (
          <p className={styles.errorMessage}>No photos found or failed to load.</p>
        ) : (
          <div className={styles.grid}>
            {visibleKeys.map(({ key, url, caption }) => (
              <div key={key} className={styles.catContainer}>
                <img
                  src={url}
                  alt="cat"
                  className={styles.catPhoto}
                  onClick={(e) => handleCatClick({ key, url, caption }, e)}
                />
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Modal View */}
      {selectedCat && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedCat(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedCat.url} alt="cat" className={styles.modalImage} />
            <p className={styles.modalCaption}>{selectedCat.caption || ""}</p>

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
        <div
          key={id}
          className={styles.floatingMeow}
          style={{ top: `${top}px`, left: `${left}px` }}
        >
          Meow 🐱
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {deleteKey && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to delete this cat photo?</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancel}
                onClick={() => setDeleteKey(null)}
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirm}
                onClick={() => handleDelete(deleteKey)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function CatGallery() {
  const [images, setImages] = useState([]);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);
  const [cursor, setCursor] = useState(null);

  const fetchImages = async (next = false) => {
    try {
      const query = new URLSearchParams();
      if (next && cursor) query.append("cursor", cursor);
      query.append("limit", "20");

      const res = await fetch(`/.netlify/functions/list-images?${query.toString()}`);
      const data = await res.json();
      console.log("Fetched images:", data);

      const keys = Array.isArray(data) ? data : [];

      if (next) {
        setImages((prev) => [...prev, ...keys.reverse()]);
      } else {
        setImages(keys.reverse());
      }

      setCursor(data.nextCursor || null);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleCatClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height / 2;
    const left = rect.left + window.scrollX + rect.width / 2;
    const id = Math.random().toString(36).slice(2, 11);

    setMeows((prev) => [...prev, { id, top, left }]);
    setTimeout(() => setMeows((prev) => prev.filter((m) => m.id !== id)), 1700);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("fileUpload", file);

    try {
      const res = await fetch("/.netlify/functions/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      setFile(null);
      fetchImages(); // Refresh images after upload
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // Unified handleDelete function
  const handleDelete = async (key) => {
    try {
      const res = await fetch(`/.netlify/functions/delete-image?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setImages((prev) => prev.filter((imgKey) => imgKey !== key));
      setDeleteKey(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spencie and cats</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

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
        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!file}
        >
          Upload
        </button>
      </div>

      <div className={styles.grid}>
        {images.map((key) => (
          <div key={key} className={styles.catContainer}>
            <img
              src={`/.netlify/functions/get-image?key=${encodeURIComponent(key)}`}
              alt={key}
              className={styles.catPhoto}
              onClick={handleCatClick}
            />
            <button
              className={styles.deleteButton}
              onClick={() => setDeleteKey(key)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {cursor && (
        <button
          className={styles.loadMoreButton}
          onClick={() => fetchImages(true)}
        >
          Load More
        </button>
      )}

      {meows.map(({ id, top, left }) => (
        <div
          key={id}
          className={styles.floatingMeow}
          style={{ top: `${top}px`, left: `${left}px` }}
        >
          Meow 🐱
        </div>
      ))}

      {/* Modal confirmation */}
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

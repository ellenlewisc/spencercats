"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function CatGallery() {
  const [images, setImages] = useState([]);
  const [meows, setMeows] = useState([]);
  const [file, setFile] = useState(null);

  // Function to fetch the image list
  const fetchImages = async () => {
    try {
      const res = await fetch("/.netlify/functions/list-images");
      const data = await res.json();
      setImages(data.reverse()); 
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  useEffect(() => {
    fetchImages(); // Load images on mount
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
          <img
            key={key}
            src={`/.netlify/functions/get-image?key=${encodeURIComponent(key)}`}
            alt={key}
            className={styles.catPhoto}
            onClick={handleCatClick}
          />
        ))}
      </div>

      {meows.map(({ id, top, left }) => (
        <div
          key={id}
          className={styles.floatingMeow}
          style={{ top: `${top}px`, left: `${left}px` }}
        >
          Meow 🐱
        </div>
      ))}
    </div>
  );
}

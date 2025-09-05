"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function CatPage() {
  const [meows, setMeows] = useState([]);
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);

  // Load all images
  const fetchImages = async () => {
    try {
      const res = await fetch("/.netlify/functions/list-images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Click animation
  const handleCatClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    const top = rect.top + scrollTop + rect.height / 2;
    const left = rect.left + scrollLeft + rect.width / 2;

    const id = Math.random().toString(36).slice(2, 11);
    setMeows((prev) => [...prev, { id, top, left }]);

    setTimeout(() => {
      setMeows((prev) => prev.filter((m) => m.id !== id));
    }, 1700);
  };

  // Upload using formData
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

      setFile(null); // clear input
      fetchImages(); // refresh images
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spencie and cats</h1>
      <p className={styles.subtitle}>meow meow pspspsi</p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleUpload} disabled={!file}>
          Upload Cat
        </button>
      </div>

      <div className={styles.grid}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Cat ${i + 1}`}
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

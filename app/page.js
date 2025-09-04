"use client";
import { useState } from "react";
import styles from "./page.module.css";

const catImages = [
  "/images/petcat1.jpeg",
  "/images/petcat2.jpeg",
  "/images/petcat3.jpeg",
  "/images/petcat4.jpeg",
  "/images/petcat5.jpeg",
  "/images/petcat6.jpeg",
  "/images/petcat7.jpeg",
  "/images/petcat8.jpeg",
  "/images/petcat9.jpeg",
  "/images/petcat10.jpeg",
  "/images/petcat11.jpeg",
  "/images/petcat12.jpeg",
  "/images/petcat13.jpeg",
  "/images/petcat14.jpeg",
];

export default function CatPage() {
  const [meows, setMeows] = useState([]);

  const handleCatClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    const top = rect.top + scrollTop + rect.height / 2;
    const left = rect.left + scrollLeft + rect.width / 2;

    const id = Math.random().toString(36).substr(2, 9);
    const newMeow = { id, top, left };

    setMeows((prev) => [...prev, newMeow]);

    setTimeout(() => {
      setMeows((prev) => prev.filter((m) => m.id !== id));
    }, 1700);
  };


  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spencie and cats</h1>
      <p className={styles.subtitle}>meow meow pspspsi </p>

      <div className={styles.grid}>
        {catImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Cat photo ${i + 1}`}
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

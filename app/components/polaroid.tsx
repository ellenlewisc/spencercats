"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { tiltFor } from "@/lib/tilt";
import type { CatImage } from "@/lib/types";

interface PolaroidProps {
  cat: CatImage;
  index: number;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Polaroid({ cat, index, onOpen }: PolaroidProps) {
  const [loaded, setLoaded] = useState(false);
  const tilt = tiltFor(cat.key);
  const tapeTilt = tiltFor(`${cat.key}-tape`, 8);

  return (
    <motion.li
      className="mb-6 break-inside-avoid sm:mb-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: Math.min(index % 24, 8) * 0.05 }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
        className="group relative block w-full rotate-(--tilt) rounded-[3px] bg-card p-2.5 pb-4 text-left shadow-photo transition-[transform,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-photo-lift focus-visible:rotate-0 motion-reduce:transition-none sm:p-3 sm:pb-5"
      >
        <span
          aria-hidden
          style={{ "--tape-tilt": `${tapeTilt}deg` } as React.CSSProperties}
          className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-(--tape-tilt) bg-tape shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
        />
        <span className={`block overflow-hidden rounded-[2px] bg-paper-deep ${loaded ? "" : "animate-pulse"}`}>
          <Image
            src={cat.url}
            alt={cat.caption || "A cat photo"}
            width={480}
            height={600}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={index < 4}
            onLoad={() => setLoaded(true)}
            className={`h-auto w-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </span>
        {cat.caption && (
          <span className="mt-2.5 line-clamp-2 block px-1 font-hand text-xl leading-6 text-ink sm:text-2xl sm:leading-7">
            {cat.caption}
          </span>
        )}
      </button>
    </motion.li>
  );
}

"use client";

import Image from "next/image";
import catSticker from "@/public/images/cat.png";
import { meowPoint } from "../hooks/use-meows";

interface HeroProps {
  onMeow: (x: number, y: number) => void;
}

export function Hero({ onMeow }: HeroProps) {
  return (
    <section className="relative grid items-center gap-6 pt-4 pb-14 sm:pt-8 md:grid-cols-[1.4fr_1fr] md:pb-20">
      <div>
        <h1 className="font-display text-[clamp(3.5rem,13vw,9.5rem)] leading-[0.85] font-extrabold tracking-[-0.04em]">
          Spencie
          <br />
          <span className="text-tangerine">&amp;</span> Cats
        </h1>
        <p className="mt-6 inline-block -rotate-3 rounded-xl border-2 border-ink bg-blush px-4 py-1.5 font-hand text-3xl shadow-hard-sm">
          meow meow pspspsi
        </p>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
          A little scrapbook of Spencer and cats.
        </p>
      </div>

      <button
        type="button"
        onClick={(event) => onMeow(...meowPoint(event))}
        aria-label="Pet the cat"
        className="group relative mx-auto aspect-square w-[min(70vw,22rem)] cursor-pointer rounded-full"
      >
        <span aria-hidden className="absolute inset-[8%] rounded-full border-2 border-dashed border-ink/30 bg-tangerine-soft" />
        <Image
          src={catSticker}
          alt=""
          priority
          sizes="(max-width: 768px) 70vw, 22rem"
          className="relative h-full w-full object-contain drop-shadow-[4px_6px_0_var(--ink)] transition-transform duration-300 group-hover:-rotate-3 group-active:scale-95 motion-reduce:transition-none"
        />
        <span className="absolute right-[6%] bottom-[10%] rotate-6 rounded-full border-2 border-ink bg-card px-3 py-1 font-hand text-xl shadow-hard-sm">
          pet me!
        </span>
      </button>
    </section>
  );
}

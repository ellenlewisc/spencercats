import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import catOne from "@/public/images/petcat3.jpeg";
import catTwo from "@/public/images/petcat8.jpeg";
import catThree from "@/public/images/petcat12.jpeg";
import { LoginForm } from "../components/login-form";

export const metadata: Metadata = {
  title: "Log in · Spencie & Cats",
  robots: { index: false, follow: false },
};

const STACK = [
  { src: catOne, className: "-rotate-8 -translate-x-16 translate-y-6" },
  { src: catTwo, className: "rotate-6 translate-x-14 -translate-y-2" },
  { src: catThree, className: "-rotate-1" },
];

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-12 px-4 py-10 md:grid-cols-2 md:px-8">
      <div aria-hidden className="relative mx-auto hidden h-96 w-64 md:block">
        {STACK.map(({ src, className }) => (
          <div key={src.src} className={`absolute inset-0 bg-card p-3 pb-12 shadow-photo-lift ${className}`}>
            <Image src={src} alt="" sizes="16rem" placeholder="blur" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-6 inline-block font-hand text-2xl text-ink-soft hover:text-ink">
          ← back to the cats
        </Link>
        <div className="relative rounded-3xl border-2 border-ink bg-card p-7 shadow-hard sm:p-8">
          <span aria-hidden className="absolute -top-3 left-8 h-6 w-24 -rotate-3 bg-tape" />
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Staff only</h1>
          <p className="mt-2 mb-6 text-ink-soft">Cat curators, sign in to add and edit photos.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

interface MastheadProps {
  signedIn: boolean;
  onSignOut: () => void;
}

export function Masthead({ signedIn, onSignOut }: MastheadProps) {
  return (
    <header className="flex items-center justify-between gap-3 py-5">
      <span className="font-display text-lg font-extrabold sm:hidden">S&amp;C</span>
      <nav className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />
        {signedIn ? (
          <button type="button" className="btn btn-quiet" onClick={onSignOut}>
            Log out
          </button>
        ) : (
          <Link href="/login" className="btn btn-quiet">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}

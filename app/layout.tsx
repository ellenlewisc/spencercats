import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Quicksand } from "next/font/google";
import { AppToaster } from "./components/app-toaster";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand", display: "swap" });

export const metadata: Metadata = {
  title: "Spencie & Cats",
  description: "A little scrapbook of cat photos, made with love for Spencer.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1712" },
  ],
};

// Runs before paint so the saved theme applies without a light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${caveat.variable} ${quicksand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="relative z-10">{children}</div>
        <AppToaster />
      </body>
    </html>
  );
}

import "./globals.css";
import { Quicksand, Alfa_Slab_One } from "next/font/google";
import { Toaster } from "sonner";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const alfaSlab = Alfa_Slab_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-alfa-slab",
});

export const metadata = {
  title: "Spencer and Cats",
  description: "Spencer and Cats",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0f0f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${alfaSlab.variable}`}>
      <body>
        {children}
        <Toaster
          richColors
          theme="dark"
          position="top-center"
          toastOptions={{ style: { fontFamily: "var(--font-quicksand), sans-serif" } }}
        />
      </body>
    </html>
  );
}

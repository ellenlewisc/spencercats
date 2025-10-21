import "./globals.css";
import { Quicksand, Alfa_Slab_One } from "next/font/google";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${alfaSlab.variable}`}>
      <body>{children}</body>
    </html>
  );
}

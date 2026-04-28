import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pixelsnake",
  description:
    "A playable GitHub contribution graph widget you can drop into a Next.js app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

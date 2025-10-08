import type { Metadata } from "next";
import "./globals.css";
import { Rajdhani } from "next/font/google";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PokiPackage | SORA Text-to-Video Studio",
  description: "Generate cinematic videos and audio narrations with OpenAI SORA and Audio APIs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={rajdhani.className}>{children}</body>
    </html>
  );
}

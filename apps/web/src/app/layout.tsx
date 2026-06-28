import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Learning OS — AI Cognitive Tutor",
  description: "An intelligent adaptive learning operating system with a personal AI tutor, spaced-repetition memory, and knowledge graph for serious exam preparation.",
  keywords: ["learning", "AI tutor", "UGC NET", "adaptive learning", "spaced repetition"],
  openGraph: {
    title: "Learning OS — AI Cognitive Tutor",
    description: "Your intelligent AI-powered study OS for serious exam preparation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500/20 selection:text-cyan-200 overflow-x-hidden antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

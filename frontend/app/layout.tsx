import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Système TacticalOps",
  description: "DÉTECTION DE MENACES DE QUALITÉ MILITAIRE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${inter.variable} antialiased flex flex-col md:flex-row bg-[var(--color-bg-primary)] min-h-screen relative`}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto w-full relative">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigilancia CIMA | Dashboard",
  description: "Plataforma Automatizada de Farmacovigilancia y Gestión de Inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/30 min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 md:pl-64 min-h-screen overflow-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

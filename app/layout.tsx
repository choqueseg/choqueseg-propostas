import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHOQUESEG PRO",
  description: "Sistema de gestão da CHOQUESEG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
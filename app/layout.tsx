import type { Metadata, Viewport } from "next";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHOQUESEG Propostas",
  description: "Gerador de propostas de energia solar da CHOQUESEG.",
  applicationName: "CHOQUESEG Propostas",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/imagens/logo/brasao-choqueseg.png",
    apple: "/imagens/logo/brasao-choqueseg.png",
  },
  appleWebApp: {
    capable: true,
    title: "CHOQUESEG",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#facc15",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}
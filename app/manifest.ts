import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CHOQUESEG Propostas",
    short_name: "CHOQUESEG",
    description: "Gerador de propostas de energia solar da CHOQUESEG.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#facc15",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/imagens/logo/brasao-choqueseg.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/imagens/logo/brasao-choqueseg.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/imagens/logo/brasao-choqueseg.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
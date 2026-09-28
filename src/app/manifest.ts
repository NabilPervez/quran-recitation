import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ayah Echo",
    short_name: "Ayah Echo",
    description: "Memorise the Quran ayah by ayah through repetition",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: "#fafaf8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

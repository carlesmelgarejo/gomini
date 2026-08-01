import type { MetadataRoute } from "next";

// Bloqueja tots els cercadors: GoMini no s'ha d'indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}

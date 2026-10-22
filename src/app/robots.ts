import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Only the production deployment should be indexable. Netlify's deploy
 * previews are not assumed to add noindex headers automatically.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: process.env.CONTEXT === "production" ? "/" : "", disallow: process.env.CONTEXT === "production" ? undefined : "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

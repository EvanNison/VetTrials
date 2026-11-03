import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VETTRIALS_RESOURCE_PREVIEW === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/workspace"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/changelog"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];
}

import type { MetadataRoute } from "next";
import { SERIES, getAllEpisodePaths } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cardfables.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const seriesPages: MetadataRoute.Sitemap = SERIES.map((s) => ({
    url: `${baseUrl}/series/${s.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const episodePages: MetadataRoute.Sitemap = getAllEpisodePaths().map(
    ({ seriesSlug, episodeSlug }) => ({
      url: `${baseUrl}/series/${seriesSlug}/${episodeSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  return [...staticPages, ...seriesPages, ...episodePages];
}

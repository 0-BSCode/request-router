type SeoOptions = {
  origin: string;
  path: string;
  title: string;
  siteName?: string;
  description?: string;
  imagePath?: string;
  index?: boolean;
};

/** Title, description, canonical, Open Graph, and Twitter tags for a route head(). */
export function seo({
  origin,
  path,
  title,
  siteName,
  description,
  imagePath,
  index = true,
}: SeoOptions) {
  const base = origin.replace(/\/+$/, "");
  const url = new URL(path, `${base}/`).toString();
  const fullTitle = siteName && path !== "/" ? `${title} · ${siteName}` : title;
  const meta: Record<string, string>[] = [
    { title: fullTitle },
    { property: "og:title", content: fullTitle },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
  ];

  if (description) {
    meta.push({ name: "description", content: description });
    meta.push({ property: "og:description", content: description });
  }
  if (imagePath)
    meta.push({ property: "og:image", content: new URL(imagePath, `${base}/`).toString() });
  if (!index) meta.push({ name: "robots", content: "noindex, nofollow" });

  return { meta, links: [{ rel: "canonical", href: url }] };
}

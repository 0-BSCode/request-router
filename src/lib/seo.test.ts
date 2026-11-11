import { expect, test } from "vite-plus/test";

import { seo } from "./seo";

test("builds canonical and social metadata", () => {
  const result = seo({
    origin: "https://example.com/",
    path: "/about",
    title: "About",
    siteName: "Example",
    description: "About this app",
    imagePath: "/og.png",
    index: false,
  });

  expect(result.links).toEqual([{ rel: "canonical", href: "https://example.com/about" }]);
  expect(result.meta).toContainEqual({ title: "About · Example" });
  expect(result.meta).toContainEqual({
    property: "og:image",
    content: "https://example.com/og.png",
  });
  expect(result.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
});

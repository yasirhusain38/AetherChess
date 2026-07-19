import type { Metadata } from "next";

const SITE = "https://aether.chess";
const DEFAULT_OG = "/og/default.svg";

export function pageMeta(opts: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
}): Metadata {
  const url = `${SITE}${opts.path ?? ""}`;
  const image = opts.image ?? DEFAULT_OG;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Aether Chess",
      type: "website",
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}

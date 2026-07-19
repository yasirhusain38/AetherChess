import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Play Free Online Chess vs Bots & Twin | Aether",
  description:
    "Play bullet to classical chess online for free. Personality bots, Twin Bot sparring, Chess960, clocks, and saved games — no premium required.",
  path: "/play",
  keywords: ["play chess online free", "chess bots", "chess960", "twin bot chess"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

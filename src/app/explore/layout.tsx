import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Chess Opening Explorer With Win Rates | Aether",
  description:
    "Explore chess openings with masters-style win/draw/loss rates. Build repertoire knowledge free — no premium gate.",
  path: "/explore",
  keywords: ["chess opening explorer", "chess repertoire", "opening win rates"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

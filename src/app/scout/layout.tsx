import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Scout Any Chess Opponent Before Your Match | Aether",
  description:
    "Ultra-deep chess opponent scouting for Chess.com and Lichess usernames. Oracle scores, opening heatmaps, Twin Bot practice, psychological profile, and battle plans.",
  path: "/scout",
  keywords: [
    "chess opponent scouting",
    "chess stalker alternative",
    "prepare for chess opponent",
    "chess.com player analysis",
  ],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

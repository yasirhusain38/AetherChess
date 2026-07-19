import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Chess Training Platform With AI Coach | Aether",
  description:
    "Free chess training with unlimited puzzles, Puzzle Storm, and a living AI coach that builds quests from your real weaknesses.",
  path: "/train",
  keywords: ["chess training", "chess puzzles free", "AI chess coach", "puzzle storm"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

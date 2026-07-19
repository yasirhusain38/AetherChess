import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Free Chess Engine Analysis | Aether",
  description:
    "Unlimited free chess game review with engine evaluation graph, accuracy scores, move quality breakdown, critical moments, and AI-style explanations.",
  path: "/analyze",
  keywords: ["free chess engine analysis", "chess game review", "stockfish online free", "chess accuracy"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

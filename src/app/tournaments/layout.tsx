import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Online Chess Tournaments & Gauntlets | Aether",
  description:
    "Join free online chess gauntlets and events. Rated practice arenas with bots today — human Swiss and team battles next.",
  path: "/tournaments",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

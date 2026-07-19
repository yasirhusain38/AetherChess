import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Chess Studies & Collaborative Notebooks | Aether",
  description:
    "Create Lichess-style chess studies with chapters, notes, and boards. Free collaborative notebooks for coaches and students.",
  path: "/studies",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

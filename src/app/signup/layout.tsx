import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Sign Up Free for Aether Chess",
  description:
    "Create a free Aether account. Unlimited chess analysis, opponent scouting, and training — no credit card.",
  path: "/signup",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

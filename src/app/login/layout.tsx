import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Log In to Aether Chess",
  description: "Sign in to Aether with email or Google, Facebook, GitHub, and more social providers.",
  path: "/login",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

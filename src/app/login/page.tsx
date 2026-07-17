import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <Suspense fallback={<div className="text-[var(--text-muted)]">Loading…</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}

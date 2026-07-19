"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import type { SocialProviderMeta } from "@/lib/auth/providers";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

const FALLBACK_PROVIDERS: SocialProviderMeta[] = [
  {
    id: "google",
    name: "Google",
    color: "#fff",
    bg: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.14)",
    envReady: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#fff",
    bg: "rgba(24,119,242,0.25)",
    border: "rgba(24,119,242,0.45)",
    envReady: false,
  },
  {
    id: "github",
    name: "GitHub",
    color: "#fff",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.16)",
    envReady: false,
  },
  {
    id: "discord",
    name: "Discord",
    color: "#fff",
    bg: "rgba(88,101,242,0.28)",
    border: "rgba(88,101,242,0.45)",
    envReady: false,
  },
  {
    id: "apple",
    name: "Apple",
    color: "#fff",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.14)",
    envReady: false,
  },
  {
    id: "twitter",
    name: "X / Twitter",
    color: "#fff",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.14)",
    envReady: false,
  },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/play";
  const errorParam = search.get("error");

  const [providers, setProviders] = useState<SocialProviderMeta[]>(FALLBACK_PROVIDERS);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    errorParam ? mapAuthError(errorParam) : null,
  );
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error || "Could not create account");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          mode === "login"
            ? "Invalid email or password"
            : "Account created but sign-in failed — try logging in",
        );
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  const onSocial = async (id: string, ready: boolean) => {
    setError(null);
    if (!ready) {
      setInfo(
        `${id.charAt(0).toUpperCase() + id.slice(1)} is not configured yet. Add API keys in .env.local (see .env.example), then restart the server.`,
      );
      return;
    }
    setOauthLoading(id);
    try {
      await signIn(id, { callbackUrl });
    } catch {
      setError("OAuth sign-in failed");
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto fade-up">
      <div className="panel p-6 sm:p-8 space-y-6 glow-ring">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-500 text-[#061018] font-bold shadow-[0_0_24px_rgba(129,182,76,0.35)]">
              Æ
            </span>
          </Link>
          <h1 className="text-2xl font-semibold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {mode === "login"
              ? "Sign in to sync games, ratings, and scout history."
              : "Join Aether free — play, scout, and train without limits."}
          </p>
        </div>

        {/* Social */}
        <div className="space-y-2">
          <div className="section-title">Continue with</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={Boolean(oauthLoading)}
                onClick={() => onSocial(p.id, p.envReady)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-opacity",
                  !p.envReady && "opacity-70",
                )}
                style={{
                  background: p.bg,
                  border: `1px solid ${p.border}`,
                  color: p.color,
                }}
              >
                {oauthLoading === p.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ProviderIcon id={p.id} />
                )}
                {p.name}
                {!p.envReady && (
                  <span className="text-[10px] opacity-70 font-normal">setup</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
            Social buttons marked <span className="opacity-80">setup</span> need API keys in{" "}
            <code className="text-amber-400/90">.env.local</code>. Email works now without keys.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[var(--text-dim)] text-xs">
          <div className="h-px flex-1 bg-white/10" />
          or email
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onCredentials} className="space-y-3">
          {mode === "signup" && (
            <label className="block space-y-1.5">
              <span className="text-xs text-[var(--text-muted)]">Display name</span>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                />
                <input
                  className="input !pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--text-muted)]">Email</span>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
              />
              <input
                className="input !pl-9"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--text-muted)]">Password</span>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
              />
              <input
                className="input !pl-9"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
          </label>

          {error && (
            <p className="text-sm text-[var(--danger)] bg-[rgba(255,92,122,0.1)] border border-[rgba(255,92,122,0.25)] rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-amber-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              {info}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          {mode === "login" ? (
            <>
              New to Aether?{" "}
              <Link href="/signup" className="text-amber-400 hover:underline">
                Sign up free
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-amber-400 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function mapAuthError(code: string) {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "This email is already linked to another sign-in method.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Social sign-in failed. Check provider keys and callback URLs.";
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "AccessDenied":
      return "Access denied.";
    default:
      return "Authentication error. Try again.";
  }
}

function ProviderIcon({ id }: { id: string }) {
  // Simple letter badges — keeps deps light
  const letter =
    id === "google"
      ? "G"
      : id === "facebook"
        ? "f"
        : id === "github"
          ? "GH"
          : id === "discord"
            ? "D"
            : id === "apple"
              ? ""
              : "X";
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black/25 text-[10px] font-bold">
      {letter || ""}
    </span>
  );
}

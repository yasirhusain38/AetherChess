/** Which social providers are configured via env (client-safe names only) */
export type SocialProviderId =
  | "google"
  | "facebook"
  | "github"
  | "discord"
  | "apple"
  | "twitter";

export interface SocialProviderMeta {
  id: SocialProviderId;
  name: string;
  color: string;
  bg: string;
  border: string;
  /** env var pair required */
  envReady: boolean;
}

function has(...keys: string[]) {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

/** Server-side: which OAuth providers can actually run */
export function getEnabledSocialProviders(): SocialProviderId[] {
  const list: SocialProviderId[] = [];
  if (has("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET") || has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")) {
    list.push("google");
  }
  if (
    has("AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET") ||
    has("FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET")
  ) {
    list.push("facebook");
  }
  if (has("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET") || has("GITHUB_ID", "GITHUB_SECRET")) {
    list.push("github");
  }
  if (
    has("AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET") ||
    has("DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET")
  ) {
    list.push("discord");
  }
  if (has("AUTH_APPLE_ID", "AUTH_APPLE_SECRET")) {
    list.push("apple");
  }
  if (
    has("AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET") ||
    has("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET")
  ) {
    list.push("twitter");
  }
  return list;
}

export function socialProviderCatalog(enabled: SocialProviderId[]): SocialProviderMeta[] {
  const all: Omit<SocialProviderMeta, "envReady">[] = [
    {
      id: "google",
      name: "Google",
      color: "#fff",
      bg: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.14)",
    },
    {
      id: "facebook",
      name: "Facebook",
      color: "#fff",
      bg: "rgba(24,119,242,0.25)",
      border: "rgba(24,119,242,0.45)",
    },
    {
      id: "github",
      name: "GitHub",
      color: "#fff",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.16)",
    },
    {
      id: "discord",
      name: "Discord",
      color: "#fff",
      bg: "rgba(88,101,242,0.28)",
      border: "rgba(88,101,242,0.45)",
    },
    {
      id: "apple",
      name: "Apple",
      color: "#fff",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.14)",
    },
    {
      id: "twitter",
      name: "X / Twitter",
      color: "#fff",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.14)",
    },
  ];

  return all.map((p) => ({
    ...p,
    envReady: enabled.includes(p.id),
  }));
}

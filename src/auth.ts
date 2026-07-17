import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import Apple from "next-auth/providers/apple";
import Twitter from "next-auth/providers/twitter";
import type { Provider } from "next-auth/providers";
import { verifyPassword } from "@/lib/auth/users";

function env(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const googleId = env("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
  const googleSecret = env("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
  if (googleId && googleSecret) {
    providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
  }

  const fbId = env("AUTH_FACEBOOK_ID", "FACEBOOK_CLIENT_ID");
  const fbSecret = env("AUTH_FACEBOOK_SECRET", "FACEBOOK_CLIENT_SECRET");
  if (fbId && fbSecret) {
    providers.push(Facebook({ clientId: fbId, clientSecret: fbSecret }));
  }

  const ghId = env("AUTH_GITHUB_ID", "GITHUB_ID");
  const ghSecret = env("AUTH_GITHUB_SECRET", "GITHUB_SECRET");
  if (ghId && ghSecret) {
    providers.push(GitHub({ clientId: ghId, clientSecret: ghSecret }));
  }

  const discordId = env("AUTH_DISCORD_ID", "DISCORD_CLIENT_ID");
  const discordSecret = env("AUTH_DISCORD_SECRET", "DISCORD_CLIENT_SECRET");
  if (discordId && discordSecret) {
    providers.push(Discord({ clientId: discordId, clientSecret: discordSecret }));
  }

  const appleId = env("AUTH_APPLE_ID");
  const appleSecret = env("AUTH_APPLE_SECRET");
  if (appleId && appleSecret) {
    providers.push(Apple({ clientId: appleId, clientSecret: appleSecret }));
  }

  const twId = env("AUTH_TWITTER_ID", "TWITTER_CLIENT_ID");
  const twSecret = env("AUTH_TWITTER_SECRET", "TWITTER_CLIENT_SECRET");
  if (twId && twSecret) {
    providers.push(Twitter({ clientId: twId, clientSecret: twSecret }));
  }

  // Always available — email + password (local file store)
  providers.push(
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await verifyPassword(email, password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? undefined,
        };
      },
    }),
  );

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: buildProviders(),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/play",
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "aether-dev-secret-change-me-in-production",
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || token.sub || "";
        session.user.provider = token.provider as string | undefined;
      }
      return session;
    },
  },
});

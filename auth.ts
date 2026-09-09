import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";

import { authConfig } from "@/auth.config";
import { buildOAuthProviders } from "@/lib/auth/build-oauth-providers";
import { extractOAuthIdentity, upsertOAuthUser } from "@/lib/auth/oauth";
import {
  checkAuthRateLimit,
  clientKeyFromHeaders,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { verifyCredentials } from "@/lib/auth/verify-credentials";

class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.AUTH_SECRET?.trim()
) {
  throw new Error("AUTH_SECRET is required in production.");
}

function profileRecord(
  profile: unknown,
): Record<string, unknown> | null {
  if (profile && typeof profile === "object") {
    return profile as Record<string, unknown>;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        const rateKey = `login:${clientKeyFromRequest(request)}:${email.trim().toLowerCase()}`;
        if (!checkAuthRateLimit(rateKey)) {
          return null;
        }

        const result = await verifyCredentials(email, password);
        if (!result.ok) {
          if (result.reason === "locked") {
            throw new AccountLockedError();
          }
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        };
      },
    }),
    ...buildOAuthProviders(),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const headerList = await headers();
      const rateKey = `oauth:${clientKeyFromHeaders(headerList)}:${account.provider}`;
      if (!checkAuthRateLimit(rateKey)) {
        return "/login?error=oauth_denied";
      }

      const extracted = extractOAuthIdentity({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        user: { email: user.email, name: user.name },
        profile: profileRecord(profile),
      });
      if (!extracted.ok) {
        return "/login?error=oauth_email";
      }

      const result = await upsertOAuthUser(extracted.identity);
      if (!result.ok) {
        return result.reason === "email"
          ? "/login?error=oauth_email"
          : "/login?error=oauth_denied";
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && account.provider !== "credentials") {
        const extracted = extractOAuthIdentity({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          user: user
            ? { email: user.email, name: user.name }
            : null,
          profile: profileRecord(profile),
        });
        if (extracted.ok) {
          const result = await upsertOAuthUser(extracted.identity);
          if (result.ok) {
            token.id = result.user.id;
            token.role = result.user.role;
            token.email = result.user.email;
            if (result.user.name) {
              token.name = result.user.name;
            }
          }
        }
        return token;
      }

      if (user) {
        token.id = user.id;
        const role = "role" in user ? user.role : undefined;
        if (role === "CUSTOMER" || role === "ADMIN") {
          token.role = role;
        }
      }
      return token;
    },
  },
});

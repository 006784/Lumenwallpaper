import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { findOrCreateUserByEmail } from "@/lib/users";
import type { SessionUser, FrameSession } from "@/types/auth";
import type { Database } from "@/types/database";

export const MAGIC_LINK_EXPIRY_MINUTES = 15;
export const DEFAULT_SESSION_MAX_AGE_DAYS = 180;
export const SESSION_MAX_AGE_DAYS_ENV = "LUMEN_SESSION_MAX_AGE_DAYS";
export const FRAME_SESSION_COOKIE = "frame_session";

const sessionsTable = "sessions" satisfies keyof Database["public"]["Tables"];
const DEV_AUTH_SECRET = "lumen-development-auth-secret";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

type SessionTokenPayload = {
  user: SessionUser;
  expiresAt: string;
};

type DevelopmentMagicLinkPayload = {
  email: string;
  redirectTo: string;
  expiresAt: string;
};

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? "";

  if (secret) {
    return secret;
  }

  if (isDevelopmentAuthFallbackEnabled()) {
    return DEV_AUTH_SECRET;
  }

  throw new Error("NEXTAUTH_SECRET is required for authentication.");
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isDevelopmentAuthFallbackEnabled() {
  return (
    !isProductionEnvironment() &&
    process.env.LUMEN_DISABLE_DEV_AUTH_FALLBACK !== "true"
  );
}

function assertMagicLinkStorageConfigured() {
  if (!isSupabaseConfigured() && !isDevelopmentAuthFallbackEnabled()) {
    throw new Error("Supabase is required before sending magic links.");
  }
}

function signPayload(payload: string) {
  return toBase64Url(
    createHmac("sha256", getAuthSecret()).update(payload).digest(),
  );
}

function createSignedToken(payload: unknown, signatureScope: string) {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(`${signatureScope}.${body}`);

  return `${body}.${signature}`;
}

function readSignedToken<T>(token: string, signatureScope: string) {
  const [body, signature] = token.split(".");

  if (
    !body ||
    !signature ||
    !safeSignatureEquals(signPayload(`${signatureScope}.${body}`), signature)
  ) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(body).toString("utf8")) as T;
  } catch {
    return null;
  }
}

function safeSignatureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function normalizeToken(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseIdentityAllowList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function mapSessionRow(row: SessionRow) {
  return {
    id: row.id,
    email: row.email,
    redirectTo: row.redirect_to,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
  };
}

export function getAuthBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function isAuthConfigured() {
  return (
    Boolean(process.env.NEXTAUTH_SECRET) || isDevelopmentAuthFallbackEnabled()
  );
}

export function canCreateMagicLinkSessions() {
  return isSupabaseConfigured() || isDevelopmentAuthFallbackEnabled();
}

export function getSessionMaxAgeDays() {
  const configuredValue = process.env[SESSION_MAX_AGE_DAYS_ENV]?.trim();

  if (!configuredValue) {
    return DEFAULT_SESSION_MAX_AGE_DAYS;
  }

  const parsedValue = Number.parseInt(configuredValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_SESSION_MAX_AGE_DAYS;
  }

  return Math.min(Math.max(parsedValue, 1), 365);
}

export function normalizeRedirectPath(value: string | null | undefined) {
  const redirectPath = value?.trim();

  if (!redirectPath) {
    return "/";
  }

  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return "/";
  }

  return redirectPath;
}

export function createMagicLinkToken() {
  return toBase64Url(randomBytes(32));
}

export function hashMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildMagicLinkUrl(token: string) {
  const baseUrl = getAuthBaseUrl().replace(/\/+$/, "");
  return `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
}

export function createSessionCookieValue(payload: SessionTokenPayload) {
  return createSignedToken(payload, "session");
}

export function readSessionCookieValue(
  value: string | null | undefined,
): FrameSession | null {
  const token = normalizeToken(value);

  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (
    !body ||
    !signature ||
    !safeSignatureEquals(signPayload(`session.${body}`), signature)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      fromBase64Url(body).toString("utf8"),
    ) as SessionTokenPayload;
    const expiresAt = new Date(parsed.expiresAt);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    if (!parsed.user?.id || !parsed.user.email || !parsed.user.username) {
      return null;
    }

    return {
      user: parsed.user,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function getCurrentSession() {
  if (!isAuthConfigured()) {
    return null;
  }

  return readSessionCookieValue(cookies().get(FRAME_SESSION_COOKIE)?.value);
}

export function getCurrentUser() {
  return getCurrentSession()?.user ?? null;
}

export function isEditorUser(
  user: Pick<SessionUser, "email" | "username"> | null,
) {
  if (!user) {
    return false;
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const normalizedUsername = user.username.trim().toLowerCase();
  const editorEmails = parseIdentityAllowList(process.env.LUMEN_EDITOR_EMAILS);
  const editorUsernames = parseIdentityAllowList(
    process.env.LUMEN_EDITOR_USERNAMES,
  );

  return (
    (normalizedEmail.length > 0 && editorEmails.has(normalizedEmail)) ||
    editorUsernames.has(normalizedUsername)
  );
}

export function getSessionCookieOptions() {
  const sessionMaxAgeDays = getSessionMaxAgeDays();

  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * sessionMaxAgeDays,
    path: "/",
    sameSite: "lax" as const,
    secure: isProductionEnvironment(),
  };
}

function createDevelopmentMagicLinkToken(payload: DevelopmentMagicLinkPayload) {
  return createSignedToken(payload, "magic-link");
}

function readDevelopmentMagicLinkToken(token: string) {
  return readSignedToken<DevelopmentMagicLinkPayload>(token, "magic-link");
}

export async function createMagicLinkSession(
  email: string,
  redirectTo?: string | null,
) {
  assertMagicLinkStorageConfigured();

  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  if (!isSupabaseConfigured()) {
    const token = createDevelopmentMagicLinkToken({
      email: email.trim().toLowerCase(),
      redirectTo: normalizeRedirectPath(redirectTo),
      expiresAt,
    });

    return {
      token,
      expiresAt,
      magicLink: buildMagicLinkUrl(token),
    };
  }

  const token = createMagicLinkToken();
  const tokenHash = hashMagicLinkToken(token);
  const client = createSupabaseAdminClient();
  const { error } = await client.from(sessionsTable).insert({
    email: email.trim().toLowerCase(),
    token_hash: tokenHash,
    redirect_to: normalizeRedirectPath(redirectTo),
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create magic link session: ${error.message}`);
  }

  return {
    token,
    expiresAt,
    magicLink: buildMagicLinkUrl(token),
  };
}

export async function consumeMagicLinkSession(token: string) {
  assertMagicLinkStorageConfigured();

  const tokenHash = hashMagicLinkToken(token);

  if (!isSupabaseConfigured()) {
    const session = readDevelopmentMagicLinkToken(token);

    if (!session) {
      throw new Error("This login link is invalid.");
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new Error("This login link has expired.");
    }

    const user = await findOrCreateUserByEmail(session.email);
    const sessionMaxAgeDays = getSessionMaxAgeDays();
    const expiresAt = new Date(
      Date.now() + sessionMaxAgeDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      user,
      redirectTo: normalizeRedirectPath(session.redirectTo),
      sessionCookieValue: createSessionCookieValue({
        user,
        expiresAt,
      }),
      sessionExpiresAt: expiresAt,
    };
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(sessionsTable)
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load magic link session: ${error.message}`);
  }

  if (!data) {
    throw new Error("This login link is invalid.");
  }

  const session = mapSessionRow(data);

  if (session.usedAt) {
    throw new Error("This login link has already been used.");
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new Error("This login link has expired.");
  }

  const { data: consumed, error: consumeError } = await client
    .from(sessionsTable)
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError) {
    throw new Error(
      `Failed to consume magic link session: ${consumeError.message}`,
    );
  }

  if (!consumed) {
    throw new Error("This login link is no longer valid.");
  }

  const user = await findOrCreateUserByEmail(session.email);
  const sessionMaxAgeDays = getSessionMaxAgeDays();
  const expiresAt = new Date(
    Date.now() + sessionMaxAgeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  return {
    user,
    redirectTo: normalizeRedirectPath(session.redirectTo),
    sessionCookieValue: createSessionCookieValue({
      user,
      expiresAt,
    }),
    sessionExpiresAt: expiresAt,
  };
}

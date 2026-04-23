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
export const SESSION_MAX_AGE_DAYS = 30;
export const FRAME_SESSION_COOKIE = "frame_session";

const sessionsTable = "sessions" satisfies keyof Database["public"]["Tables"];

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

type SessionTokenPayload = {
  user: SessionUser;
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

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for authentication.");
  }

  return secret;
}

function signPayload(payload: string) {
  return toBase64Url(
    createHmac("sha256", getAuthSecret()).update(payload).digest(),
  );
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
  return Boolean(process.env.NEXTAUTH_SECRET);
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
  const serialized = JSON.stringify(payload);
  const body = toBase64Url(serialized);
  const signature = signPayload(body);
  return `${body}.${signature}`;
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
    !safeSignatureEquals(signPayload(body), signature)
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
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createMagicLinkSession(
  email: string,
  redirectTo?: string | null,
) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is required before sending magic links.");
  }

  const token = createMagicLinkToken();
  const tokenHash = hashMagicLinkToken(token);
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();
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
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is required before verifying magic links.");
  }

  const tokenHash = hashMagicLinkToken(token);
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
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
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

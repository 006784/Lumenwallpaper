import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { SessionUser } from "@/types/auth";

const usersTable = "users" satisfies keyof Database["public"]["Tables"];

type UserRow = Database["public"]["Tables"]["users"]["Row"];

function slugifyUsername(input: string) {
  const sanitized = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || `frame-user-${crypto.randomUUID().slice(0, 8)}`;
}

function mapSessionUser(row: UserRow): SessionUser {
  return {
    id: String(row.id),
    email: row.email ?? "",
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
  };
}

async function ensureUniqueUsername(baseUsername: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(usersTable)
    .select("username")
    .like("username", `${baseUsername}%`);

  if (error) {
    throw new Error(`Failed to validate username uniqueness: ${error.message}`);
  }

  const existing = new Set(data.map((row) => row.username));

  if (!existing.has(baseUsername)) {
    return baseUsername;
  }

  let suffix = 2;

  while (existing.has(`${baseUsername}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseUsername}-${suffix}`;
}

export async function findUserByEmail(email: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(usersTable)
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user by email: ${error.message}`);
  }

  return data ? mapSessionUser(data) : null;
}

export async function findUserById(id: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const numericId = /^\d+$/.test(id) ? Number(id) : id;
  const { data, error } = await client
    .from(usersTable)
    .select("*")
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user by id: ${error.message}`);
  }

  return data ? mapSessionUser(data) : null;
}

export async function findOrCreateUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required to resolve a user.");
  }

  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    return existing;
  }

  const client = createSupabaseAdminClient();
  const usernameSeed = slugifyUsername(normalizedEmail.split("@")[0] ?? "frame-user");
  const username = await ensureUniqueUsername(usernameSeed);
  const { data, error } = await client
    .from(usersTable)
    .insert({
      email: normalizedEmail,
      username,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return mapSessionUser(data);
}

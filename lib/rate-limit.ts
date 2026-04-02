type RateLimitSource = "memory" | "upstash";

type RateLimitPolicy = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  source: RateLimitSource;
};

type MemoryRateLimitEntry = {
  count: number;
  resetAt: number;
};

const MEMORY_PRUNE_THRESHOLD = 1000;

declare global {
  // eslint-disable-next-line no-var
  var __lumenRateLimitStore: Map<string, MemoryRateLimitEntry> | undefined;
}

function getMemoryStore() {
  if (!globalThis.__lumenRateLimitStore) {
    globalThis.__lumenRateLimitStore = new Map();
  }

  return globalThis.__lumenRateLimitStore;
}

function pruneExpiredMemoryEntries(store: Map<string, MemoryRateLimitEntry>) {
  if (store.size < MEMORY_PRUNE_THRESHOLD) {
    return;
  }

  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function getUpstashConfig() {
  return {
    url: process.env.UPSTASH_REDIS_URL ?? "",
    token: process.env.UPSTASH_REDIS_TOKEN ?? "",
  };
}

export function isUpstashRateLimitConfigured() {
  const config = getUpstashConfig();
  return Boolean(config.url && config.token);
}

async function executeUpstashCommand<T = unknown>(command: string[]) {
  const config = getUpstashConfig();

  if (!config.url || !config.token) {
    throw new Error("Upstash Redis is not configured.");
  }

  const baseUrl = config.url.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/${command.map((part) => encodeURIComponent(part)).join("/")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    result?: T;
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        `Upstash request failed with status ${response.status}.`,
    );
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload?.result as T;
}

async function consumeUpstashRateLimit(
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const totalCount = Number(
    await executeUpstashCommand<number>(["INCR", policy.key]),
  );

  if (totalCount === 1) {
    await executeUpstashCommand([
      "EXPIRE",
      policy.key,
      String(policy.windowSeconds),
    ]);
  }

  let ttlSeconds = Number(
    await executeUpstashCommand<number>(["TTL", policy.key]),
  );

  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 0) {
    await executeUpstashCommand([
      "EXPIRE",
      policy.key,
      String(policy.windowSeconds),
    ]);
    ttlSeconds = policy.windowSeconds;
  }

  const retryAfterSeconds = Math.max(1, ttlSeconds);

  return {
    allowed: totalCount <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - totalCount),
    resetAt: Date.now() + retryAfterSeconds * 1000,
    retryAfterSeconds,
    source: "upstash",
  };
}

function consumeMemoryRateLimit(policy: RateLimitPolicy): RateLimitResult {
  const store = getMemoryStore();
  const now = Date.now();
  pruneExpiredMemoryEntries(store);

  const existingEntry = store.get(policy.key);
  const activeEntry =
    existingEntry && existingEntry.resetAt > now
      ? existingEntry
      : {
          count: 0,
          resetAt: now + policy.windowSeconds * 1000,
        };

  activeEntry.count += 1;
  store.set(policy.key, activeEntry);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((activeEntry.resetAt - now) / 1000),
  );

  return {
    allowed: activeEntry.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - activeEntry.count),
    resetAt: activeEntry.resetAt,
    retryAfterSeconds,
    source: "memory",
  };
}

export async function consumeRateLimit(
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  if (isUpstashRateLimitConfigured()) {
    try {
      return await consumeUpstashRateLimit(policy);
    } catch {
      return consumeMemoryRateLimit(policy);
    }
  }

  return consumeMemoryRateLimit(policy);
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "X-RateLimit-Source": result.source,
  };
}

export function normalizeRateLimitKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/gi, "-");
}

export function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  const candidate =
    cloudflareIp || forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return normalizeRateLimitKeyPart(candidate);
}

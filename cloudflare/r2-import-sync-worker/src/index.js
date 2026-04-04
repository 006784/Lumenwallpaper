const GENERATED_PREFIXES = ["compressed/", "thumbnails/", "previews/"];
const SUPPORTED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "webm",
  "mov",
]);
const DEFAULT_BATCH_SIZE = 24;

function getExtension(key) {
  const normalizedKey = key.trim().replace(/^\/+/, "");
  const filename = normalizedKey.split("/").pop() ?? "";
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  return extension;
}

function isGeneratedVariantKey(key) {
  return GENERATED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isImportableKey(key) {
  if (!key || key.endsWith("/")) {
    return false;
  }

  if (isGeneratedVariantKey(key)) {
    return false;
  }

  return SUPPORTED_EXTENSIONS.has(getExtension(key));
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function normalizeQueueObjects(messages) {
  const objects = [];
  const seenKeys = new Set();

  for (const message of messages) {
    const body = message.body ?? {};
    const key =
      typeof body?.object?.key === "string" ? body.object.key.trim() : "";
    const normalizedKey = key.replace(/^\/+/, "");
    const size =
      typeof body?.object?.size === "number" && body.object.size > 0
        ? body.object.size
        : 0;
    const lastModified =
      typeof body?.eventTime === "string"
        ? body.eventTime
        : typeof body?.timestamp === "string"
          ? body.timestamp
          : null;

    if (!normalizedKey || size <= 0 || !isImportableKey(normalizedKey)) {
      continue;
    }

    if (seenKeys.has(normalizedKey)) {
      continue;
    }

    seenKeys.add(normalizedKey);
    objects.push({
      key: normalizedKey,
      size,
      lastModified,
    });
  }

  return objects;
}

async function pushImportWebhook(env, objects) {
  if (!env.LUMEN_IMPORT_WEBHOOK_URL || !env.LUMEN_IMPORT_WEBHOOK_SECRET) {
    throw new Error(
      "Missing LUMEN_IMPORT_WEBHOOK_URL or LUMEN_IMPORT_WEBHOOK_SECRET.",
    );
  }

  const webhookBatchSize = parsePositiveInteger(
    env.LUMEN_IMPORT_WEBHOOK_BATCH_SIZE,
    DEFAULT_BATCH_SIZE,
  );

  for (const batch of chunk(objects, webhookBatchSize)) {
    const response = await fetch(env.LUMEN_IMPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LUMEN_IMPORT_WEBHOOK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorUsername: env.LUMEN_IMPORT_SYNC_CREATOR_USERNAME || undefined,
        objects: batch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Import webhook failed with ${response.status}: ${errorText}`,
      );
    }
  }
}

export default {
  async fetch(_request, env) {
    return Response.json({
      ok: true,
      queueReady: true,
      webhookUrlConfigured: Boolean(env.LUMEN_IMPORT_WEBHOOK_URL),
    });
  },

  async queue(batch, env) {
    const objects = normalizeQueueObjects(batch.messages);

    if (objects.length === 0) {
      return;
    }

    await pushImportWebhook(env, objects);
  },
};

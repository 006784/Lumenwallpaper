import {
  importR2CandidatesToWallpapers,
  importSpecificR2ObjectsToWallpapers,
} from "@/lib/wallpapers";
import type { R2ImportObjectInput } from "@/types/r2-import";

const DEFAULT_R2_IMPORT_SYNC_LIMIT = 100;

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getR2ImportSyncConfig() {
  return {
    creatorUsername:
      process.env.R2_IMPORT_SYNC_CREATOR_USERNAME?.trim() ||
      process.env.LUMEN_DEFAULT_IMPORT_CREATOR_USERNAME?.trim() ||
      "Lumen",
    limit: parsePositiveInteger(
      process.env.R2_IMPORT_SYNC_LIMIT,
      DEFAULT_R2_IMPORT_SYNC_LIMIT,
    ),
    prefix: process.env.R2_IMPORT_SYNC_PREFIX?.trim() || undefined,
  };
}

export async function runR2ImportSync(
  options?: Partial<ReturnType<typeof getR2ImportSyncConfig>> & {
    objects?: R2ImportObjectInput[];
  },
) {
  const defaults = getR2ImportSyncConfig();

  if (options?.objects?.length) {
    return importSpecificR2ObjectsToWallpapers({
      creatorUsername:
        options.creatorUsername?.trim() || defaults.creatorUsername,
      objects: options.objects,
    });
  }

  return importR2CandidatesToWallpapers({
    creatorUsername: options?.creatorUsername?.trim() || defaults.creatorUsername,
    limit: options?.limit ?? defaults.limit,
    prefix: options?.prefix?.trim() || defaults.prefix,
  });
}

export function getCronSecret() {
  return process.env.CRON_SECRET?.trim() || "";
}

export function getR2ImportWebhookSecret() {
  return process.env.R2_IMPORT_WEBHOOK_SECRET?.trim() || "";
}

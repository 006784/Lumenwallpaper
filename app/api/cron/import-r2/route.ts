import {
  captureServerException,
  createRouteLogger,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCronSecret, getR2ImportSyncConfig, runR2ImportSync } from "@/lib/r2-import-sync";
import { isR2Configured } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

function ensureCronAccess(request: Request) {
  const secret = getCronSecret();

  if (!secret) {
    return jsonError("CRON_SECRET is not configured.", {
      status: 503,
      code: "CRON_NOT_CONFIGURED",
    });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return jsonError("Unauthorized cron request.", {
      status: 401,
      code: "CRON_UNAUTHORIZED",
    });
  }

  return null;
}

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/cron/import-r2", request);
  const unauthorizedResponse = ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (!isSupabaseConfigured()) {
    return jsonError("Supabase is not configured.", {
      status: 503,
      code: "SUPABASE_NOT_CONFIGURED",
    });
  }

  if (!isR2Configured()) {
    return jsonError("R2 is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
    });
  }

  const syncConfig = getR2ImportSyncConfig();

  logger.start({
    action: "cron-import",
    creatorUsername: syncConfig.creatorUsername,
    limit: syncConfig.limit,
    prefix: syncConfig.prefix ?? null,
  });

  try {
    const summary = await runR2ImportSync();

    logger.done("r2.import.cron.completed", {
      failedCount: summary.failedCount,
      importedCount: summary.importedCount,
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      message: "Scheduled R2 import completed.",
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/cron/import-r2",
      tags: {
        action: "cron-import",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to import R2 objects via cron.",
      {
        status: 500,
        code: "R2_IMPORT_CRON_FAILED",
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}

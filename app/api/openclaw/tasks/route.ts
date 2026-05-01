import { z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { enqueueGoogleCloudHttpTask } from "@/lib/google-cloud-tasks";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";

const taskSchema = z.object({
  action: z.enum(["reanalyze_wallpapers", "backfill_wallpapers"]),
  body: z.record(z.string(), z.unknown()).optional().default({}),
  scheduleTime: z.string().datetime().optional(),
});

function getTaskTargetBaseUrl() {
  const configured = process.env.GOOGLE_CLOUD_TASKS_TARGET_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();

  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  return vercelUrl ? `https://${vercelUrl}` : null;
}

function getTaskTargetPath(action: z.infer<typeof taskSchema>["action"]) {
  switch (action) {
    case "backfill_wallpapers":
      return "/api/openclaw/wallpapers/backfill";
    case "reanalyze_wallpapers":
      return "/api/openclaw/wallpapers/reanalyze";
  }
}

function getConfiguredOpenClawApiKey() {
  return (
    process.env.OPENCLAW_API_KEY?.trim().replace(/\\n/g, "\n").trim() ||
    process.env.LUMEN_OPENCLAW_API_KEY?.trim().replace(/\\n/g, "\n").trim() ||
    null
  );
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/tasks", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/tasks");

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = taskSchema.parse(await request.json());
    const targetBaseUrl = getTaskTargetBaseUrl();
    const openClawApiKey = getConfiguredOpenClawApiKey();

    if (!targetBaseUrl || !openClawApiKey) {
      return jsonError("Cloud task target is not configured.", {
        status: 503,
        code: "CLOUD_TASK_TARGET_NOT_CONFIGURED",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    logger.start({
      action: payload.action,
      actor: auth.actor,
      scheduled: Boolean(payload.scheduleTime),
    });

    const task = await enqueueGoogleCloudHttpTask({
      body: payload.body,
      headers: {
        Authorization: `Bearer ${openClawApiKey}`,
        "X-OpenClaw-Actor": "google-cloud-tasks",
      },
      scheduleTime: payload.scheduleTime,
      url: `${targetBaseUrl}${getTaskTargetPath(payload.action)}`,
    });

    logger.done("openclaw.cloud_task.enqueued", {
      action: payload.action,
      actor: auth.actor,
      taskName: task.name,
    });

    return jsonSuccess(
      {
        action: payload.action,
        task,
      },
      {
        headers: getOpenClawPrivateHeaders(),
        message: "Google Cloud task enqueued.",
        status: 202,
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid Cloud task payload.", {
        status: 400,
        code: "INVALID_CLOUD_TASK_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/tasks",
      tags: {
        method: "POST",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to enqueue Cloud task.",
      {
        status: 500,
        code: "CLOUD_TASK_ENQUEUE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

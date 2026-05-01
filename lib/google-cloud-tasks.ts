import {
  getGoogleCloudAccessToken,
  getGoogleCloudProjectId,
} from "@/lib/google-cloud-auth";

const CLOUD_TASKS_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

export type GoogleCloudTaskInput = {
  body?: unknown;
  headers?: Record<string, string>;
  scheduleTime?: string;
  url: string;
};

function getCloudTasksConfig() {
  const projectId = getGoogleCloudProjectId();
  const location = process.env.GOOGLE_CLOUD_TASKS_LOCATION?.trim();
  const queue = process.env.GOOGLE_CLOUD_TASKS_QUEUE?.trim();

  if (!projectId || !location || !queue) {
    return null;
  }

  return {
    location,
    parent: `projects/${projectId}/locations/${location}/queues/${queue}`,
    projectId,
    queue,
    serviceAccountEmail:
      process.env.GOOGLE_CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL?.trim() || null,
  };
}

export function isGoogleCloudTasksConfigured() {
  return Boolean(getCloudTasksConfig());
}

export async function enqueueGoogleCloudHttpTask(input: GoogleCloudTaskInput) {
  const config = getCloudTasksConfig();

  if (!config) {
    throw new Error("Google Cloud Tasks is not configured.");
  }

  const accessToken = await getGoogleCloudAccessToken([CLOUD_TASKS_SCOPE]);
  const task: Record<string, unknown> = {
    httpRequest: {
      body:
        input.body === undefined
          ? undefined
          : Buffer.from(JSON.stringify(input.body)).toString("base64"),
      headers: {
        "Content-Type": "application/json",
        ...input.headers,
      },
      httpMethod: "POST",
      url: input.url,
      ...(config.serviceAccountEmail
        ? {
            oidcToken: {
              serviceAccountEmail: config.serviceAccountEmail,
            },
          }
        : {}),
    },
    ...(input.scheduleTime ? { scheduleTime: input.scheduleTime } : {}),
  };

  const response = await fetch(
    `https://cloudtasks.googleapis.com/v2/${config.parent}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task }),
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        name?: string;
        scheduleTime?: string;
      }
    | null;

  if (!response.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ||
        `Google Cloud Tasks enqueue failed with status ${response.status}.`,
    );
  }

  return {
    name: payload?.name ?? null,
    scheduleTime: payload?.scheduleTime ?? null,
  };
}

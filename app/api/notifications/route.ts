import { z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/wallpapers";

const updateNotificationsSchema = z.object({
  readAll: z.literal(true),
});

export async function PATCH(request: Request) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before updating notifications.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    updateNotificationsSchema.parse(await request.json());
    const result = await markAllNotificationsAsRead(currentUser.id);

    return jsonSuccess(result, {
      message: "Notifications updated.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid notifications payload.", {
        status: 400,
        code: "INVALID_NOTIFICATIONS_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/notifications",
    });
    const message =
      error instanceof Error ? error.message : "Failed to update notifications.";

    return jsonError(message, {
      status: 500,
      code: "NOTIFICATIONS_UPDATE_FAILED",
    });
  }
}

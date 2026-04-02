import { z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/wallpapers";

const updateNotificationSchema = z.object({
  read: z.literal(true),
});

type NotificationRouteProps = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: NotificationRouteProps,
) {
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
    updateNotificationSchema.parse(await request.json());
    const notification = await markNotificationAsRead(params.id, currentUser.id);

    if (!notification) {
      return jsonError("Notification not found.", {
        status: 404,
        code: "NOTIFICATION_NOT_FOUND",
      });
    }

    return jsonSuccess(notification, {
      message: "Notification updated.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid notification payload.", {
        status: 400,
        code: "INVALID_NOTIFICATION_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/notifications/[id]",
    });
    const message =
      error instanceof Error ? error.message : "Failed to update notification.";

    return jsonError(message, {
      status: 500,
      code: "NOTIFICATION_UPDATE_FAILED",
    });
  }
}

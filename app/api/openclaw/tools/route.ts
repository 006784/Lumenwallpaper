import { createRouteLogger, jsonSuccess } from "@/lib/api";
import { buildOpenClawToolManifest } from "@/lib/openclaw-catalog";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/tools", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/tools");

  if (auth instanceof Response) {
    return auth;
  }

  logger.done("openclaw.tools.loaded", {
    actor: auth.actor,
    count: buildOpenClawToolManifest().tools.length,
  });

  return jsonSuccess(buildOpenClawToolManifest(), {
    headers: getOpenClawPrivateHeaders(),
    message: "OpenClaw tool manifest loaded.",
  });
}

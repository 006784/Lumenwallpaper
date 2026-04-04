import { createRouteLogger, jsonSuccess } from "@/lib/api";
import { buildOpenClawAgentToolManifest } from "@/lib/openclaw-catalog";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/tools/agents", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/tools/agents");

  if (auth instanceof Response) {
    return auth;
  }

  const manifest = buildOpenClawAgentToolManifest(new URL(request.url).origin);

  logger.done("openclaw.tools.agents.loaded", {
    actor: auth.actor,
    count: manifest.tools.length,
  });

  return jsonSuccess(manifest, {
    headers: getOpenClawPrivateHeaders(),
    message: "OpenClaw agent tool manifest loaded.",
  });
}

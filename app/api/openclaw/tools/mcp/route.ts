import { createRouteLogger, jsonSuccess } from "@/lib/api";
import { buildOpenClawMcpImportManifest } from "@/lib/openclaw-catalog";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/tools/mcp", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/tools/mcp");

  if (auth instanceof Response) {
    return auth;
  }

  const manifest = buildOpenClawMcpImportManifest(new URL(request.url).origin);

  logger.done("openclaw.tools.mcp.loaded", {
    actor: auth.actor,
    count: manifest.tools.length,
  });

  return jsonSuccess(manifest, {
    headers: getOpenClawPrivateHeaders(),
    message: "OpenClaw MCP import manifest loaded.",
  });
}

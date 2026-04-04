import { createRouteLogger, jsonSuccess } from "@/lib/api";
import { openClawApiEndpoints } from "@/lib/openclaw-catalog";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";
import type { OpenClawApiManifest } from "@/types/openclaw-api";

const manifest: OpenClawApiManifest = {
  name: "Lumen OpenClaw Management API",
  version: "2026-04-03",
  auth: {
    type: "apiKey",
    primaryHeader: "Authorization: Bearer <OPENCLAW_API_KEY>",
    fallbackHeaders: ["x-openclaw-key", "x-api-key"],
  },
  endpoints: openClawApiEndpoints,
  toolsPath: "/api/openclaw/tools",
  agentsToolsPath: "/api/openclaw/tools/agents",
  mcpToolsPath: "/api/openclaw/tools/mcp",
};

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw");

  if (auth instanceof Response) {
    return auth;
  }

  logger.done("openclaw.manifest.loaded", {
    actor: auth.actor,
  });

  return jsonSuccess(manifest, {
    headers: getOpenClawPrivateHeaders(),
    message: "OpenClaw management API loaded.",
  });
}

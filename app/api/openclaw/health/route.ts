import { jsonSuccess } from "@/lib/api";
import { isAuthConfigured } from "@/lib/auth";
import {
  getOpenClawPrivateHeaders,
  isOpenClawConfigured,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";
import {
  isSentryConfigured,
  shouldEnableVercelAnalytics,
  shouldEnableVercelSpeedInsights,
} from "@/lib/monitoring";
import { isGoogleCloudTasksConfigured } from "@/lib/google-cloud-tasks";
import { isGoogleVisionConfigured } from "@/lib/google-vision";
import { isR2Configured } from "@/lib/r2";
import { isResendConfigured } from "@/lib/resend";
import { isSupabaseConfigured } from "@/lib/supabase";

function getConfiguredAiProviderCount() {
  return [
    process.env.AI_VISION_GEMINI_API_KEY,
    process.env.AI_VISION_QWEN_API_KEY,
    process.env.AI_VISION_KIMI_API_KEY,
    process.env.AI_VISION_OPENROUTER_API_KEY,
    process.env.AI_VISION_OPENAI_API_KEY,
    process.env.AI_VISION_CUSTOM_1_API_KEY,
    process.env.AI_VISION_CUSTOM_2_API_KEY,
    process.env.GOOGLE_CLOUD_VISION_API_KEY ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64,
  ].filter(Boolean).length;
}

export async function GET(request: Request) {
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/health");

  if (auth instanceof Response) {
    return auth;
  }

  return jsonSuccess(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      actor: auth.actor,
      checks: {
        auth: isAuthConfigured(),
        openclaw: isOpenClawConfigured(),
        r2: isR2Configured(),
        resend: isResendConfigured(),
        sentry: isSentryConfigured(),
        supabase: isSupabaseConfigured(),
        googleCloudTasks: isGoogleCloudTasksConfigured(),
        googleVision: isGoogleVisionConfigured(),
        vercelAnalytics: shouldEnableVercelAnalytics(),
        vercelSpeedInsights: shouldEnableVercelSpeedInsights(),
      },
      aiProvidersConfigured: getConfiguredAiProviderCount(),
    },
    {
      headers: getOpenClawPrivateHeaders(),
      message: "OpenClaw health check loaded.",
    },
  );
}

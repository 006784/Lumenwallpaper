import {
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/lib/cache";
import { jsonSuccess } from "@/lib/api";
import { isAuthConfigured } from "@/lib/auth";
import {
  isSentryConfigured,
  shouldEnableVercelAnalytics,
  shouldEnableVercelSpeedInsights,
} from "@/lib/monitoring";
import { isR2Configured } from "@/lib/r2";
import { isResendConfigured } from "@/lib/resend";
import { isSupabaseConfigured } from "@/lib/supabase";

function getConfiguredAiProviderCount() {
  return [
    process.env.AI_VISION_QWEN_API_KEY,
    process.env.AI_VISION_KIMI_API_KEY,
    process.env.AI_VISION_OPENROUTER_API_KEY,
    process.env.AI_VISION_OPENAI_API_KEY,
    process.env.AI_VISION_CUSTOM_1_API_KEY,
    process.env.AI_VISION_CUSTOM_2_API_KEY,
  ].filter(Boolean).length;
}

export async function GET() {
  return jsonSuccess(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      checks: {
        auth: isAuthConfigured(),
        r2: isR2Configured(),
        resend: isResendConfigured(),
        sentry: isSentryConfigured(),
        supabase: isSupabaseConfigured(),
        vercelAnalytics: shouldEnableVercelAnalytics(),
        vercelSpeedInsights: shouldEnableVercelSpeedInsights(),
      },
      aiProvidersConfigured: getConfiguredAiProviderCount(),
    },
    {
      headers: {
        "Cache-Control": PRIVATE_NO_STORE_CACHE_CONTROL,
      },
      message: "Lumen health check loaded.",
    },
  );
}

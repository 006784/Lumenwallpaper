import { z } from "zod";

const DEFAULT_PROVIDER_ORDER = [
  "gemini",
  "qwen",
  "kimi",
  "openrouter",
  "openai",
  "custom_1",
  "custom_2",
] as const;

const DEFAULT_ANALYSIS_TIMEOUT_MS = 12000;
const MAX_ANALYSIS_TIMEOUT_MS = 20000;

const wallpaperAiMetadataSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  caption: z
    .string()
    .trim()
    .max(220)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  tags: z.array(z.string().trim().min(1).max(32)).min(1).max(12).default([]),
});

type WallpaperAiMetadata = z.infer<typeof wallpaperAiMetadataSchema>;

type ProviderPreset = {
  baseUrl: string;
  label: string;
  model: string;
};

type VisionProviderConfig = {
  apiKey: string;
  baseUrl: string;
  headers?: Record<string, string>;
  id: string;
  label: string;
  model: string;
};

type VisionProviderResult = WallpaperAiMetadata & {
  model: string;
  providerId: string;
  providerLabel: string;
};

export type WallpaperAiProviderOverride = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  provider: "gemini";
};

const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  gemini: {
    label: "Gemini 2.5 Flash",
    model: "gemini-2.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  },
  qwen: {
    label: "Qwen 3.5 Flash",
    model: "qwen3.5-flash",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  kimi: {
    label: "Kimi K2.5",
    model: "kimi-k2.5",
    baseUrl: "https://api.moonshot.cn/v1",
  },
  openrouter: {
    label: "OpenRouter Gemini 2.5 Flash-Lite",
    model: "google/gemini-2.5-flash-lite",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  openai: {
    label: "OpenAI GPT-5 mini",
    model: "gpt-5-mini",
    baseUrl: "https://api.openai.com/v1",
  },
};

function normalizeProviderOrder() {
  const rawValue = process.env.AI_VISION_PROVIDER_ORDER;

  if (!rawValue) {
    return [...DEFAULT_PROVIDER_ORDER];
  }

  const configuredOrder = rawValue
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return configuredOrder.length > 0
    ? [...new Set(configuredOrder)]
    : [...DEFAULT_PROVIDER_ORDER];
}

function getTimeoutMs() {
  const rawValue = Number.parseInt(process.env.AI_VISION_TIMEOUT_MS ?? "", 10);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_ANALYSIS_TIMEOUT_MS;
  }

  return Math.min(rawValue, MAX_ANALYSIS_TIMEOUT_MS);
}

function getCustomProviderConfig(slot: "custom_1" | "custom_2") {
  const suffix = slot === "custom_1" ? "1" : "2";
  const name = process.env[`AI_VISION_CUSTOM_${suffix}_NAME`];
  const apiKey = process.env[`AI_VISION_CUSTOM_${suffix}_API_KEY`];
  const baseUrl = process.env[`AI_VISION_CUSTOM_${suffix}_BASE_URL`];
  const model = process.env[`AI_VISION_CUSTOM_${suffix}_MODEL`];

  if (!name || !apiKey || !baseUrl || !model) {
    return null;
  }

  return {
    id: slot,
    label: name,
    apiKey,
    baseUrl,
    model,
  } satisfies VisionProviderConfig;
}

function getPresetProviderConfig(
  id: keyof typeof PROVIDER_PRESETS,
): VisionProviderConfig | null {
  const preset = PROVIDER_PRESETS[id];
  const apiKey = process.env[`AI_VISION_${id.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    return null;
  }

  const baseUrl =
    process.env[`AI_VISION_${id.toUpperCase()}_BASE_URL`] || preset.baseUrl;
  const model =
    process.env[`AI_VISION_${id.toUpperCase()}_MODEL`] || preset.model;
  const headers: Record<string, string> = {};

  if (id === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.NEXTAUTH_URL || "http://localhost:3000";
    headers["X-Title"] = "Lumen";
  }

  return {
    id,
    label: preset.label,
    apiKey,
    baseUrl,
    model,
    headers,
  };
}

export function getConfiguredWallpaperAiProviders() {
  return normalizeProviderOrder()
    .map((providerId) => {
      if (providerId === "custom_1" || providerId === "custom_2") {
        return getCustomProviderConfig(providerId);
      }

      if (providerId in PROVIDER_PRESETS) {
        return getPresetProviderConfig(
          providerId as keyof typeof PROVIDER_PRESETS,
        );
      }

      return null;
    })
    .filter((provider): provider is VisionProviderConfig => provider !== null);
}

function getOverrideWallpaperAiProviders(
  override: WallpaperAiProviderOverride | undefined,
) {
  if (!override?.apiKey.trim()) {
    return null;
  }

  const preset = PROVIDER_PRESETS[override.provider];

  return [
    {
      id: override.provider,
      label: preset.label,
      apiKey: override.apiKey.trim(),
      baseUrl: override.baseUrl?.trim() || preset.baseUrl,
      model: override.model?.trim() || preset.model,
      headers: {},
    } satisfies VisionProviderConfig,
  ];
}

export function isWallpaperAiConfigured() {
  return getConfiguredWallpaperAiProviders().length > 0;
}

function extractJsonCandidate(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  const source = fencedMatch?.[1] ?? trimmed;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Provider did not return a JSON object: ${trimmed.slice(0, 220)}`,
    );
  }

  return source.slice(start, end + 1);
}

function normalizeAiTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(
    0,
    12,
  );
}

function extractCompletionText(payload: unknown) {
  const content = (
    payload as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ text?: string; type?: string }>;
        };
      }>;
    }
  )?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim();
  }

  throw new Error("Provider did not return message content.");
}

function createAnalysisPrompt(input: {
  description?: string | null;
  title: string;
}) {
  const description = input.description?.trim();

  return [
    "请仔细分析这张壁纸预览图，只返回一个 JSON 对象，不要输出任何额外解释。",
    'JSON 结构固定为：{"category":"nature|city|abstract|architecture|illustration|anime|space|minimal|people|other","caption":"一句中文短描述","tags":["中文标签1","中文标签2"]}',
    "要求：",
    "1. tags 返回 6 到 10 个中文短标签，去重，不要带井号。",
    "2. caption 控制在 24 个中文字符以内。",
    "3. category 必须从给定枚举里选择一个。",
    "4. tags 优先描述画面主体、场景、风格、色彩、光线、构图和情绪，避免“高清”“壁纸”“图片”等泛词。",
    "5. 不要输出分辨率、尺寸、水印、UI 元素。",
    "6. 如果有人物，只标注可见事实，例如人像、女性、男性、舞台、街拍、肖像；除非标题/描述明确给出姓名，否则不要猜测具体人物姓名。",
    "7. 如果信息不足，也要给出最合理的分类和标签，但不要编造不存在的物体。",
    `标题参考：${input.title}`,
    description ? `描述参考：${description}` : "描述参考：无",
  ].join("\n");
}

function getProviderErrorMessage(payload: unknown, fallbackStatus: number) {
  const apiMessage =
    (payload as { error?: { message?: string } })?.error?.message ??
    (typeof (payload as { error?: unknown })?.error === "string"
      ? (payload as { error: string }).error
      : null) ??
    (payload as { message?: string })?.message;

  if (apiMessage) {
    return apiMessage;
  }

  const serializedPayload = payload ? JSON.stringify(payload).slice(0, 500) : "";

  return serializedPayload
    ? `Provider responded with status ${fallbackStatus}: ${serializedPayload}`
    : `Provider responded with status ${fallbackStatus}.`;
}

async function callOpenAiCompatibleVisionProvider(
  provider: VisionProviderConfig,
  input: {
    description?: string | null;
    imageUrl: string;
    title: string;
  },
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const baseUrl = provider.baseUrl.endsWith("/")
    ? provider.baseUrl.slice(0, -1)
    : provider.baseUrl;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...provider.headers,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是壁纸内容理解助手。你的任务是为壁纸图片输出稳定、精简、可搜索的中文分类与标签。",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: createAnalysisPrompt(input),
              },
              {
                type: "image_url",
                image_url: {
                  url: input.imageUrl,
                },
              },
            ],
          },
        ],
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getProviderErrorMessage(payload, response.status));
    }

    const text = extractCompletionText(payload);
    const parsed = wallpaperAiMetadataSchema.parse(
      JSON.parse(extractJsonCandidate(text)),
    );

    return {
      providerId: provider.id,
      providerLabel: provider.label,
      model: provider.model,
      category: parsed.category,
      caption: parsed.caption,
      tags: normalizeAiTags(parsed.tags),
    } satisfies VisionProviderResult;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeWallpaperWithFallback(input: {
  description?: string | null;
  imageUrl: string;
  title: string;
}, options: {
  providerOverride?: WallpaperAiProviderOverride;
} = {}) {
  const providers =
    getOverrideWallpaperAiProviders(options.providerOverride) ??
    getConfiguredWallpaperAiProviders();

  if (providers.length === 0) {
    return null;
  }

  const startedAt = Date.now();
  const providerErrors: string[] = [];

  for (const provider of providers) {
    const remainingMs = getTimeoutMs() - (Date.now() - startedAt);

    if (remainingMs <= 1000) {
      break;
    }

    try {
      return await callOpenAiCompatibleVisionProvider(
        provider,
        input,
        remainingMs,
      );
    } catch (error) {
      providerErrors.push(
        `${provider.id}: ${
          error instanceof Error ? error.message : "Unknown provider error."
        }`,
      );
    }
  }

  throw new Error(
    providerErrors.length > 0
      ? `All AI vision providers failed. ${providerErrors.join(" | ")}`
      : "AI vision analysis timed out before any provider could complete.",
  );
}

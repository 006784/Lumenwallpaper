import { getGoogleCloudAccessToken } from "@/lib/google-cloud-auth";

export type GoogleVisionLikelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

export type GoogleVisionSafetyResult = {
  adult: GoogleVisionLikelihood;
  medical: GoogleVisionLikelihood;
  racy: GoogleVisionLikelihood;
  spoof: GoogleVisionLikelihood;
  violence: GoogleVisionLikelihood;
};

export type GoogleVisionImageAnalysis = {
  labels: string[];
  localizedLabels: string[];
  riskLevel: "low" | "medium" | "high" | "blocked";
  safety: GoogleVisionSafetyResult | null;
};

const VISION_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const LIKELIHOOD_SCORE: Record<GoogleVisionLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 0,
  UNLIKELY: 1,
  POSSIBLE: 2,
  LIKELY: 3,
  VERY_LIKELY: 4,
};

const LABEL_TRANSLATIONS: Record<string, string> = {
  art: "艺术",
  beach: "海边",
  building: "建筑",
  city: "城市",
  cloud: "云层",
  clothing: "服饰",
  dress: "连衣裙",
  fashion: "时尚",
  flower: "花朵",
  forest: "森林",
  girl: "少女",
  grass: "草地",
  hair: "发丝",
  illustration: "插画",
  landscape: "风景",
  light: "光影",
  mountain: "山景",
  nature: "自然",
  ocean: "海洋",
  outdoor: "户外",
  person: "人物",
  photograph: "摄影",
  portrait: "人像",
  road: "道路",
  sea: "海景",
  sky: "天空",
  snow: "雪景",
  street: "街景",
  tree: "树木",
  urban: "都市",
  water: "水景",
  woman: "女性",
};

const GENERIC_LABELS = new Set([
  "image",
  "photograph",
  "photo",
  "wallpaper",
  "screenshot",
]);

function normalizeLikelihood(value: string | undefined): GoogleVisionLikelihood {
  if (
    value === "UNKNOWN" ||
    value === "VERY_UNLIKELY" ||
    value === "UNLIKELY" ||
    value === "POSSIBLE" ||
    value === "LIKELY" ||
    value === "VERY_LIKELY"
  ) {
    return value;
  }

  return "UNKNOWN";
}

function getRiskLevel(safety: GoogleVisionSafetyResult | null) {
  if (!safety) {
    return "low" as const;
  }

  const adult = LIKELIHOOD_SCORE[safety.adult];
  const racy = LIKELIHOOD_SCORE[safety.racy];
  const violence = LIKELIHOOD_SCORE[safety.violence];

  if (adult >= 4 || violence >= 4) {
    return "blocked" as const;
  }

  if (adult >= 3 || racy >= 4 || violence >= 3) {
    return "high" as const;
  }

  if (adult >= 2 || racy >= 3 || violence >= 2) {
    return "medium" as const;
  }

  return "low" as const;
}

function localizeLabel(label: string) {
  const key = label.toLowerCase().trim();

  return LABEL_TRANSLATIONS[key] ?? label.trim();
}

function normalizeLabels(labels: Array<{ description?: string; score?: number }>) {
  return [
    ...new Set(
      labels
        .filter((label) => (label.score ?? 0) >= 0.55)
        .map((label) => label.description?.trim())
        .filter((label): label is string => Boolean(label))
        .filter((label) => !GENERIC_LABELS.has(label.toLowerCase())),
    ),
  ].slice(0, 10);
}

export function isGoogleVisionConfigured() {
  return Boolean(
    process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim() ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64?.trim(),
  );
}

async function getVisionRequestHeaders(): Promise<{
  headers: Record<string, string>;
  url: string;
}> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();

  if (apiKey) {
    return {
      headers: {
        "Content-Type": "application/json",
      },
      url: `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(
        apiKey,
      )}`,
    };
  }

  const accessToken = await getGoogleCloudAccessToken([VISION_SCOPE]);

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    url: "https://vision.googleapis.com/v1/images:annotate",
  };
}

export async function analyzeImageWithGoogleVision(
  imageUrl: string,
): Promise<GoogleVisionImageAnalysis | null> {
  if (!isGoogleVisionConfigured()) {
    return null;
  }

  const request = await getVisionRequestHeaders();
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      requests: [
        {
          features: [
            { type: "SAFE_SEARCH_DETECTION" },
            { maxResults: 12, type: "LABEL_DETECTION" },
          ],
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
        },
      ],
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        responses?: Array<{
          error?: { message?: string };
          labelAnnotations?: Array<{ description?: string; score?: number }>;
          safeSearchAnnotation?: Partial<Record<keyof GoogleVisionSafetyResult, string>>;
        }>;
      }
    | null;

  if (!response.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ||
        `Google Vision request failed with status ${response.status}.`,
    );
  }

  const result = payload?.responses?.[0];

  if (result?.error) {
    throw new Error(result.error.message || "Google Vision analysis failed.");
  }

  const labels = normalizeLabels(result?.labelAnnotations ?? []);
  const rawSafety = result?.safeSearchAnnotation;
  const safety = rawSafety
    ? {
        adult: normalizeLikelihood(rawSafety.adult),
        medical: normalizeLikelihood(rawSafety.medical),
        racy: normalizeLikelihood(rawSafety.racy),
        spoof: normalizeLikelihood(rawSafety.spoof),
        violence: normalizeLikelihood(rawSafety.violence),
      }
    : null;

  return {
    labels,
    localizedLabels: normalizeLabels(
      labels.map((label) => ({
        description: localizeLabel(label),
        score: 1,
      })),
    ),
    riskLevel: getRiskLevel(safety),
    safety,
  };
}

export function createVisionLabelFallbackMetadata(input: {
  description?: string | null;
  labels: string[];
  title: string;
}) {
  const labels = input.labels.map((label) => label.trim()).filter(Boolean);

  if (labels.length === 0) {
    return null;
  }

  const category = labels.some((label) => /人|女性|少女|肖像|portrait/i.test(label))
    ? "people"
    : labels.some((label) => /城|街|建筑|building|city|urban/i.test(label))
      ? "city"
      : labels.some((label) => /插画|艺术|illustration|art/i.test(label))
        ? "illustration"
        : labels.some((label) => /天空|森林|海|山|水|自然|nature|forest|sky|water/i.test(label))
          ? "nature"
          : "other";

  return {
    caption: labels.slice(0, 3).join("、").slice(0, 18) || input.title,
    category,
    tags: labels.slice(0, 8),
  };
}

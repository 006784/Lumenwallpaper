import { z } from "zod";

import { formatZodError, jsonError, jsonSuccess } from "@/lib/api";
import {
  getI18nPayload,
  getLocaleResponseHeaders,
  getRequestLocale,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";

const localeSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
});

export async function GET(request: Request) {
  const locale = getRequestLocale(request);

  return jsonSuccess(getI18nPayload(locale), {
    headers: getLocaleResponseHeaders(locale),
    message: "I18n messages loaded.",
  });
}

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as unknown;
  const parsed = localeSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid locale payload.", {
      status: 400,
      code: "INVALID_LOCALE_PAYLOAD",
      details: formatZodError(parsed.error),
    });
  }

  const locale = normalizeLocale(parsed.data.locale) ?? parsed.data.locale;
  const response = jsonSuccess(getI18nPayload(locale), {
    headers: getLocaleResponseHeaders(locale),
    message: "Locale saved.",
  });

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

import { render } from "@react-email/render";
import { Resend } from "resend";

import { MagicLinkEmail } from "@/components/emails/magic-link-email";
import { ModerationResultEmail } from "@/components/emails/moderation-result-email";
import { MAGIC_LINK_EXPIRY_MINUTES } from "@/lib/auth";

let resendClient: Resend | null = null;

export function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
  };
}

export function isResendConfigured() {
  const config = getResendConfig();
  return Boolean(config.apiKey && config.fromEmail);
}

function createResendClient() {
  if (!resendClient) {
    const config = getResendConfig();

    if (!config.apiKey) {
      throw new Error("RESEND_API_KEY is required to send emails.");
    }

    if (!config.fromEmail) {
      throw new Error("RESEND_FROM_EMAIL is required to send emails.");
    }

    resendClient = new Resend(config.apiKey);
  }

  return resendClient;
}

export async function sendMagicLinkEmail(email: string, magicLink: string) {
  const config = getResendConfig();
  const resend = createResendClient();
  const html = await render(
    MagicLinkEmail({
      expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
      magicLink,
    }),
  );

  const response = await resend.emails.send({
    from: `Lumen <${config.fromEmail}>`,
    to: [email],
    subject: "你的 Lumen 登录链接已就绪",
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function sendModerationResultEmail(input: {
  actionLabel: string;
  email: string;
  moderationStatusLabel: string;
  reviewNote: string | null;
  wallpaperTitle: string;
  wallpaperUrl: string;
}) {
  const config = getResendConfig();
  const resend = createResendClient();
  const html = await render(
    ModerationResultEmail({
      actionLabel: input.actionLabel,
      moderationStatusLabel: input.moderationStatusLabel,
      reviewNote: input.reviewNote,
      wallpaperTitle: input.wallpaperTitle,
      wallpaperUrl: input.wallpaperUrl,
    }),
  );

  const response = await resend.emails.send({
    from: `Lumen <${config.fromEmail}>`,
    to: [input.email],
    subject: `Lumen 审核更新：${input.wallpaperTitle}`,
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}

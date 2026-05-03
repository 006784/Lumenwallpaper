import { withSentryConfig } from "@sentry/nextjs";

function getRemoteImagePatterns() {
  const hostnames = new Set(["img.byteify.icu", "img.frame.app"]);
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (publicUrl) {
    try {
      hostnames.add(new URL(publicUrl).hostname);
    } catch {
      // Ignore invalid env values and keep the stable fallbacks.
    }
  }

  return Array.from(hostnames).map((hostname) => ({
    protocol: "https",
    hostname,
  }));
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: getRemoteImagePatterns(),
    formats: ["image/avif", "image/webp"],
    unoptimized: process.env.NEXT_DISABLE_IMAGE_OPTIMIZATION === "true",
  },
  experimental: process.env.NEXT_ENABLE_PPR === "true" ? { ppr: true } : {},
};

const hasSourceMapUploadConfig = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

export default withSentryConfig(
  nextConfig,
  {
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    telemetry: false,
  },
  {
    hideSourceMaps: hasSourceMapUploadConfig,
    treeshake: {
      removeDebugLogging: true,
    },
    widenClientFileUpload: hasSourceMapUploadConfig,
  },
);

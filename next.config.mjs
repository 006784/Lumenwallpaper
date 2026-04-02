import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.frame.app",
      },
    ],
    formats: ["image/avif", "image/webp"],
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

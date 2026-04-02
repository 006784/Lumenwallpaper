import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import {
  shouldEnableVercelAnalytics,
  shouldEnableVercelSpeedInsights,
} from "@/lib/monitoring";

export function ObservabilityWidgets() {
  const shouldRenderAnalytics = shouldEnableVercelAnalytics();
  const shouldRenderSpeedInsights = shouldEnableVercelSpeedInsights();

  if (!shouldRenderAnalytics && !shouldRenderSpeedInsights) {
    return null;
  }

  return (
    <>
      {shouldRenderAnalytics ? <Analytics /> : null}
      {shouldRenderSpeedInsights ? <SpeedInsights /> : null}
    </>
  );
}

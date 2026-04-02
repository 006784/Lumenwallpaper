import * as Sentry from "@sentry/nextjs";

import { getClientSentryOptions } from "@/lib/monitoring";

const clientSentryOptions = getClientSentryOptions();

if (clientSentryOptions.enabled) {
  Sentry.init(clientSentryOptions);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import * as Sentry from "@sentry/nextjs";

import { getServerSentryOptions } from "@/lib/monitoring";

const edgeSentryOptions = getServerSentryOptions();

if (edgeSentryOptions.enabled) {
  Sentry.init(edgeSentryOptions);
}

import * as Sentry from "@sentry/nextjs";

import { getServerSentryOptions } from "@/lib/monitoring";

const serverSentryOptions = getServerSentryOptions();

if (serverSentryOptions.enabled) {
  Sentry.init(serverSentryOptions);
}

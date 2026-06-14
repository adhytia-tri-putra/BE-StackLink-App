import { createHash } from "crypto";

const ANALYTICS_TOPIC_PREFIX = "analytics-session";

export function getAnalyticsRealtimeTopic(token: string): string {
  const digest = createHash("sha256").update(token).digest("hex");
  return `${ANALYTICS_TOPIC_PREFIX}:${digest}`;
}

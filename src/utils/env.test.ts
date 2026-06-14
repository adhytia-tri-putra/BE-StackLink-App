import { afterEach, describe, expect, it } from "vitest";
import { getProductionReadiness } from "./env";

const KEYS = ["DATABASE_URL", "JWT_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_AVATAR_BUCKET", "SENTRY_DSN", "CUSTOM_DOMAIN_TARGET", "ANALYTICS_IP_SALT"];
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("production readiness", () => {
  it("reports missing integrations without exposing secrets", () => {
    KEYS.forEach((key) => delete process.env[key]);
    const result = getProductionReadiness();
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("email");
    expect(JSON.stringify(result)).not.toContain("SMTP_PASS");
  });
});

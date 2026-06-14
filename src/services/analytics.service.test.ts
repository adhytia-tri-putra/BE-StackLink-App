import { describe, expect, it } from "vitest";
import { anonymizeIp, getAnalyticsRetentionDays, inferBrowser, inferDeviceType, inferOperatingSystem, normalizeAnalyticsPeriod } from "./analytics.service";

describe("analytics helpers", () => {
  it("normalizes supported periods", () => {
    expect(normalizeAnalyticsPeriod("7d")).toBe("7d");
    expect(normalizeAnalyticsPeriod("90d")).toBe("90d");
    expect(normalizeAnalyticsPeriod("invalid")).toBe("30d");
  });

  it("classifies common devices", () => {
    expect(inferDeviceType("Mozilla iPhone Mobile")).toBe("Mobile");
    expect(inferDeviceType("Mozilla iPad Tablet")).toBe("Tablet");
    expect(inferDeviceType("Mozilla Windows NT")).toBe("Desktop");
  });

  it("anonymizes IP addresses deterministically without exposing the source", () => {
    const first = anonymizeIp("203.0.113.42", "test-salt");
    expect(first).toBe(anonymizeIp("203.0.113.42", "test-salt"));
    expect(first).not.toContain("203.0.113.42");
    expect(first).toHaveLength(64);
    expect(first).not.toBe(anonymizeIp("203.0.113.42", "different-salt"));
  });

  it("uses a safe analytics retention default", () => {
    const previous = process.env.ANALYTICS_RETENTION_DAYS;
    process.env.ANALYTICS_RETENTION_DAYS = "invalid";
    expect(getAnalyticsRetentionDays()).toBe(90);
    if (previous === undefined) delete process.env.ANALYTICS_RETENTION_DAYS;
    else process.env.ANALYTICS_RETENTION_DAYS = previous;
  });

  it("classifies browser and operating system", () => {
    expect(inferBrowser("Mozilla Chrome/120 Safari/537")).toBe("Chrome");
    expect(inferOperatingSystem("Mozilla Windows NT 10.0")).toBe("Windows");
  });
});

import { describe, expect, it } from "vitest";
import { inferDeviceType, normalizeAnalyticsPeriod } from "./analytics.service";

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
});

import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app";

describe("StackLink API", () => {
  it("returns a healthy status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, message: "API is running" });
  });

  it("adds security headers", async () => {
    const response = await request(app).get("/api/health");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("rejects invalid registration input before database access", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "x",
      name: "A",
      email: "invalid",
      password: "short",
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app";
import prisma from "./config/prisma";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `integration-${suffix}@example.com`;
const username = `test-${suffix}`.slice(0, 30);
const password = "IntegrationPass123!";

describe("account lifecycle", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers, verifies, logs in, manages a scheduled link, and deletes the account", async () => {
    const registration = await request(app).post("/api/auth/register").send({ username, name: "Integration User", email, password });
    expect(registration.status).toBe(201);
    const verificationToken = registration.body.data.developmentToken;
    expect(verificationToken).toBeTruthy();

    const verification = await request(app).post("/api/auth/verify-email").send({ token: verificationToken });
    expect(verification.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const token = login.body.data.token;

    const unauthorized = await request(app).get("/api/links");
    expect(unauthorized.status).toBe(401);

    const created = await request(app).post("/api/links").set("Authorization", `Bearer ${token}`).send({
      title: "Scheduled link",
      url: "https://example.com",
      startsAt: new Date(Date.now() + 60000).toISOString(),
      endsAt: new Date(Date.now() + 120000).toISOString(),
    });
    expect(created.status).toBe(201);
    expect(created.body.data.startsAt).toBeTruthy();

    const deleted = await request(app).delete("/api/account").set("Authorization", `Bearer ${token}`).send({ password });
    expect(deleted.status).toBe(200);
  });
});

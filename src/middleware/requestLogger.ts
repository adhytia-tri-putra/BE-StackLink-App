import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";

export const requestLogger = pinoHttp({
  genReqId: (req, res) => {
    const requestId = String(req.headers["x-request-id"] || randomUUID());
    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  redact: ["req.headers.authorization", "req.body.password", "req.body.currentPassword", "req.body.newPassword", "req.body.token"],
  customLogLevel: (_req, res, error) => error || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
});

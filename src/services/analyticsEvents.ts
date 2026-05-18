import type { Response } from "express";
import type { WebSocket } from "ws";

type AnalyticsEvent = {
  type: string;
  payload?: unknown;
  timestamp: string;
};

const sseClients = new Map<number, Set<Response>>();
const wsClients = new Map<number, Set<WebSocket>>();

function sendEvent(res: Response, event: AnalyticsEvent) {
  if (!res.writableEnded) {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.payload ?? {})}\n\n`);
  }
}

function sendWsEvent(socket: WebSocket, event: AnalyticsEvent) {
  if (socket.readyState !== socket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({ type: event.type, payload: event.payload, timestamp: event.timestamp }));
}

export function subscribeToAnalyticsEvents(userId: number, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`: connected\n\n`);

  const userClients = sseClients.get(userId) ?? new Set<Response>();
  userClients.add(res);
  sseClients.set(userId, userClients);

  res.on("close", () => {
    const set = sseClients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      sseClients.delete(userId);
    }
  });
}

export function subscribeToAnalyticsSocket(userId: number, socket: WebSocket) {
  const userSockets = wsClients.get(userId) ?? new Set<WebSocket>();
  userSockets.add(socket);
  wsClients.set(userId, userSockets);

  socket.on("close", () => {
    const set = wsClients.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) {
      wsClients.delete(userId);
    }
  });
}

export function publishAnalyticsEvent(userId: number, payload: unknown) {
  const event = {
    type: "analytics-update",
    payload,
    timestamp: new Date().toISOString(),
  };

  const sseSet = sseClients.get(userId);
  if (sseSet) {
    sseSet.forEach((res) => {
      try {
        sendEvent(res, event);
      } catch {
        res.end();
        sseSet.delete(res);
      }
    });
    if (sseSet.size === 0) {
      sseClients.delete(userId);
    }
  }

  const wsSet = wsClients.get(userId);
  if (wsSet) {
    wsSet.forEach((socket) => {
      try {
        sendWsEvent(socket, event);
      } catch {
        socket.close();
        wsSet.delete(socket);
      }
    });
    if (wsSet.size === 0) {
      wsClients.delete(userId);
    }
  }
}

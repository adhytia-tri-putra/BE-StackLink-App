import type { Response } from "express";
import type { WebSocket } from "ws";
import { findActiveSessionsByUserId } from "./sessionService";
import { getAnalyticsRealtimeTopic } from "../utils/realtimeTopic";

type AnalyticsEvent = {
  type: string;
  payload?: unknown;
  timestamp: string;
};

const sseClients = new Map<number, Set<Response>>();
const wsClients = new Map<number, Set<WebSocket>>();
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

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

async function publishSupabaseBroadcast(userId: number, event: AnalyticsEvent) {
  if (!supabaseUrl || !supabaseSecretKey) {
    return;
  }

  const sessions = await findActiveSessionsByUserId(userId);
  if (sessions.length === 0) {
    return;
  }

  const messages = sessions.map((session) => ({
    topic: getAnalyticsRealtimeTopic(session.token),
    event: event.type,
    payload: {
      ...(typeof event.payload === "object" && event.payload !== null ? event.payload : {}),
      timestamp: event.timestamp,
    },
    private: false,
  }));

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${supabaseSecretKey}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase Realtime broadcast failed: ${response.status} ${message}`);
  }
}

export async function publishAnalyticsEvent(userId: number, payload: unknown) {
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

  await publishSupabaseBroadcast(userId, event).catch((error) => {
    console.warn("Failed to publish Supabase analytics event.", error);
  });
}

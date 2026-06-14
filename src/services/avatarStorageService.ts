import { randomUUID } from "node:crypto";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

export async function storeAvatar(userId: number, avatar: string): Promise<string> {
  if (!avatar.startsWith("data:")) {
    const url = new URL(avatar);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Avatar URL tidak valid.");
    return url.toString();
  }

  const match = avatar.match(/^data:(image\/(?:jpeg|png|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Format avatar harus JPG, PNG, atau GIF.");

  const [, mimeType, encoded] = match;
  const content = Buffer.from(encoded, "base64");
  if (content.length === 0 || content.length > MAX_AVATAR_BYTES) throw new Error("Ukuran avatar maksimal 5MB.");

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
  if (!supabaseUrl || !secretKey) throw new Error("Supabase Storage belum dikonfigurasi di server.");

  const path = `${userId}/${randomUUID()}.${MIME_EXTENSIONS[mimeType]}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      apikey: secretKey,
      "Content-Type": mimeType,
      "x-upsert": "false",
    },
    body: content,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gagal mengunggah avatar ke storage: ${details || response.statusText}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

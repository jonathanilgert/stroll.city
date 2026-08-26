import fs from "node:fs/promises";
import path from "node:path";
import { envelope, error, setHuntSessionAvatar, slugify } from "../../../../_lib/data";

const runtimeRoot = path.join(process.cwd(), ".stroll", "runtime");
const maxBytes = 6 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/* The team photo taken during onboarding. Stored beside the proof photos for the
   same session, so deleting a session's directory takes the whole walk with it. */
export async function POST(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  if (city !== "calgary") return error(404, "City not found");

  const form = await request.formData().catch(() => null);
  if (!form) return error(400, "Expected multipart form data");
  const file = form.get("photo");
  if (!(file instanceof File)) return error(400, "Photo file is required");
  if (!allowedTypes[file.type]) return error(400, "Photo must be a JPG, PNG, WEBP, HEIC, or HEIF image");
  if (file.size <= 0) return error(400, "Photo file is empty");
  if (file.size > maxBytes) return error(413, "Photo must be 6MB or smaller");

  const sessionId = slugify(id).slice(0, 80);
  if (!sessionId) return error(400, "Session id is required");
  const ext = allowedTypes[file.type];
  const fileName = `avatar-${Date.now().toString(36)}.${ext}`;
  const dir = path.join(runtimeRoot, city, "hunt-photos", sessionId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()), { flag: "wx" });

  const url = `/api/v1/${city}/sessions/${sessionId}/photos/${fileName}`;
  const session = await setHuntSessionAvatar(city, sessionId, url);
  if (!session) return error(404, "Session not found");
  return envelope(city, { session_id: sessionId, avatar_url: url }, "runtime-overlay");
}

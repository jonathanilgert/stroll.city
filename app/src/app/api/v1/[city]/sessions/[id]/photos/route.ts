import fs from "node:fs/promises";
import path from "node:path";
import { envelope, error, slugify } from "../../../../_lib/data";

const runtimeRoot = path.join(process.cwd(), ".stroll", "runtime");
const maxBytes = 10 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

type PhotoMeta = {
  id: string;
  session_id: string;
  stop_id: string;
  team_name: string | null;
  file_name: string;
  content_type: string;
  byte_size: number;
  url: string;
  created_at: string;
};

function safeSegment(value: string, fallback: string) {
  return slugify(value).slice(0, 80) || fallback;
}

export async function POST(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  if (city !== "calgary") return error(404, "City not found");

  const form = await request.formData().catch(() => null);
  if (!form) return error(400, "Expected multipart form data");

  const file = form.get("photo");
  if (!(file instanceof File)) return error(400, "Photo file is required");
  if (!allowedTypes[file.type]) return error(400, "Photo must be a JPG, PNG, WEBP, HEIC, or HEIF image");
  if (file.size <= 0) return error(400, "Photo file is empty");
  if (file.size > maxBytes) return error(413, "Photo must be 10MB or smaller");

  const sessionId = safeSegment(id, "session");
  const stopId = safeSegment(String(form.get("stop_id") ?? "stop"), "stop");
  const teamName = String(form.get("team_name") ?? "").trim().slice(0, 120) || null;
  const ext = allowedTypes[file.type];
  const createdAt = new Date().toISOString();
  const photoId = `${stopId}-${Date.now().toString(36)}`;
  const fileName = `${photoId}.${ext}`;
  const dir = path.join(runtimeRoot, city, "hunt-photos", sessionId);
  await fs.mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), bytes, { flag: "wx" });

  const metadataPath = path.join(dir, "photos.json");
  let existing: PhotoMeta[] = [];
  try {
    const raw = await fs.readFile(metadataPath, "utf8");
    const parsed = JSON.parse(raw) as PhotoMeta[];
    if (Array.isArray(parsed)) existing = parsed;
  } catch {}

  const meta: PhotoMeta = {
    id: photoId,
    session_id: sessionId,
    stop_id: stopId,
    team_name: teamName,
    file_name: fileName,
    content_type: file.type,
    byte_size: file.size,
    url: `/api/v1/${city}/sessions/${sessionId}/photos/${fileName}`,
    created_at: createdAt,
  };
  await fs.writeFile(metadataPath, `${JSON.stringify([...existing.filter((row) => row.stop_id !== stopId), meta], null, 2)}\n`);

  return envelope(city, meta, "runtime-overlay");
}

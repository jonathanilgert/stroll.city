import fs from "node:fs/promises";
import path from "node:path";
import { error, slugify } from "../../../../../_lib/data";

const runtimeRoot = path.join(process.cwd(), ".stroll", "runtime");
const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function safeSession(value: string) {
  return slugify(value).slice(0, 80) || "session";
}

function safeFile(value: string) {
  const base = path.basename(value).toLowerCase();
  return /^[a-z0-9-]+\.(jpe?g|png|webp|heic|heif)$/.test(base) ? base : null;
}

export async function GET(_request: Request, context: { params: Promise<{ city: string; id: string; photoId: string }> }) {
  const { city, id, photoId } = await context.params;
  if (city !== "calgary") return error(404, "City not found");

  const sessionId = safeSession(id);
  const fileName = safeFile(photoId);
  if (!fileName) return error(404, "Photo not found");

  const filePath = path.join(runtimeRoot, city, "hunt-photos", sessionId, fileName);
  const ext = fileName.split(".").pop() ?? "jpg";
  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return error(404, "Photo not found");
  }
}

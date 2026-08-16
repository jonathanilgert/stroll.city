import { envelope } from "../../../../_lib/data";

export async function GET(_request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5ead8"/><circle cx="180" cy="150" r="80" fill="#7abf9e"/><text x="90" y="330" font-family="Georgia,serif" font-size="68" fill="#24201b">Stroll City</text><text x="90" y="410" font-family="Arial,sans-serif" font-size="36" fill="#4c463f">Hunt completed · ${id}</text><text x="90" y="470" font-family="Arial,sans-serif" font-size="28" fill="#6e655c">Share this postcard to enter the Inglewood Basket draw.</text></svg>`;
  return envelope(city, { session_id: id, content_type: "image/svg+xml", svg: html, draw_entry_url: "/rules" }, "runtime-overlay");
}

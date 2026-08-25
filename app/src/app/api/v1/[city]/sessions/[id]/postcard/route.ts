import { envelope, error, getHuntSession, hydrateHuntSession, loadCityData } from "../../../../_lib/data";

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (ch) => (
    ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : "&apos;"
  ));
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* The postcard is generated server-side so it can be shared as a link and rendered
   by anything — the share sheet, an OG card, a print. Photo slots are drawn as
   frames rather than embedded images: the files live behind the session's own photo
   route, and inlining them here would make the payload enormous. */
export async function GET(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const stored = await getHuntSession(city, id);
  if (!stored) return error(404, "Session not found");
  const session = hydrateHuntSession(stored, data);

  const serial = String(Math.abs([...session.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7)) % 1000).padStart(3, "0");
  const title = session.status === "finished"
    ? `${session.team_name} walked ${session.hunt_name}.`
    : `Solve this stop and the next postcard mark fills in.`;
  const slotWidth = 210;
  const slots = session.stops.map((stop, i) => {
    const x = 90 + i * (slotWidth + 22);
    const filled = Boolean(stop.photo_url);
    return `<g>
      <rect x="${x}" y="200" width="${slotWidth}" height="240" rx="10" fill="${filled ? "#E4EBFF" : "#FAFAFB"}" stroke="${filled ? "#0B47E8" : "#DDE0E5"}" stroke-width="${filled ? 2 : 2}" stroke-dasharray="${filled ? "0" : "7 7"}"/>
      ${filled
        ? `<rect x="${x + 60}" y="392" width="90" height="28" rx="14" fill="#fff" stroke="#0B47E8" stroke-width="2"/><text x="${x + 105}" y="411" font-family="ui-monospace,monospace" font-size="14" fill="#0B47E8" text-anchor="middle">FOUND</text>`
        : `<text x="${x + 105}" y="330" font-family="ui-monospace,monospace" font-size="30" fill="#C9CCD3" text-anchor="middle">${i + 1}</text>`}
    </g>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F3F1E9"/>
  <rect x="24" y="24" width="1152" height="582" rx="34" fill="#FAF9F4" stroke="#E4E2D8" stroke-width="2"/>
  <line x1="120" y1="60" x2="120" y2="570" stroke="#DFDDD2" stroke-width="2" stroke-dasharray="4 6"/>
  <text x="88" y="480" font-family="ui-monospace,monospace" font-size="15" fill="#767A82" letter-spacing="4" transform="rotate(-90 88 480)">INGLEWOOD</text>
  <text x="168" y="98" font-family="ui-monospace,monospace" font-size="17" fill="#767A82" letter-spacing="4">${session.status === "finished" ? "POSTCARD COMPLETE" : "POSTCARD IN PROGRESS"}</text>
  <text x="1128" y="98" font-family="ui-monospace,monospace" font-size="17" fill="#767A82" text-anchor="end">No. ${serial}</text>
  <text x="168" y="152" font-family="Helvetica,Arial,sans-serif" font-size="38" font-weight="500" fill="#14161A">${escapeXml(title)}</text>
  ${slots}
  <text x="168" y="500" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="#6B6F77">${session.photo_count} of ${session.total_stops} stops photographed${session.mode === "race" ? ` · ${formatDuration(session.stroll_seconds)}` : ""}</text>
  <text x="168" y="556" font-family="ui-monospace,monospace" font-size="16" fill="#8A8E96">stroll.city · #StrollInglewood</text>
</svg>`;

  /* ?format=svg serves the card itself, so it can be opened, shared or used as an
     OG image; the default JSON is what the dashboard renders from. */
  if (new URL(request.url).searchParams.get("format") === "svg") {
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return envelope(city, {
    session_id: session.id,
    status: session.status,
    serial,
    team_name: session.team_name,
    hunt_name: session.hunt_name,
    solved_count: session.solved_count,
    photo_count: session.photo_count,
    total_stops: session.total_stops,
    stroll_seconds: session.stroll_seconds,
    /* The dashboard renders its own postcard from these; the SVG is for sharing. */
    slots: session.stops.map((stop) => ({
      stop_id: stop.stop_id,
      name: stop.state === "solved" ? stop.name : null,
      photo_url: stop.photo_url,
      state: stop.state,
    })),
    content_type: "image/svg+xml",
    svg,
    draw_entry_url: "/rules",
  }, "runtime-overlay");
}

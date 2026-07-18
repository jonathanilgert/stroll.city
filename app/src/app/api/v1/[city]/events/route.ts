import { requireScope } from "../../_lib/auth";
import { envelope, error, listEvents, loadCityData, upsertEvent } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

export async function GET(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const url = new URL(request.url);
  const result = await listEvents(city, data, url.searchParams.get("from"), url.searchParams.get("to"));
  return envelope(city, result.events, result.source, result.events.length);
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = requireScope(request, "events:write", city);
  if (!auth.ok) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  try {
    const event = await upsertEvent(city, data, await request.json());
    return Response.json({ ok: true, city, data: event }, { status: 201 });
  } catch (caught) {
    return error(400, caught instanceof Error ? caught.message : "Invalid event payload");
  }
}

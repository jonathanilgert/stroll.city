import { requireScope } from "../../../_lib/auth";
import { deleteEvent, error, loadCityData, patchEvent } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { city, id } = await context.params;
  const auth = requireScope(request, "events:write", city);
  if (!auth.ok) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const event = await patchEvent(city, data, id, await request.json());
  if (!event) return error(404, "Event not found");
  return Response.json({ ok: true, city, data: event });
}

export async function DELETE(request: Request, context: Context) {
  const { city, id } = await context.params;
  const auth = requireScope(request, "events:write", city);
  if (!auth.ok) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const deleted = await deleteEvent(city, data, id);
  if (!deleted) return error(404, "Event not found");
  return Response.json({ ok: true, city, deleted: id });
}

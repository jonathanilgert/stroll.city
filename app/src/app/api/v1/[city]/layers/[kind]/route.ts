import { envelope, error, loadCityData } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; kind: string }> };

export async function GET(_request: Request, context: Context) {
  const { city, kind } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  if (kind === "bike") return envelope(city, data.bike, "static-json");
  if (kind === "pathway" || kind === "pathways") return envelope(city, data.pathways, "static-json");
  if (kind === "trees") return envelope(city, data.trees, "static-json", data.trees.length);
  if (kind === "streets") return envelope(city, data.streets, "static-json");
  return error(404, "Layer kind must be bike, pathway, pathways, trees, or streets");
}

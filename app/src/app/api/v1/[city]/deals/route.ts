import { envelope, loadCityData, listBusinesses, publicBusiness } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

export async function GET(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return envelope(city, [], "static-json", 0);
  const url = new URL(request.url);
  const liveOnly = url.searchParams.get("live") === "true";
  const result = await listBusinesses(city, data);
  const deals = result.businesses
    .filter((business) => business.plan_tier === "stroll" || business.plan_tier === "stroll_plus")
    .filter((business) => !liveOnly || business.offers_finisher_item || business.donates_to_basket)
    .map((business) => ({
      business: publicBusiness(business),
      deal_type: business.offers_finisher_item ? "finisher_item" : "basket_donor",
      title: business.offers_finisher_item ? business.finisher_item ?? "Finisher item" : business.basket_item ?? "Basket donation",
      cap_weekly: business.finisher_cap_weekly ?? null,
      days: business.finisher_days ?? [],
    }));
  return envelope(city, deals, result.source, deals.length);
}

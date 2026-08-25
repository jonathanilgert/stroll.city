import { createBusinessClaim, error, loadCityData, updateBusinessClaim } from "../../_lib/data";
import { createClaimCheckoutSession } from "../../_lib/stripe";

type Context = { params: Promise<{ city: string }> };

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  try {
    let claim = await createBusinessClaim(city, data, await request.json());
    if (claim.plan_tier !== "free" && process.env.STRIPE_SECRET_KEY) {
      const business = data.businesses.find((row) => row.id === claim.business_id);
      const session = await createClaimCheckoutSession(city, claim, business?.name ?? "Stroll.city business");
      if (session?.url) {
        claim = await updateBusinessClaim(city, claim.id, {
          checkout_mode: "stripe",
          checkout_url: session.url,
          stripe_checkout_session_id: session.id,
        }) ?? claim;
      }
    }
    return Response.json({ ok: true, city, data: claim }, { status: 201 });
  } catch (caught) {
    return error(400, caught instanceof Error ? caught.message : "Invalid claim payload");
  }
}

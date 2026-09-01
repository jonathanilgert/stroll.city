import { envelope, error, raceLeaderboard } from "../../../_lib/data";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const city = new URL(request.url).searchParams.get("city") ?? "calgary";
  const board = await raceLeaderboard(city, code);
  if (!board) return error(404, "No race with that code");
  return envelope(city, board, "runtime-overlay", board.standings.length);
}

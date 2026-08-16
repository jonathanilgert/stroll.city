import { envelope } from "../../../_lib/data";

export async function GET() {
  return envelope("race", [
    { rank: 1, team_name: "Sample Sleuths", stroll_seconds: 3120, finished_at: new Date().toISOString() },
  ], "runtime-overlay", 1);
}

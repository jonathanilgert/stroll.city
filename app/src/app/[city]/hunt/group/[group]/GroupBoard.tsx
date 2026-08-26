"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Trophy } from "lucide-react";
import styles from "../../hunt.module.css";

export type BoardTeam = {
  session_id: string;
  team_index: number;
  team_name: string;
  solved_count: number;
  photo_count: number;
  total_stops: number;
  status: "active" | "finished";
  start_index: number;
  stroll_seconds: number;
};

export type BoardGroup = {
  id: string;
  group_name: string;
  hunt_name: string;
  party_size: number;
  team_count: number;
  teams: BoardTeam[];
  leader: BoardTeam | null;
  solved_total: number;
  stops_total: number;
};

export default function GroupBoard({ citySlug, group: initial }: { citySlug: string; group: BoardGroup }) {
  const [group, setGroup] = useState(initial);
  const [copied, setCopied] = useState<string | null>(null);

  /* The organiser leaves this open on a phone while everyone walks, so it refreshes
     itself rather than asking them to pull down. */
  const refresh = useCallback(async () => {
    const payload = await fetch(`/api/v1/${citySlug}/groups/${group.id}`)
      .then((response) => response.json())
      .catch(() => null) as { ok?: boolean; data?: BoardGroup } | null;
    if (payload?.ok && payload.data) setGroup(payload.data);
  }, [citySlug, group.id]);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 20000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const copyLink = async (team: BoardTeam) => {
    const url = `${window.location.origin}/${citySlug}/hunt/${team.session_id}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${team.team_name} — ${group.hunt_name}`, text: `${team.team_name}: your punch card`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(team.session_id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* the user dismissed the share sheet — nothing to report */
    }
  };

  const everyoneFinished = group.teams.length > 0 && group.teams.every((team) => team.status === "finished");

  return (
    <main className={styles.app}>
      <div className={styles.screen}>
        <div className={styles.stepHead}>
          <Link className={styles.circleBtn} href={`/${citySlug}`} aria-label="Back to the map"><ChevronLeft size={17} /></Link>
          <span className={`${styles.stepCount} ${styles.mono}`}>{group.team_count} teams · {group.party_size} people</span>
        </div>

        <div className={styles.scroll}>
          <div className={`${styles.sheet} ${styles.sheetPlain}`}>
            <span className={`${styles.kicker} ${styles.mono}`}>{group.hunt_name}</span>
            <h1 className={`${styles.title} ${styles.titleSm}`}>{group.group_name}</h1>
            <p className={styles.lede}>
              {everyoneFinished
                ? "Every team is in. Open a punch card to see its postcard."
                : "Send each team its own link. They walk the same eight stops, starting at different doors."}
            </p>

            {group.leader && group.solved_total > 0 && !everyoneFinished && (
              <div className={styles.leaderRow}>
                <span className={styles.leaderIcon}><Trophy size={15} /></span>
                <span>
                  <strong>{group.leader.team_name}</strong> leads with {group.leader.solved_count} of {group.leader.total_stops} stops.
                </span>
              </div>
            )}

            <div className={styles.teamCards}>
              {group.teams.map((team) => {
                const done = team.status === "finished";
                return (
                  <div className={`${styles.teamCard} ${done ? styles.teamCardDone : ""}`} key={team.session_id}>
                    <div className={styles.teamCardTop}>
                      <span className={styles.teamRowN}>{team.team_index + 1}</span>
                      <span className={styles.teamCardName}>{team.team_name}</span>
                      <span className={styles.teamCardScore}>
                        {done ? "Finished" : `${team.solved_count}/${team.total_stops}`}
                      </span>
                    </div>
                    <div className={styles.teamBar} aria-hidden>
                      <span style={{ width: `${team.total_stops ? (team.solved_count / team.total_stops) * 100 : 0}%` }} />
                    </div>
                    <div className={styles.teamCardActions}>
                      <Link className={styles.teamOpen} href={`/${citySlug}/hunt/${team.session_id}`}>
                        Open punch card <ChevronRight size={14} />
                      </Link>
                      <button className={styles.teamCopy} onClick={() => void copyLink(team)}>
                        {copied === team.session_id ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Send link</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className={styles.hintText}>
              Each link is that team&rsquo;s punch card — anyone holding it can solve stops and add photos, so send it to the
              team and nobody else. The board updates on its own.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cta} onClick={() => void refresh()}>Refresh the board</button>
          <span className={styles.ctaNote}>{group.solved_total} of {group.stops_total} stops found across the group</span>
        </div>
      </div>
    </main>
  );
}

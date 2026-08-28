"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Check, Download, Map as MapIcon, Share2, Sparkles } from "lucide-react";
import styles from "../../hunt.module.css";

export type PostcardData = {
  id: string;
  team_name: string;
  hunt_name: string;
  mode: "friendly" | "full" | "race";
  group_id: string | null;
  total_stops: number;
  seconds: number;
  clues_used: number;
  finished_at: string | null;
  stops: { stop_id: string; index: number; name: string; photo_url: string | null }[];
};

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

function serialFor(id: string) {
  const hash = [...id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);
  return String(Math.abs(hash) % 1000).padStart(3, "0");
}

/* Cover-fit, the canvas equivalent of object-fit: cover. */
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function PostcardScreen({ citySlug, postcard }: { citySlug: string; postcard: PostcardData }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const serial = serialFor(postcard.id);
  const photos = postcard.stops.filter((stop) => stop.photo_url);

  /* The postcard is drawn to a canvas rather than screenshotted, so the file people
     save and send carries the real photos at a decent size. Every image is
     same-origin, so the canvas stays untainted and toBlob works. */
  const renderToBlob = useCallback(async () => {
    const width = 1600;
    const height = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#F3F1E9";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#FAF9F4";
    roundedRect(ctx, 40, 40, width - 80, height - 80, 44);
    ctx.fill();
    ctx.strokeStyle = "#E4E2D8";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "#DFDDD2";
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(168, 90);
    ctx.lineTo(168, height - 90);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(120, height - 150);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#8A8E96";
    ctx.font = "500 22px ui-monospace, Menlo, monospace";
    ctx.letterSpacing = "8px";
    ctx.fillText("INGLEWOOD", 0, 0);
    ctx.restore();

    ctx.fillStyle = "#767A82";
    ctx.font = "500 24px ui-monospace, Menlo, monospace";
    ctx.letterSpacing = "6px";
    ctx.fillText("POSTCARD COMPLETE", 220, 130);
    ctx.textAlign = "right";
    ctx.fillText(`No. ${serial}`, width - 90, 130);
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";

    ctx.fillStyle = "#14161A";
    ctx.font = "600 54px Helvetica, Arial, sans-serif";
    ctx.fillText(`${postcard.team_name} walked ${postcard.hunt_name}.`, 220, 220);

    /* Four across, wrapping. An eight-stop hunt used to lose half its photos here:
       the row was drawn once and then sliced to four. */
    const slots = postcard.stops;
    const gap = 26;
    const cols = Math.min(4, Math.max(1, slots.length));
    const rows = Math.ceil(slots.length / cols);
    const left = 220;
    const right = width - 90;
    const top = 280;
    const bottom = height - 190;
    const slotW = (right - left - gap * (cols - 1)) / cols;
    const slotH = (bottom - top - gap * (rows - 1)) / rows;

    await Promise.all(slots.map((stop, i) => new Promise<void>((resolve) => {
      const x = left + (i % cols) * (slotW + gap);
      const rowTop = top + Math.floor(i / cols) * (slotH + gap);
      ctx.save();
      roundedRect(ctx, x, rowTop, slotW, slotH, 16);
      ctx.clip();
      ctx.fillStyle = "#EFEDE5";
      ctx.fillRect(x, rowTop, slotW, slotH);
      if (!stop.photo_url) { ctx.restore(); resolve(); return; }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        drawCover(ctx, image, x, rowTop, slotW, slotH);
        ctx.restore();
        /* FOUND pill, drawn after the clip is released so it is never cut off. */
        const pillW = 132;
        const pillH = 44;
        const px = x + slotW / 2 - pillW / 2;
        const py = rowTop + slotH - pillH - 22;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        roundedRect(ctx, px, py, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.strokeStyle = "#0B47E8";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#0B47E8";
        ctx.font = "500 20px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.letterSpacing = "3px";
        ctx.fillText("FOUND", px + pillW / 2, py + 29);
        ctx.textAlign = "left";
        ctx.letterSpacing = "0px";
        resolve();
      };
      image.onerror = () => { ctx.restore(); resolve(); };
      image.src = stop.photo_url;
    })));

    ctx.fillStyle = "#6B6F77";
    ctx.font = "400 28px Helvetica, Arial, sans-serif";
    ctx.fillText(
      `${photos.length} of ${postcard.total_stops} stops photographed · ${formatDuration(postcard.seconds)}`,
      220,
      bottom + 56,
    );
    ctx.fillStyle = "#8A8E96";
    ctx.font = "400 24px ui-monospace, Menlo, monospace";
    ctx.fillText("stroll.city · #StrollInglewood", 220, bottom + 104);

    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
  }, [photos.length, postcard, serial]);

  const savePostcard = async () => {
    setBusy(true);
    setNote("");
    try {
      const blob = await renderToBlob();
      if (!blob) { setNote("Could not build the image. Try again."); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stroll-postcard-${serial}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNote("Saved to your downloads.");
    } finally {
      setBusy(false);
    }
  };

  const sendPostcard = async () => {
    setBusy(true);
    setNote("");
    try {
      const blob = await renderToBlob();
      const text = `${postcard.team_name} finished ${postcard.hunt_name} in Inglewood. #StrollInglewood`;
      const file = blob ? new File([blob], `stroll-postcard-${serial}.png`, { type: "image/png" }) : null;
      /* Share the picture itself where the browser allows it; fall back to the link,
         which opens this same page. */
      if (file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Stroll City postcard" });
        return;
      }
      if (typeof navigator.share === "function") {
        await navigator.share({ text, title: "Stroll City postcard", url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setNote("Link copied to your clipboard.");
    } catch {
      /* dismissing the share sheet is not a failure */
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.app}>
      <div className={styles.screen}>
        <div className={styles.scroll}>
          <div className={styles.finishBody}>
            <div className={styles.finishCrest}><Sparkles size={26} /></div>
            <span className={`${styles.kicker} ${styles.mono}`}>Hunt complete</span>
            <h1 className={`${styles.title} ${styles.titleSm}`}>
              Nice one, {postcard.team_name}.
            </h1>
            <p className={styles.lede}>
              You walked {postcard.hunt_name} end to end — {postcard.total_stops} riddles, {photos.length} photos,
              and a postcard with your name on it.
            </p>

            <div className={styles.finishStats}>
              <div className={styles.finishStat}>
                <span className={styles.finishStatV}>{postcard.total_stops}</span>
                <span className={styles.finishStatK}>Stops found</span>
              </div>
              <div className={styles.finishStat}>
                <span className={styles.finishStatV}>{formatDuration(postcard.seconds)}</span>
                <span className={styles.finishStatK}>{postcard.mode === "race" ? "With penalties" : "On the street"}</span>
              </div>
              <div className={styles.finishStat}>
                <span className={styles.finishStatV}>{postcard.clues_used}</span>
                <span className={styles.finishStatK}>{postcard.clues_used === 1 ? "Clue used" : "Clues used"}</span>
              </div>
            </div>

            <div className={styles.pcard} ref={cardRef}>
              <div className={styles.pcardInner}>
                <span className={styles.pcardSpine} aria-hidden />
                <span className={`${styles.pcardVert} ${styles.mono}`}>INGLEWOOD</span>
                <div className={`${styles.pcardTop} ${styles.mono}`}>
                  <span>Postcard complete</span>
                  <span className={styles.pcardSerial}>No. {serial}</span>
                </div>
                <h2 className={styles.pcardTitle}>{postcard.team_name} walked {postcard.hunt_name}.</h2>
                <div className={styles.pcardSlots}>
                  {postcard.stops.map((stop) => (
                    <figure className={`${styles.pcardSlot} ${stop.photo_url ? styles.pcardSlotFilled : ""}`} key={stop.stop_id}>
                      {stop.photo_url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- runtime upload, not a build asset */}
                          <img src={stop.photo_url} alt={stop.name || `Stop ${stop.index + 1}`} />
                          <figcaption className={`${styles.pcardFound} ${styles.mono}`}>FOUND</figcaption>
                        </>
                      ) : (
                        <span className={styles.pcardSlotN}>{stop.index + 1}</span>
                      )}
                    </figure>
                  ))}
                </div>
                <p className={styles.pcardFoot}>
                  {postcard.stops.filter((stop) => stop.name).map((stop) => stop.name).join(" · ")}
                </p>
              </div>
            </div>

            {note && <span className={styles.finishNote}><Check size={13} />{note}</span>}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.ctaRow}>
            <button className={`${styles.cta} ${styles.ctaGhost}`} onClick={() => void savePostcard()} disabled={busy}>
              <Download size={16} /> Save
            </button>
            <button className={styles.cta} onClick={() => void sendPostcard()} disabled={busy}>
              <Share2 size={16} /> Send it
            </button>
          </div>
          <Link className={styles.finishBack} href={postcard.group_id ? `/${citySlug}/hunt/group/${postcard.group_id}` : `/${citySlug}`}>
            <MapIcon size={15} /> {postcard.group_id ? "Back to the team board" : "Back to the map"}
          </Link>
        </div>
      </div>
    </main>
  );
}

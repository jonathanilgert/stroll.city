"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Camera, Check, ChevronLeft, ChevronRight, Clock, MapPin, Minus, Plus, TrendingUp, User, Users } from "lucide-react";
import styles from "../hunt.module.css";

export type OnboardingHunt = {
  slug: string;
  name: string;
  blurb: string;
  mode: "friendly" | "full" | "race";
  audience: "family" | "adult";
  difficulty: string;
  est_minutes: number;
  distance_m: number;
  stop_count: number;
};

type Step = "preview" | "party" | "name" | "photo" | "details" | "ready";
const STEPS: Step[] = ["party", "name", "photo", "details", "ready"];

/* Dot positions for the route preview. Deliberately synthetic: the real stop
   coordinates are the answers, so the preview shows the shape of a walk, not
   where it goes. */
const ROUTE_DOTS = [
  { x: "12.5%", y: "64%" },
  { x: "32.5%", y: "35%" },
  { x: "50%", y: "56%" },
  { x: "66%", y: "73%" },
  { x: "86%", y: "39%" },
];

function durationLabel(minutes: number) {
  if (!minutes) return "About an hour";
  const low = Math.max(1, Math.round(minutes / 60));
  return low >= 2 ? `${low}–${low + 1} hours` : "1–2 hours";
}

export default function HuntOnboarding({
  citySlug, hunts, initialType,
}: {
  citySlug: string;
  hunts: OnboardingHunt[];
  initialType: string | null;
}) {
  const router = useRouter();
  const initialHunt = hunts.find((hunt) => hunt.mode === initialType) ?? hunts[0] ?? null;
  const [huntSlug] = useState(initialHunt?.slug ?? "");
  const [step, setStep] = useState<Step>("preview");
  const [saved, setSaved] = useState(false);
  const [pickedDot, setPickedDot] = useState(0);

  const [partyType, setPartyType] = useState<"solo" | "team" | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [email, setEmail] = useState("");
  const [photosConsented, setPhotosConsented] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const hunt = hunts.find((item) => item.slug === huntSlug) ?? initialHunt;
  const stopTotal = hunt?.stop_count ?? 4;
  const dots = useMemo(() => ROUTE_DOTS.slice(0, Math.min(5, Math.max(3, stopTotal))), [stopTotal]);
  const needsAgeGate = hunt?.audience === "adult";
  const isFree = hunt?.mode === "friendly";

  const stepIndex = STEPS.indexOf(step);
  const canContinue =
    step === "party" ? partyType !== null
      : step === "name" ? name.trim().length > 0
        : step === "details" ? (!needsAgeGate || ageConfirmed)
          : true;

  const goBack = () => {
    if (step === "preview") { router.push(`/${citySlug}`); return; }
    if (step === "party") { setStep("preview"); return; }
    setStep(STEPS[Math.max(0, stepIndex - 1)]);
  };
  const goNext = () => {
    if (!canContinue) return;
    if (step === "preview") { setStep("party"); return; }
    setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)]);
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose a photo file."); return; }
    if (file.size > 6 * 1024 * 1024) { setError("Please choose a photo under 6MB."); return; }
    setError("");
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  const startHunt = async () => {
    if (!hunt || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/${citySlug}/hunts/${hunt.slug}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: name.trim(),
          email: email.trim() || undefined,
          party_type: partyType ?? "team",
          party_size: partyType === "solo" ? 1 : partySize,
          photos_consented: photosConsented,
        }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; data?: { id?: string }; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.data?.id) {
        setError(payload?.error ?? "Could not start the hunt. Please try again.");
        setBusy(false);
        return;
      }
      const sessionId = payload.data.id;
      /* The photo needs a session to belong to, so it goes up after the session
         exists. A failed upload must not block the walk — the team can add one
         later, and the hunt is the point. */
      if (photo) {
        const form = new FormData();
        form.append("photo", photo.file);
        await fetch(`/api/v1/${citySlug}/sessions/${sessionId}/avatar`, { method: "POST", body: form }).catch(() => undefined);
      }
      router.push(`/${citySlug}/hunt/${sessionId}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  if (!hunt) {
    return (
      <main className={styles.app}>
        <div className={styles.screen}>
          <div className={`${styles.sheet} ${styles.sheetPlain}`}>
            <h1 className={styles.title}>No hunts here yet</h1>
            <p className={styles.lede}>Inglewood is our first street — hunts for this city are still being written.</p>
            <Link className={styles.cta} href={`/${citySlug}`}>Back to the map</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.app}>
      <div className={styles.screen}>
        {step === "preview" ? (
          <div className={styles.previewLayout}>
            {/* No photo here yet: the only street images we hold are hunt stops, and
                putting one on the cover would answer a riddle. stroll-main-map.jpg is
                a screenshot of the map app itself, which read as a broken duplicate.
                The brand gradient carries it until there is a neutral photo. */}
            <div className={styles.heroPane}>
                <span className={styles.heroShade} aria-hidden />
                <div className={styles.heroBar}>
                  <button className={styles.circleBtn} onClick={goBack} aria-label="Back to the map">
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    className={`${styles.circleBtn} ${styles.circleEnd} ${saved ? styles.circleOn : ""}`}
                    onClick={() => setSaved((value) => !value)}
                    aria-pressed={saved}
                    aria-label="Save this hunt"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
                      <path
                        d="M10 16.5S3.6 12.4 3.6 8.1A3.6 3.6 0 0 1 10 5.9a3.6 3.6 0 0 1 6.4 2.2c0 4.3-6.4 8.4-6.4 8.4z"
                        fill={saved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              <span className={`${styles.heroTag} ${styles.mono}`}><i />Inglewood · 9 Ave SE</span>
            </div>

            <div className={styles.previewMain}>
              <div className={styles.scroll}>
                <div className={styles.sheet}>
                <span className={`${styles.kicker} ${styles.mono}`}>
                  {hunt.name} · {isFree ? "Free" : "$20 per team"}
                </span>
                <h1 className={styles.title}>Inglewood<br />Hidden Gems</h1>

                <div className={styles.chips}>
                  <span className={`${styles.chip} ${styles.chipBlue}`}>
                    <Clock size={14} color="var(--brand)" />{durationLabel(hunt.est_minutes)}
                  </span>
                  <span className={`${styles.chip} ${styles.chipPink}`}>
                    <MapPin size={14} color="var(--warm-ink)" />{(hunt.distance_m / 1000).toFixed(1)} km
                  </span>
                  <span className={`${styles.chip} ${styles.chipGreen}`}>
                    <TrendingUp size={14} color="#3D6B2A" />{hunt.difficulty}
                  </span>
                </div>

                <p className={styles.lede}>{hunt.blurb || "Explore Inglewood’s best spots, solve clues, discover local gems and learn cool facts along the way."}</p>

                <strong className={styles.sectionLabel}>What to expect</strong>
                <ul className={styles.ticks}>
                  {[`${hunt.stop_count} unique stops`, "Fun clues & local stories", "Great for friends, a date or family"].map((line) => (
                    <li className={styles.tick} key={line}>
                      <span className={styles.tickMark}><Check size={10} color="#14161A" strokeWidth={3} /></span>
                      {line}
                    </li>
                  ))}
                </ul>

                <div className={styles.routeHead}>
                  <strong className={styles.sectionLabel} style={{ marginBottom: 0 }}>Route preview</strong>
                  <span className={`${styles.routeNote} ${styles.mono}`}>Tap a stop</span>
                </div>
                <div className={styles.route}>
                  <svg viewBox="0 0 320 132" preserveAspectRatio="none" className={styles.routeLine} aria-hidden>
                    <path d="M40 84 L104 46 L160 74 L212 96 L276 52" fill="none" stroke="#C3CBD6" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
                  </svg>
                  {dots.map((dot, i) => (
                    <button
                      key={dot.x}
                      className={`${styles.routeStop} ${i === pickedDot ? styles.routeStopOn : ""}`}
                      style={{ left: dot.x, top: dot.y }}
                      onClick={() => setPickedDot(i)}
                      aria-pressed={i === pickedDot}
                      aria-label={`Stop ${i + 1} of ${stopTotal}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className={styles.routeCard}>
                  <span className={`${styles.routeCardK} ${styles.mono}`}>Stop {pickedDot + 1} of {stopTotal}</span>
                  <strong className={styles.routeCardV}>Sealed until you get there</strong>
                  {/* Naming the stop here would answer its riddle before the walk begins. */}
                  <span className={styles.routeCardHint}>
                    Each stop opens with a riddle. Solve it, walk to the door, take a photo — then the next one unlocks.
                  </span>
                  </div>
                </div>
              </div>

              <div className={styles.footer}>
                <button className={styles.cta} onClick={goNext}>
                  Start hunt <ChevronRight size={15} />
                </button>
                <span className={styles.ctaNote}>
                  {isFree ? "No account, no app — opens in your browser" : "Your first Full Hunt is free"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.progress} aria-hidden>
              {STEPS.map((item, i) => (
                <span key={item} className={`${styles.progressStep} ${i <= stepIndex ? styles.progressOn : ""}`} />
              ))}
            </div>
            <div className={styles.stepHead}>
              <button className={styles.circleBtn} onClick={goBack} aria-label="Back">
                <ChevronLeft size={17} />
              </button>
              <span className={`${styles.stepCount} ${styles.mono}`}>Step {stepIndex + 1} of {STEPS.length}</span>
            </div>

            <div className={styles.scroll}>
              <div className={`${styles.sheet} ${styles.sheetPlain}`}>
                {step === "party" && (
                  <>
                    <h1 className={`${styles.title} ${styles.titleSm}`}>Walking alone or with people?</h1>
                    <p className={styles.lede}>It changes nothing about the riddles — just how the punch card is signed.</p>
                    <div className={styles.choices}>
                      <button className={`${styles.choice} ${partyType === "solo" ? styles.choiceOn : ""}`} onClick={() => setPartyType("solo")} aria-pressed={partyType === "solo"}>
                        <span className={styles.choiceIcon}><User size={22} /></span>
                        <span className={styles.choiceBody}>
                          <span className={styles.choiceName}>Solo</span>
                          <span className={styles.choiceMeta}>Just me. The postcard comes out in my name.</span>
                        </span>
                      </button>
                      <button className={`${styles.choice} ${partyType === "team" ? styles.choiceOn : ""}`} onClick={() => setPartyType("team")} aria-pressed={partyType === "team"}>
                        <span className={styles.choiceIcon}><Users size={22} /></span>
                        <span className={styles.choiceBody}>
                          <span className={styles.choiceName}>Team</span>
                          <span className={styles.choiceMeta}>Two or more. One punch card, shared between phones.</span>
                        </span>
                      </button>
                    </div>

                    {partyType === "team" && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>How many of you?</span>
                        <div className={styles.counterRow}>
                          <button className={styles.counterBtn} onClick={() => setPartySize((n) => Math.max(2, n - 1))} disabled={partySize <= 2} aria-label="Fewer people">
                            <Minus size={17} />
                          </button>
                          <span className={styles.counterValue}>{partySize}</span>
                          <button className={styles.counterBtn} onClick={() => setPartySize((n) => Math.min(24, n + 1))} disabled={partySize >= 24} aria-label="More people">
                            <Plus size={17} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {step === "name" && (
                  <>
                    <h1 className={`${styles.title} ${styles.titleSm}`}>
                      {partyType === "solo" ? "What should we call you?" : "Name your team"}
                    </h1>
                    <p className={styles.lede}>This goes on the punch card and the postcard at the end.</p>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="hunt-name">
                        {partyType === "solo" ? "Your name" : "Team name"}
                      </label>
                      <input
                        id="hunt-name"
                        ref={nameRef}
                        className={styles.input}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={partyType === "solo" ? "Alex" : "The Nine Avenue Nine"}
                        maxLength={80}
                        autoComplete={partyType === "solo" ? "given-name" : "off"}
                        onKeyDown={(event) => { if (event.key === "Enter" && canContinue) goNext(); }}
                      />
                      <span className={styles.hintText}>You can be anyone. Nothing here is checked.</span>
                    </div>
                  </>
                )}

                {step === "photo" && (
                  <>
                    <h1 className={`${styles.title} ${styles.titleSm}`}>Add a photo</h1>
                    <p className={styles.lede}>It sits on your punch card and the finished postcard. Skip it if you would rather not.</p>
                    <div className={styles.avatarWrap}>
                      <label className={`${styles.avatar} ${photo ? styles.avatarFilled : ""}`}>
                        {photo
                          /* eslint-disable-next-line @next/next/no-img-element -- object URL from the file picker */
                          ? <img src={photo.url} alt="Your team photo" />
                          : <Camera size={30} />}
                        <input type="file" accept="image/*" capture="environment" onChange={(event) => pickPhoto(event.target.files?.[0])} aria-label="Choose a photo" />
                      </label>
                      <span className={styles.avatarHint}>
                        {photo ? "Tap the photo to choose a different one." : "Tap to take one now or pick from your camera roll."}
                      </span>
                    </div>
                  </>
                )}

                {step === "details" && (
                  <>
                    <h1 className={`${styles.title} ${styles.titleSm}`}>Last couple of things</h1>
                    <p className={styles.lede}>Both optional, except the age check if this hunt needs one.</p>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="hunt-email">Email for the postcard <span className={styles.hintText}>(optional)</span></label>
                      <input
                        id="hunt-email"
                        className={styles.input}
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        maxLength={160}
                        autoComplete="email"
                      />
                      <span className={styles.hintText}>We send the finished postcard once. No list, no follow-ups.</span>
                    </div>

                    <button className={`${styles.checkRow} ${photosConsented ? styles.checkRowOn : ""}`} onClick={() => setPhotosConsented((v) => !v)} aria-pressed={photosConsented}>
                      <span className={styles.checkBox}>{photosConsented && <Check size={14} strokeWidth={3} />}</span>
                      <span className={styles.checkBody}>
                        <span className={styles.checkTitle}>Stroll can show our photos</span>
                        <span className={styles.checkMeta}>Only if you tick this. Your photos stay private otherwise.</span>
                      </span>
                    </button>

                    {needsAgeGate && (
                      <button className={`${styles.checkRow} ${ageConfirmed ? styles.checkRowOn : ""}`} onClick={() => setAgeConfirmed((v) => !v)} aria-pressed={ageConfirmed}>
                        <span className={styles.checkBox}>{ageConfirmed && <Check size={14} strokeWidth={3} />}</span>
                        <span className={styles.checkBody}>
                          <span className={styles.checkTitle}>Everyone walking is 18 or over</span>
                          <span className={styles.checkMeta}>This hunt includes stops that serve alcohol.</span>
                        </span>
                      </button>
                    )}
                  </>
                )}

                {step === "ready" && (
                  <>
                    <h1 className={`${styles.title} ${styles.titleSm}`}>Ready when you are</h1>
                    <p className={styles.lede}>First riddle opens as soon as you start. The clock only matters in a race.</p>
                    <div className={styles.summary}>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryKey}>Hunt</span>
                        <span className={styles.summaryVal}>{hunt.name} · {hunt.stop_count} stops</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryKey}>Walking</span>
                        <span className={styles.summaryVal}>{partyType === "solo" ? "Solo" : `Team of ${partySize}`}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryKey}>Name</span>
                        <span className={styles.summaryVal}>{name.trim() || "—"}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryKey}>Photo</span>
                        {photo
                          /* eslint-disable-next-line @next/next/no-img-element -- object URL from the file picker */
                          ? <img className={styles.summaryAvatar} src={photo.url} alt="" />
                          : <span className={styles.summaryVal}>Not added</span>}
                      </div>
                      {email.trim() && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryKey}>Email</span>
                          <span className={styles.summaryVal}>{email.trim()}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.footer}>
              {step === "ready" ? (
                <button className={styles.cta} onClick={startHunt} disabled={busy}>
                  {busy ? "Starting…" : "Start the hunt"} <ChevronRight size={15} />
                </button>
              ) : step === "photo" ? (
                <div className={styles.ctaRow}>
                  <button className={`${styles.cta} ${styles.ctaGhost}`} onClick={goNext}>Skip</button>
                  <button className={styles.cta} onClick={goNext} disabled={!photo}>Continue <ChevronRight size={15} /></button>
                </div>
              ) : (
                <button className={styles.cta} onClick={goNext} disabled={!canContinue}>
                  Continue <ChevronRight size={15} />
                </button>
              )}
              {error && <span className={styles.errorNote}>{error}</span>}
              {!error && step === "details" && needsAgeGate && !ageConfirmed && (
                <span className={styles.ctaNote}>Confirm the age check to carry on.</span>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(appRoot, "..");
const dataPath = path.join(appRoot, "public", "data", "stroll-data.json");
const reportDir = path.join(projectRoot, "reports");
const assetRoot = path.join(appRoot, "public", "media", "businesses");
const heroDir = path.join(assetRoot, "heroes");
const logoDir = path.join(assetRoot, "logos");
const reportPath = path.join(reportDir, "google-places-business-enrichment-report.json");
const missingXlsxPath = path.join(projectRoot, "business that require marketing help.xlsx");
const missingCsvPath = path.join(projectRoot, "business that require marketing help.csv");

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const limit = Number(process.env.STROLL_ENRICH_LIMIT || "0");
const onlyMissing = process.env.STROLL_ENRICH_ONLY_MISSING !== "0";
const delayMs = Number(process.env.STROLL_GOOGLE_DELAY_MS || "120");
const fetchTimeout = Number(process.env.STROLL_FETCH_TIMEOUT_MS || "12000");

if (!apiKey) {
  console.error("GOOGLE_MAPS_API_KEY is required");
  process.exit(1);
}

const manualWebsiteAliases = new Map(Object.entries({
  "brooklyn dumplings shop": "https://brooklyndumplingshop.com",
  "brooklyn dumpling shop": "https://brooklyndumplingshop.com",
}));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function norm(input) {
  return String(input || "").toLowerCase().replace(/&/g, "and").replace(/\bthe\b/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function slugify(input) {
  return String(input || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || crypto.randomUUID();
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
}

function officialScore(place, business) {
  const name = norm(place.name);
  const biz = norm(business.name);
  const address = norm(place.formatted_address || place.vicinity || "");
  const bizWords = biz.split(" ").filter((w) => w.length > 2 && !["shop", "store", "the", "and", "co", "inc", "yyc"].includes(w));
  const hits = bizWords.filter((word) => name.includes(word)).length;
  let score = hits / Math.max(1, Math.min(bizWords.length, 4));
  if (address.includes("calgary")) score += 0.15;
  if (address.includes(norm(business.address).split(" ")[0])) score += 0.1;
  if (place.business_status && place.business_status !== "OPERATIONAL") score -= 0.25;
  return Math.max(0, Math.min(1, score));
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "stroll.city enrichment" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function downloadBinary(url, outputDir, slug, kind) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeout);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; stroll.city enrichment)" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`Not image: ${type}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 350 || buffer.byteLength > 6_000_000) throw new Error(`Image size ${buffer.byteLength} not usable`);
    const ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : type.includes("gif") ? ".gif" : ".jpg";
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `${slug}-${kind}${ext}`;
    await fs.writeFile(path.join(outputDir, filename), buffer);
    return `/media/businesses/${kind === "logo" ? "logos" : "heroes"}/${filename}`;
  } finally {
    clearTimeout(timer);
  }
}

async function googleTextSearch(business) {
  const query = `${business.name} ${business.address} Calgary Alberta`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") throw new Error(`Text search ${data.status || "failed"}`);
  const places = data.results || [];
  places.sort((a, b) => officialScore(b, business) - officialScore(a, business));
  const best = places[0];
  if (!best) return null;
  const score = officialScore(best, business);
  if (score < 0.45) return null;
  return { ...best, confidence: score };
}

async function googleDetails(placeId) {
  const fields = "name,formatted_address,website,international_phone_number,url,photos,business_status";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  if (data.status !== "OK") throw new Error(`Place details ${data.status || "failed"}`);
  return data.result;
}

function worksheetXml(rows) {
  const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, i) => `<row r="${i + 1}">${row.map((cell, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t>${esc(cell)}</t></is></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;
}

async function createXlsx(rows, outPath) {
  const tmp = await fs.mkdtemp(path.join("/tmp", "stroll-xlsx-"));
  await fs.mkdir(path.join(tmp, "_rels"), { recursive: true });
  await fs.mkdir(path.join(tmp, "xl", "worksheets"), { recursive: true });
  await fs.mkdir(path.join(tmp, "xl", "_rels"), { recursive: true });
  await fs.writeFile(path.join(tmp, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  await fs.writeFile(path.join(tmp, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  await fs.writeFile(path.join(tmp, "xl", "workbook.xml"), `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Marketing Help" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  await fs.writeFile(path.join(tmp, "xl", "_rels", "workbook.xml.rels"), `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  await fs.writeFile(path.join(tmp, "xl", "worksheets", "sheet1.xml"), worksheetXml(rows));
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const code = `import os, zipfile\nout=${JSON.stringify(outPath)}\nroot=${JSON.stringify(tmp)}\nwith zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:\n    for base, _dirs, files in os.walk(root):\n        for name in files:\n            full=os.path.join(base, name)\n            z.write(full, os.path.relpath(full, root))\n`;
    const zip = spawn("python3", ["-c", code]);
    zip.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`python zip exited ${code}`)));
    zip.on("error", reject);
  });
}

async function refreshMarketingSheet(data) {
  const missing = data.businesses
    .filter((business) => !business.website || !business.logo_url)
    .map((business) => [
      business.name,
      business.address,
      business.category,
      business.website || "",
      business.logo_url || "",
      !business.website ? "Missing website" : "",
      !business.logo_url ? "Missing logo" : "",
      business.domain || "",
      business.google_place_url || "",
      business.phone || "",
    ]);
  const header = ["Business", "Address", "Category", "Detected website", "Detected logo", "Website issue", "Logo issue", "Domain hint", "Google place", "Phone"];
  const rows = [header, ...missing];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
  await fs.writeFile(missingCsvPath, csv);
  try {
    await fs.access(missingXlsxPath);
    const archiveDir = path.join(projectRoot, "40_Archive", "business-marketing-help-reports");
    await fs.mkdir(archiveDir, { recursive: true });
    await fs.rename(missingXlsxPath, path.join(archiveDir, `business that require marketing help-google-${Date.now()}.xlsx`));
  } catch {}
  await createXlsx(rows, missingXlsxPath);
  return missing.length;
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(heroDir, { recursive: true });
  await fs.mkdir(logoDir, { recursive: true });
  const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
  const candidates = data.businesses.filter((b) => !onlyMissing || !b.website || !b.phone || !b.photo || String(b.photo).includes("picsum.photos"));
  const businesses = limit > 0 ? candidates.slice(0, limit) : candidates;
  const report = [];

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const slug = slugify(`${business.name}-${business.id}`);
    const row = { id: business.id, name: business.name, beforeWebsite: business.website || null, status: "pending", notes: [] };
    process.stdout.write(`[${i + 1}/${businesses.length}] ${business.name} ... `);
    try {
      const manual = manualWebsiteAliases.get(norm(business.name));
      let details = null;
      let place = null;
      await sleep(delayMs);
      place = await googleTextSearch(business);
      if (place?.place_id) {
        await sleep(delayMs);
        details = await googleDetails(place.place_id);
        row.googleName = details.name || place.name;
        row.googleConfidence = place.confidence;
        row.googleStatus = details.business_status || place.business_status || null;
        if (details.url) business.google_place_url = details.url;
        if (details.international_phone_number) business.phone = details.international_phone_number;
      }

      const website = manual || details?.website || business.website;
      if (website) {
        business.website = website;
        business.domain = domainOf(website);
      }

      if (details?.photos?.[0]?.photo_reference && (!business.photo || String(business.photo).includes("picsum.photos"))) {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${encodeURIComponent(details.photos[0].photo_reference)}&key=${encodeURIComponent(apiKey)}`;
        try {
          const hero = await downloadBinary(photoUrl, heroDir, slug, "hero");
          if (hero) business.photo = hero;
          row.hero = hero;
        } catch (error) {
          row.notes.push(`google photo failed: ${error.message}`);
        }
      }

      if (business.domain && !business.logo_url) {
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(business.domain)}&sz=128`;
        try {
          const logo = await downloadBinary(faviconUrl, logoDir, slug, "logo");
          if (logo) business.logo_url = logo;
          row.logo = logo;
        } catch (error) {
          row.notes.push(`favicon logo failed: ${error.message}`);
        }
      }

      if (website || details?.url || details?.international_phone_number) {
        business.media_source = [business.media_source, "google-places-enrichment"].filter(Boolean).join(" + ");
        business.media_review = business.logo_url && business.photo && !String(business.photo).includes("picsum.photos") ? "auto-detected" : "needs-review";
        business.media_confidence = Math.max(Number(business.media_confidence || 0), Math.round((place?.confidence || 0.65) * 100) / 100);
        business.needsReview = !(business.website && business.logo_url && business.photo && !String(business.photo).includes("picsum.photos"));
        row.status = business.needsReview ? "partially-enriched" : "enriched";
      } else {
        row.status = "no-confident-google-match";
      }
      row.afterWebsite = business.website || null;
      console.log(row.status);
    } catch (error) {
      row.status = "error";
      row.notes.push(error.message);
      console.log(`error (${error.message})`);
    }
    report.push(row);
  }

  data.generatedAt = new Date().toISOString();
  await fs.writeFile(dataPath, `${JSON.stringify(data)}\n`);
  const missingRows = await refreshMarketingSheet(data);
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), processed: businesses.length, missingRows, report }, null, 2)}\n`);
  console.log(`Processed: ${businesses.length}`);
  console.log(`Websites: ${data.businesses.filter((b) => b.website).length}`);
  console.log(`Phones: ${data.businesses.filter((b) => b.phone).length}`);
  console.log(`Logos: ${data.businesses.filter((b) => b.logo_url).length}`);
  console.log(`Heroes: ${data.businesses.filter((b) => b.photo && !String(b.photo).includes("picsum.photos")).length}`);
  console.log(`Marketing-help rows: ${missingRows}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

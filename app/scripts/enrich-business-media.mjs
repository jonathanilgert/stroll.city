import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(appRoot, "..");
const dataPath = path.join(appRoot, "public", "data", "stroll-data.json");
const reportDir = path.join(projectRoot, "reports");
const assetRoot = path.join(appRoot, "public", "media", "businesses");
const logoDir = path.join(assetRoot, "logos");
const heroDir = path.join(assetRoot, "heroes");
const reportPath = path.join(reportDir, "business-media-enrichment-report.json");
const missingXlsxPath = path.join(projectRoot, "business that require marketing help.xlsx");
const missingCsvPath = path.join(projectRoot, "business that require marketing help.csv");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const limit = Number(process.env.STROLL_ENRICH_LIMIT || "0");
const fetchTimeout = Number(process.env.STROLL_FETCH_TIMEOUT_MS || "8500");
const searchDelay = Number(process.env.STROLL_SEARCH_DELAY_MS || "850");

const blockedHosts = [
  "facebook.com", "instagram.com", "x.com", "twitter.com", "linkedin.com", "youtube.com", "tiktok.com",
  "google.com", "goo.gl", "maps.apple.com", "bing.com", "duckduckgo.com", "yelp", "tripadvisor", "yellowpages",
  "doordash", "ubereats", "skipthedishes", "opentable", "resy.com", "sirved.com", "restaurantji", "menupix",
  "calgary.ca", "data.calgary.ca", "wikipedia.org", "mapcarta", "canpages", "nicelocal", "chamberofcommerce",
  "indeed.com", "glassdoor", "zomato", "foursquare", "allmenus", "find-open", "hours-locations",
];

const manualDomains = new Map(Object.entries({
  "rain dog bar": "raindogbar.com",
  "fair's fair (for book lovers)": "fairsfairbooks.com",
  "gravity espresso and wine bar": "gravityespresso.com",
  "deane house": "deanehouse.com",
  "hose & hound pub": "hoseandhound.ca",
  "ironwood stage and grill": "ironwoodstage.ca",
  "esker foundation": "eskerfoundation.art",
  "smithbilt hats": "smithbilthats.com",
  "made by marcus": "madebymarcus.ca",
  "rosso coffee roasters inglewood": "rossocoffee.com",
  "inglewood pizza & pasta": "inglewoodpizza.ca",
  "doughnut party": "doughnutparty.ca",
  "king eddy live music": "kingeddy.ca",
  "monki breakfast club & bistro": "monkibistro.ca",
  "tupi acai bowls": "tupi.ca",
  "cold garden beverage company": "coldgarden.ca",
  "devil's head coffee": "devilsheadcoffee.ca",
  "vegan street": "veganstreet.ca",
  "the confluence historic site & parkland": "theconfluence.ca",
  "apothecary in inglewood (the)": "the-apothecary.ca",
  "recordland": "recordlandcalgary.com",
  "patisseries louise": "patisserielouise.ca",
  "brooklyn dumplings shop": "brooklyndumplingshop.com",
  "shelter cocktail bar": "shelteryyc.com",
  "ol' beautiful brewing co.": "olbeautiful.com",
  "ol beautiful brewing co.": "olbeautiful.com",
  "high line brewing": "highlinebrewing.com",
  "inglewood drive in": "inglewooddrivein.com",
  "inglewood bird sanctuary": "calgary.ca",
  "lina's italian piazza": "linasmarket.com",
  "analog": "analogcoffee.ca",
  "respect eyecare": "respecteyecare.com",
  "be brave": "bebrave.ca",
  "smithbilt hats inc": "smithbilthats.com",
}));

function norm(input) {
  return String(input || "").toLowerCase().replace(/&/g, "and").replace(/\bthe\b/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function slugify(input) {
  return String(input || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || crypto.randomUUID();
}

function htmlDecode(input = "") {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteUrl(value, base) {
  if (!value) return null;
  const clean = htmlDecode(value).trim();
  if (clean.startsWith("data:")) return null;
  try { return new URL(clean, base).toString(); } catch { return null; }
}

function isBlockedHost(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return blockedHosts.some((blocked) => host.includes(blocked));
  } catch {
    return true;
  }
}

function likelyOfficial(url, business) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (isBlockedHost(url)) return 0;
    const hostNorm = norm(host.split(".")[0]);
    const bizNorm = norm(business.name);
    const words = bizNorm.split(" ").filter((w) => w.length > 2 && !["calgary", "inglewood", "shop", "store", "the", "and", "co", "inc"].includes(w));
    const hits = words.filter((word) => hostNorm.includes(word) || host.includes(word)).length;
    let score = hits / Math.max(1, Math.min(words.length, 4));
    if (host.endsWith(".ca")) score += 0.1;
    if (host.includes("yyc") || host.includes("calgary") || host.includes("inglewood")) score += 0.08;
    return Math.min(score, 1);
  } catch {
    return 0;
  }
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; stroll.city media enrichment; +https://stroll.city)",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const finalHost = new URL(response.url).hostname.replace(/^www\./, "").toLowerCase();
    if (["hugedomains.com", "sedo.com", "afternic.com", "dan.com", "godaddy.com"].some((host) => finalHost.includes(host))) {
      throw new Error(`Parked/for-sale domain: ${finalHost}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) throw new Error(`Not HTML: ${contentType}`);
    return { url: response.url, html: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function searchHtml(url, engine) {
  try {
    return (await fetchText(url, { headers: { accept: "text/html" } })).html;
  } catch (error) {
    return { error: `${engine}: ${error.message}` };
  }
}

function rankSearchLinks(html, business, engine) {
  const found = [];
  const hrefs = html.matchAll(/href=["']([^"']+)["']/g);
  for (const match of hrefs) {
    let href = htmlDecode(match[1]);
    if (href.includes("uddg=")) {
      try { href = new URL(href, "https://duckduckgo.com").searchParams.get("uddg") || href; } catch {}
    }
    if (href.startsWith("/ck/a") || href.startsWith("/aclick")) {
      try { href = new URL(href, "https://www.bing.com").searchParams.get("u") || href; } catch {}
      if (href?.startsWith("a1")) {
        try { href = Buffer.from(href.slice(2), "base64").toString("utf8"); } catch {}
      }
    }
    if (!href.startsWith("http")) continue;
    const score = likelyOfficial(href, business);
    if (score > 0.2) found.push({ url: href.split("#")[0], confidence: Math.min(1, score + (engine === "manual" ? 0.1 : 0)) });
  }
  found.sort((a, b) => b.confidence - a.confidence);
  return found;
}

async function searchWebsite(business) {
  const existing = business.website || (business.domain ? `https://${business.domain}` : null);
  if (existing) return { url: existing, source: "existing-domain", confidence: 0.92 };
  const manual = manualDomains.get(norm(business.name));
  if (manual) return { url: `https://${manual}`, source: "manual-domain-seed", confidence: 0.9 };

  const query = `"${business.name}" "${business.address}" Calgary official website`;
  const searches = [
    { engine: "bing", url: `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
    { engine: "duckduckgo", url: `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}` },
  ];
  const notes = [];
  for (const search of searches) {
    await sleep(searchDelay);
    const html = await searchHtml(search.url, search.engine);
    if (typeof html !== "string") {
      notes.push(html.error);
      continue;
    }
    const found = rankSearchLinks(html, business, search.engine);
    const best = found[0];
    if (best) return { ...best, source: search.engine };
  }
  return { url: null, source: "not-found", confidence: 0, note: notes.join("; ") || "No confident official website found" };
}

function metaContent(html, selectors) {
  for (const selector of selectors) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${selector}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${selector}["'][^>]*>`, "i");
    const match = html.match(re) || html.match(re2);
    if (match) return htmlDecode(match[1]);
  }
  return null;
}

function extractJsonLdImages(html) {
  const results = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(htmlDecode(match[1]).trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.logo) results.push({ kind: "logo", value: Array.isArray(item.logo) ? item.logo[0] : item.logo });
        if (item.image) results.push({ kind: "hero", value: Array.isArray(item.image) ? item.image[0] : item.image });
      }
    } catch {}
  }
  return results.map((item) => ({ ...item, value: typeof item.value === "object" ? item.value.url : item.value })).filter((item) => item.value);
}

function findImages(html, baseUrl, business) {
  const jsonLd = extractJsonLdImages(html);
  const candidates = { logos: [], heroes: [] };
  for (const item of jsonLd) {
    const url = absoluteUrl(item.value, baseUrl);
    if (url) candidates[item.kind === "logo" ? "logos" : "heroes"].push({ url, source: "json-ld", score: 0.92 });
  }

  const og = metaContent(html, ["og:image", "twitter:image", "twitter:image:src"]);
  const ogUrl = absoluteUrl(og, baseUrl);
  if (ogUrl) candidates.heroes.push({ url: ogUrl, source: "open-graph", score: 0.88 });

  for (const rel of ["icon", "shortcut icon", "apple-touch-icon", "mask-icon"]) {
    const re = new RegExp(`<link[^>]+rel=["'][^"']*${rel}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, "i");
    const re2 = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${rel}[^"']*["'][^>]*>`, "i");
    const match = html.match(re) || html.match(re2);
    const url = absoluteUrl(match?.[1], baseUrl);
    if (url) candidates.logos.push({ url, source: rel, score: rel.includes("apple") ? 0.7 : 0.55 });
  }

  const bizWords = norm(business.name).split(" ").filter((w) => w.length > 2);
  for (const img of html.matchAll(/<img\b([^>]+)>/gi)) {
    const tag = img[1];
    const src = (tag.match(/(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i) || [])[1];
    const url = absoluteUrl(src, baseUrl);
    if (!url) continue;
    const hay = norm(tag + " " + url);
    let score = 0.25;
    if (hay.includes("logo")) score += 0.55;
    if (hay.includes("brand")) score += 0.25;
    if (bizWords.some((w) => hay.includes(w))) score += 0.15;
    if (score >= 0.55) candidates.logos.push({ url, source: "img-logo-candidate", score: Math.min(score, 0.9) });
    if (hay.includes("hero") || hay.includes("banner") || hay.includes("header")) candidates.heroes.push({ url, source: "img-hero-candidate", score: 0.62 });
  }

  candidates.logos.sort((a, b) => b.score - a.score);
  candidates.heroes.sort((a, b) => b.score - a.score);
  return candidates;
}

function extFrom(url, contentType) {
  const byType = contentType?.includes("png") ? ".png" : contentType?.includes("webp") ? ".webp" : contentType?.includes("svg") ? ".svg" : contentType?.includes("gif") ? ".gif" : contentType?.includes("jpeg") || contentType?.includes("jpg") ? ".jpg" : "";
  if (byType) return byType;
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"].includes(ext) ? ext : ".jpg";
  } catch { return ".jpg"; }
}

async function downloadImage(url, outputDir, slug, kind) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeout);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; stroll.city enrichment)" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/") && !url.toLowerCase().endsWith(".svg")) throw new Error(`Not image: ${contentType}`);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 128 || arrayBuffer.byteLength > 6_000_000) throw new Error(`Image size ${arrayBuffer.byteLength} not usable`);
    await fs.mkdir(outputDir, { recursive: true });
    const ext = extFrom(response.url || url, contentType);
    const filename = `${slug}-${kind}${ext}`;
    await fs.writeFile(path.join(outputDir, filename), Buffer.from(arrayBuffer));
    return `/media/businesses/${kind === "logo" ? "logos" : "heroes"}/${filename}`;
  } finally {
    clearTimeout(timer);
  }
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
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const code = `import os, zipfile\nout=${JSON.stringify(outPath)}\nroot=${JSON.stringify(tmp)}\nwith zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:\n    for base, _dirs, files in os.walk(root):\n        for name in files:\n            full=os.path.join(base, name)\n            z.write(full, os.path.relpath(full, root))\n`;
    const zip = spawn("python3", ["-c", code]);
    zip.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`python zip exited ${code}`)));
    zip.on("error", reject);
  });
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(logoDir, { recursive: true });
  await fs.mkdir(heroDir, { recursive: true });
  const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
  const businesses = limit > 0 ? data.businesses.slice(0, limit) : data.businesses;
  const report = [];

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const slug = slugify(`${business.name}-${business.id}`);
    const row = { id: business.id, name: business.name, address: business.address, website: null, logo: null, hero: null, status: "pending", notes: [] };
    process.stdout.write(`[${i + 1}/${businesses.length}] ${business.name} ... `);

    try {
      const discovered = await searchWebsite(business);
      row.website = discovered.url;
      row.websiteSource = discovered.source;
      row.websiteConfidence = discovered.confidence;
      if (!discovered.url || discovered.confidence < 0.35) throw new Error(discovered.note || "No confident official website found");
      business.website = discovered.url;
      business.domain = business.domain || new URL(discovered.url).hostname.replace(/^www\./, "");

      const page = await fetchText(discovered.url);
      const candidates = findImages(page.html, page.url, business);
      const logoCandidate = candidates.logos[0];
      const heroCandidate = candidates.heroes[0];
      row.logoSource = logoCandidate?.url || null;
      row.heroSource = heroCandidate?.url || null;
      row.logoConfidence = logoCandidate?.score || 0;
      row.heroConfidence = heroCandidate?.score || 0;

      let logoPath = null;
      let heroPath = null;
      if (logoCandidate && logoCandidate.score >= 0.55) {
        try { logoPath = await downloadImage(logoCandidate.url, logoDir, slug, "logo"); } catch (error) { row.notes.push(`logo download failed: ${error.message}`); }
      }
      if (heroCandidate && heroCandidate.score >= 0.55) {
        try { heroPath = await downloadImage(heroCandidate.url, heroDir, slug, "hero"); } catch (error) { row.notes.push(`hero download failed: ${error.message}`); }
      }

      business.website = page.url;
      business.domain = new URL(page.url).hostname.replace(/^www\./, "");
      business.media_source = "website-enrichment";
      business.media_review = logoPath && heroPath ? "auto-detected" : "needs-review";
      business.media_confidence = Math.round(Math.max(discovered.confidence, logoCandidate?.score || 0, heroCandidate?.score || 0) * 100) / 100;
      if (logoPath) business.logo_url = logoPath;
      if (heroPath) business.photo = heroPath;
      if (logoPath || heroPath || page.url) business.needsReview = !(logoPath && heroPath);

      row.logo = logoPath;
      row.hero = heroPath;
      row.status = logoPath || heroPath ? "enriched" : "website-found-no-media";
      console.log(`${row.status}`);
    } catch (error) {
      row.status = "needs-marketing-help";
      row.notes.push(error.message);
      if (String(error.message).includes("Parked/for-sale")) {
        delete business.website;
        delete business.logo_url;
        business.photo = String(business.photo || "").includes("picsum.photos") ? business.photo : `https://picsum.photos/seed/strollyyc${business.id}/520/340`;
        business.media_review = "parked-domain-needs-review";
      } else if (row.website) {
        business.media_source = "website-enrichment";
        business.media_review = "website-found-media-needed";
        business.needsReview = true;
      }
      console.log(`needs help (${error.message})`);
    }
    report.push(row);
  }

  await fs.writeFile(dataPath, `${JSON.stringify(data)}\n`);
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), total: businesses.length, report }, null, 2)}\n`);

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
    ]);
  const header = ["Business", "Address", "Category", "Detected website", "Detected logo", "Website issue", "Logo issue", "Domain hint"];
  const csvRows = [header, ...missing];
  const csv = csvRows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
  await fs.writeFile(missingCsvPath, csv);
  try {
    await fs.access(missingXlsxPath);
    const archiveDir = path.join(projectRoot, "40_Archive", "business-marketing-help-reports");
    await fs.mkdir(archiveDir, { recursive: true });
    await fs.rename(missingXlsxPath, path.join(archiveDir, `business that require marketing help-${Date.now()}.xlsx`));
  } catch {}
  await createXlsx(csvRows, missingXlsxPath);

  const enrichedWebsites = data.businesses.filter((b) => b.website).length;
  const enrichedLogos = data.businesses.filter((b) => b.logo_url).length;
  const enrichedHeroes = data.businesses.filter((b) => b.photo && !String(b.photo).includes("picsum.photos")).length;
  console.log(JSON.stringify({ total: data.businesses.length, processed: businesses.length, enrichedWebsites, enrichedLogos, enrichedHeroes, missingMarketingHelp: missing.length, reportPath, missingXlsxPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

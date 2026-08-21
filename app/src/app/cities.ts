import type { CSSProperties } from "react";

export type CityStatus = "live" | "soon";

export type CityTheme = {
  primary: string;
  primaryDark: string;
  grey: string;
  sky: string;
  skyDark: string;
  sun: string;
  green: string;
  ink: string;
  /** Fill tone — pins, tiles, legend dots. Pair with onCategory() for the ink on top. */
  categories: Record<string, string>;
  /** The same hue darkened enough to be read as text or a stroke on a light surface. */
  categoryInks: Record<string, string>;
  archColors: string[];
  headerStripe: string[];
  welcomeGradient: string[];
  brandTag: string;
  welcomeLine: string;
};

export type CityConfig = {
  slug: string;
  name: string;
  tagline: string;
  status: CityStatus;
  defaultHood: string;
  dataPath?: string;
  center: [number, number];
  theme: CityTheme;
};

export const calgaryTheme: CityTheme = {
  primary: "#0B47E8",
  primaryDark: "#0736B8",
  grey: "#55585F",
  sky: "#1573C6",
  skyDark: "#12639F",
  sun: "#F5C93F",
  green: "#2E7D50",
  ink: "#14161A",
  categories: {
    restaurant: "#F58AB4",
    cafe: "#F5C93F",
    bar: "#8468E0",
    shop: "#0B47E8",
    services: "#57C07A",
    gallery: "#1573C6",
  },
  categoryInks: {
    restaurant: "#C2296B",
    cafe: "#8A6410",
    bar: "#5B3FC4",
    shop: "#0B47E8",
    services: "#2E7D50",
    gallery: "#12639F",
  },
  archColors: ["#0B47E8", "#F58AB4", "#DCF23C"],
  headerStripe: ["#0B47E8", "#F58AB4", "#DCF23C"],
  welcomeGradient: ["#CFDCFF", "#E4EBFF", "#F4F5F7", "#FFFFFF"],
  brandTag: "Calgary · Inglewood",
  welcomeLine:
    "Calgary is the Blue Sky City. This is its friendliest map — real streets, real buildings, and every local business one tap away.",
};

export const cities: CityConfig[] = [
  {
    slug: "calgary",
    name: "Calgary",
    tagline: "Blue Sky City · Inglewood first",
    status: "live",
    defaultHood: "inglewood",
    dataPath: "/data/stroll-data.json",
    center: [-114.0358, 51.04185],
    theme: calgaryTheme,
  },
  {
    slug: "edmonton",
    name: "Edmonton",
    tagline: "River City · next",
    status: "soon",
    defaultHood: "whyte",
    center: [-113.4938, 53.5461],
    theme: {
      ...calgaryTheme,
      /* Same system, a different lead hue: Edmonton runs on the azure. */
      primary: "#1573C6",
      primaryDark: "#12639F",
      sky: "#8468E0",
      sun: "#F5C93F",
      green: "#2E7D50",
      archColors: ["#1573C6", "#8468E0", "#DCF23C"],
      headerStripe: ["#1573C6", "#8468E0", "#DCF23C"],
      welcomeGradient: ["#CFE3F7", "#E4EFFB", "#F4F5F7", "#FFFFFF"],
      brandTag: "River City · street map",
      welcomeLine:
        "Edmonton is queued as the multi-city proof: same Stroll product, different local colour, neighbourhoods, and data.",
    },
  },
];

/* Relative luminance, WCAG formula. Decides whether a fill takes dark or light ink —
   the palette mixes deep cobalt with pale gold, so nothing can assume white text. */
export function isLightHex(hex: string) {
  const channel = [1, 3, 5].map((i) => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2] > 0.4;
}

/** Ink that sits on top of a filled swatch of `hex`. */
export function inkOn(hex: string) {
  return isLightHex(hex) ? "#14161A" : "#FFFFFF";
}

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug);
}

export function themeStyle(theme: CityTheme): CSSProperties {
  return {
    "--city-primary": theme.primary,
    "--city-primary-dark": theme.primaryDark,
    "--city-sky": theme.sky,
    "--city-sky-dark": theme.skyDark,
    "--city-sun": theme.sun,
    "--city-green": theme.green,
    "--city-ink": theme.ink,
    "--stripe-a": theme.headerStripe[0],
    "--stripe-b": theme.headerStripe[1],
    "--stripe-c": theme.headerStripe[2],
    "--welcome-a": theme.welcomeGradient[0],
    "--welcome-b": theme.welcomeGradient[1],
    "--welcome-c": theme.welcomeGradient[2],
    "--welcome-d": theme.welcomeGradient[3],
  } as CSSProperties;
}

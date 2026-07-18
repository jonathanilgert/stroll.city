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
  categories: Record<string, string>;
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
  primary: "#C8102E",
  primaryDark: "#A00D25",
  grey: "#4b4f55",
  sky: "#009ADE",
  skyDark: "#0077AD",
  sun: "#F2A900",
  green: "#43893E",
  ink: "#26282c",
  categories: {
    restaurant: "#C8102E",
    cafe: "#A96B3F",
    bar: "#E0A100",
    shop: "#00847E",
    services: "#B25C87",
    gallery: "#5E63B6",
  },
  archColors: ["#C8102E", "#009ADE", "#F2A900"],
  headerStripe: ["#C8102E", "#009ADE", "#F2A900"],
  welcomeGradient: ["#0E86C4", "#2FA5DC", "#8FD0EE", "#DCF1FB"],
  brandTag: "Blue Sky City · street map",
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
    tagline: "River City · coming soon",
    status: "soon",
    defaultHood: "whyte",
    center: [-113.4938, 53.5461],
    theme: {
      ...calgaryTheme,
      primary: "#004C97",
      primaryDark: "#003A73",
      sky: "#7AB2DD",
      sun: "#FFB71B",
      green: "#2E7D32",
      archColors: ["#004C97", "#7AB2DD", "#FFB71B"],
      headerStripe: ["#004C97", "#7AB2DD", "#FFB71B"],
      welcomeGradient: ["#173C66", "#315F8A", "#80B6D9", "#E5F4FB"],
      brandTag: "River City · street map",
      welcomeLine:
        "Edmonton is queued as the multi-city proof: same Stroll product, different local colour, neighbourhoods, and data.",
    },
  },
];

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

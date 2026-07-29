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
  primary: "#1B5FA8",
  primaryDark: "#154C88",
  grey: "#55504A",
  sky: "#0EA5E9",
  skyDark: "#0284C7",
  sun: "#5C6350",
  green: "#5C6350",
  ink: "#1C1A17",
  categories: {
    restaurant: "#8A5F44",
    cafe: "#7E6B3C",
    bar: "#6E5570",
    shop: "#3E6B63",
    services: "#5C6870",
    gallery: "#8A5F76",
  },
  archColors: ["#1B5FA8", "#0EA5E9", "#5C6350"],
  headerStripe: ["#1B5FA8", "#0EA5E9", "#5C6350"],
  welcomeGradient: ["#F0F1EB", "#EFEBE4", "#E8E3DA", "#FFFFFF"],
  brandTag: "Calgary · Blue Sky City",
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
      primary: "#5C6870",
      primaryDark: "#454F56",
      sky: "#38BDF8",
      sun: "#5C6350",
      green: "#5C6350",
      archColors: ["#5C6870", "#38BDF8", "#5C6350"],
      headerStripe: ["#5C6870", "#38BDF8", "#5C6350"],
      welcomeGradient: ["#F0F1EB", "#EFEBE4", "#E8E3DA", "#FFFFFF"],
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

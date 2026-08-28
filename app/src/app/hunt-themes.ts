import type { Category } from "./StrollCityApp";

/* ---------------------------------------------------------------------------
   Hunt themes

   A theme decides which doors a hunt is built from — the same riddles and the
   same rules, a different walk. Shared by the browser (the picker) and the API
   (which selects the stops), so the two can't describe different things.

   The pool behind Inglewood is 102 stops: 46 shops, 21 restaurants, 12 cafés,
   12 studios, 8 bars, 3 galleries. Themes are sized against that — anything
   narrower than a handful of stops would keep serving the same four doors.
--------------------------------------------------------------------------- */

export type HuntTheme = {
  id: string;
  name: string;
  blurb: string;
  /* Empty means the hunt's own curated list, untouched. */
  categories: Category[];
  /* Date night can include a bar; a school trip cannot. */
  allowAgeRestricted: boolean;
  icon: "sparkles" | "heart" | "users" | "bag" | "cup" | "palette";
};

export const HUNT_THEMES: HuntTheme[] = [
  {
    id: "classic",
    name: "The classic",
    blurb: "Our pick of the block — a bit of everything, in a sensible order.",
    categories: [],
    allowAgeRestricted: true,
    icon: "sparkles",
  },
  {
    id: "date-night",
    name: "Date night",
    blurb: "Wine bars, small plates and a gallery to argue about.",
    categories: ["bar", "restaurant", "gallery"],
    allowAgeRestricted: true,
    icon: "heart",
  },
  {
    id: "with-friends",
    name: "Out with friends",
    blurb: "Taprooms, record shops and somewhere loud to end up.",
    categories: ["bar", "shop", "restaurant"],
    allowAgeRestricted: true,
    icon: "users",
  },
  {
    id: "shop-crawl",
    name: "Shop crawl",
    blurb: "Books, records, homeware — the doors you keep walking past.",
    categories: ["shop", "gallery"],
    allowAgeRestricted: false,
    icon: "bag",
  },
  {
    id: "eat-drink",
    name: "Eat your way down",
    blurb: "Bakeries, counters and coffee, roughly in that order.",
    categories: ["cafe", "restaurant"],
    allowAgeRestricted: false,
    icon: "cup",
  },
  {
    id: "makers",
    name: "Makers & galleries",
    blurb: "Studios, workshops and whatever is in the window this week.",
    categories: ["gallery", "services", "shop"],
    allowAgeRestricted: false,
    icon: "palette",
  },
];

export function getHuntTheme(id: string | null | undefined) {
  return HUNT_THEMES.find((theme) => theme.id === id) ?? null;
}

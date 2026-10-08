import { CalendarBlank, ChartLineUp, ChatCircleText, Compass, FilmStrip, GearSix, Scissors } from "@/components/icons";

/** Workspace tabs. Every slug except settings is a future module with a designed empty state. */
export const CLIENT_TABS = [
  {
    slug: "discover",
    label: "Discover",
    Icon: Compass,
    phase: "P1",
    title: "Outliers land here",
    body: "Track competitors and niche creators for this client. Posts that beat their own baseline by 3x or more show up with a short note on why they worked.",
    next: "Next step: add the accounts to track. That arrives with Discover in P1.",
  },
  {
    slug: "library",
    label: "Library",
    Icon: FilmStrip,
    phase: "P2",
    title: "Raw footage, searchable by shot",
    body: "Upload the client's clips once. Each clip is split into shots you can search by what is on screen, like \"close-up of coffee pouring\".",
    next: "Uploads arrive with the Library in P2.",
  },
  {
    slug: "studio",
    label: "Studio",
    Icon: Scissors,
    phase: "P3",
    title: "Turn a proven format into a draft",
    body: "Pick a proven format and a short brief. Studio writes the script in the client's language, picks shots from the library and renders a 9:16 draft.",
    next: "Drafts arrive with Studio in P3.",
  },
  {
    slug: "review",
    label: "Review",
    Icon: ChatCircleText,
    phase: "P4",
    title: "Client approvals without logins",
    body: "Send one link per post. The client sees the post as it will look on their phone, comments on exact frames and approves a specific version.",
    next: "Review links arrive in P4.",
  },
  {
    slug: "calendar",
    label: "Calendar",
    Icon: CalendarBlank,
    phase: "P5",
    title: "Approved posts go into slots",
    body: "Weekly slots per channel in the client's local time. Approved posts drop into the next free slot and publish to Instagram, TikTok and YouTube Shorts.",
    next: "Scheduling arrives in P5.",
  },
  {
    slug: "insights",
    label: "Insights",
    Icon: ChartLineUp,
    phase: "P6",
    title: "What worked, per format",
    body: "Each published post is scored against this client's own baseline. A monthly report shows which formats and hooks won and what to make next.",
    next: "Insights arrive in P6.",
  },
] as const;

export type ClientTabSlug = (typeof CLIENT_TABS)[number]["slug"];

export const SETTINGS_TAB = { slug: "settings", label: "Settings", Icon: GearSix } as const;

export function findClientTab(slug: string) {
  return CLIENT_TABS.find((t) => t.slug === slug);
}

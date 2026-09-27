/*
 * Accent palette for staff stat cards and action tiles. Each color
 * pairs a soft icon tile with a matching solid bar, so callers pick a
 * color name instead of passing class strings that must agree.
 */
export const STAFF_COLORS = {
  primary: { tile: "bg-primary text-primary-foreground", bar: "bg-primary" },
  sky: { tile: "bg-sky-100 text-sky-700", bar: "bg-sky-500" },
  emerald: { tile: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  amber: { tile: "bg-amber-100 text-amber-800", bar: "bg-amber-500" },
  violet: { tile: "bg-violet-100 text-violet-700", bar: "bg-violet-500" },
} as const;

export type StaffColor = keyof typeof STAFF_COLORS;

import {
  Languages,
  Hash,
  Shapes,
  Palette,
  Hand,
  Calendar,
  MessageCircle,
  BookOpen,
} from "lucide-react";

export type CategoryColor =
  | "green"
  | "yellow"
  | "blue"
  | "purple"
  | "orange"
  | "red";

export const CATEGORIES: {
  title: string;
  icon: typeof Languages;
  color: CategoryColor;
  desc: string;
}[] = [
  { title: "Alphabet", icon: Languages, color: "green", desc: "" },
  { title: "Numbers", icon: Hash, color: "yellow", desc: "" },
  { title: "Shapes", icon: Shapes, color: "blue", desc: "" },
  { title: "Colors", icon: Palette, color: "purple", desc: "" },
  { title: "Greetings", icon: Hand, color: "orange", desc: "" },
  { title: "Calendar", icon: Calendar, color: "red", desc: "" },
  {
    title: "WH Questions",
    icon: MessageCircle,
    color: "green",
    desc: "Who, What, Where...",
  },
  {
    title: "Word Concepts",
    icon: BookOpen,
    color: "yellow",
    desc: "Action words, opposites...",
  },
];

export type CategoryThemeToken = {
  bg: string;
  icon: string;
  border: string;
  borderSoft: string;
  progress: string;
  progressText: string;
};

/*
 * Single source of truth for category color theming.
 *
 * `border` is a bold border for compact, whole-card-is-a-button
 * layouts (Learn/Practice). `borderSoft` is a lighter border for
 * non-interactive summary cards (My Progress).
 */
export const CATEGORY_THEME: Record<CategoryColor, CategoryThemeToken> = {
  green: {
    bg: "bg-lime-100",
    icon: "text-lime-600",
    border: "border-lime-500",
    borderSoft: "border-lime-200",
    progress: "bg-lime-500",
    progressText: "text-lime-500",
  },
  yellow: {
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
    border: "border-yellow-500",
    borderSoft: "border-yellow-200",
    progress: "bg-yellow-500",
    progressText: "text-yellow-600",
  },
  blue: {
    bg: "bg-sky-100",
    icon: "text-sky-600",
    border: "border-sky-500",
    borderSoft: "border-sky-200",
    progress: "bg-sky-500",
    progressText: "text-sky-600",
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-500",
    border: "border-purple-300",
    borderSoft: "border-purple-200",
    progress: "bg-purple-400",
    progressText: "text-purple-500",
  },
  orange: {
    bg: "bg-orange-100",
    icon: "text-orange-500",
    border: "border-orange-500",
    borderSoft: "border-orange-200",
    progress: "bg-orange-500",
    progressText: "text-orange-500",
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-500",
    border: "border-red-400",
    borderSoft: "border-red-200",
    progress: "bg-red-500",
    progressText: "text-red-500",
  },
};

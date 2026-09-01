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

export const CATEGORIES = [
  { title: "Alphabet", icon: Languages, color: "green" as const, desc: "" },
  { title: "Numbers", icon: Hash, color: "yellow" as const, desc: "" },
  { title: "Shapes", icon: Shapes, color: "blue" as const, desc: "" },
  { title: "Colors", icon: Palette, color: "purple" as const, desc: "" },
  { title: "Greetings", icon: Hand, color: "orange" as const, desc: "" },
  { title: "Calendar", icon: Calendar, color: "red" as const, desc: "" },
  {
    title: "WH Questions",
    icon: MessageCircle,
    color: "green" as const,
    desc: "Who, What, Where...",
  },
  {
    title: "Word Concepts",
    icon: BookOpen,
    color: "yellow" as const,
    desc: "Action words, opposites...",
  },
];

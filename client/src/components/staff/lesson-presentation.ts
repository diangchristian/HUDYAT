import { Sparkles } from "lucide-react";

import {
  CATEGORIES,
  CATEGORY_THEME,
} from "@/components/common/categories.constants";

/** The category's icon and color, as learners see it on the student side. */
export function lessonPresentation(name: string) {
  const category = CATEGORIES.find((item) => item.title === name);
  return {
    icon: category?.icon ?? Sparkles,
    theme: CATEGORY_THEME[category?.color ?? "blue"],
  };
}

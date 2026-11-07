/*
 * A lesson's living character standing in its own cartoon world.
 * Shared by the Learn, Practice and Assessment cards; hover motion needs a
 * `.group` ancestor. `asleep` → night-time world with a sleeping character.
 */
import type { CategoryColor } from "@/components/common/categories.constants";
import { cn } from "@/lib/utils";

import { LessonCharacter, PALETTE } from "./characters";
import { WorldStage } from "./worlds";
import "./learn-card.css";

type LessonStageProps = {
  title: string;
  color: CategoryColor;
  asleep?: boolean;
  className?: string;
};

export default function LessonStage({ title, color, asleep = false, className }: LessonStageProps) {
  return (
    <div className={cn("relative flex h-44 items-end justify-center overflow-hidden", className)}>
      <WorldStage title={title} p={PALETTE[color]} locked={asleep} />
      <span className="lc-shadow absolute bottom-3 h-3 w-20 rounded-[50%] bg-black/20" />
      <LessonCharacter title={title} color={color} asleep={asleep} className="relative mb-4 size-28" />
    </div>
  );
}

/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE — throwaway. Learn-card variants on /student/learn, switchable
 * via `?variant=duo-card|duo-card-spot|duo-card-sky|duo-card-pattern`.
 * Real data from LearnPage; only the card rendering swaps.
 */
import type { CategoryColor, CategoryStatus } from "@/components/common/category-card";
import { STAGE_CARDS, STAGE_VARIANTS, StageCardStyles } from "./duo-card-stages";
import { DuoStyles } from "./duo-characters";
import { DUO_CARDS, DUO_VARIANTS } from "./duo-variants";

export const LEARN_CARD_VARIANTS = [...DUO_VARIANTS, ...STAGE_VARIANTS];

export type LearnCardProps = {
  title: string;
  color: CategoryColor;
  progress: number;
  status: CategoryStatus;
  statusText: string;
  onClick: () => void;
};

export function LearnCardStyles() {
  return (
    <>
      <DuoStyles />
      <StageCardStyles />
    </>
  );
}

export const LEARN_CARDS: Record<string, { Card: (props: LearnCardProps) => React.ReactNode; grid: string }> = {
  ...DUO_CARDS,
  ...STAGE_CARDS,
};

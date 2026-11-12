import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Built-in pictures a learner can put behind themselves on the camera (public/backgrounds). Keep them text-free: the preview is mirrored. */
export const CAMERA_BACKGROUNDS = [
  { id: "classroom", label: "Classroom", src: "backgrounds/classroom.svg" },
  { id: "sky", label: "Sky", src: "backgrounds/sky.svg" },
  { id: "garden", label: "Garden", src: "backgrounds/garden.svg" },
  { id: "soft-gold", label: "Gold", src: "backgrounds/soft-gold.svg" },
] as const;

export type CameraBackground = "off" | "blur" | (typeof CAMERA_BACKGROUNDS)[number]["id"];

const isKnown = (value: unknown): value is CameraBackground =>
  value === "off" || value === "blur" || CAMERA_BACKGROUNDS.some((b) => b.id === value);

type State = { choice: CameraBackground; choose: (choice: CameraBackground) => void };

/** What the learner sees behind them on the camera; saved on this device. Display only — detection reads the raw camera. */
export const useCameraBackground = create<State>()(
  persist(
    (set) => ({ choice: "off", choose: (choice) => set({ choice }) }),
    {
      name: "hudyat-camera-background",
      partialize: (state) => ({ choice: state.choice }) as State,
      // A removed or renamed picture falls back to off instead of a broken image.
      merge: (saved, current) => {
        const choice = (saved as Partial<State> | undefined)?.choice;
        return { ...current, choice: isKnown(choice) ? choice : "off" };
      },
    },
  ),
);

import { create } from "zustand";

/**
 * Remembers that the learner turned the camera on, so the next practice screen
 * restarts it without another click. The stream itself is still released when a
 * screen closes; only the intent survives navigation. An explicit STOP clears it.
 */
export const useCameraPreference = create<{ wanted: boolean; want: () => void; decline: () => void }>((set) => ({
  wanted: false,
  want: () => set({ wanted: true }),
  decline: () => set({ wanted: false }),
}));

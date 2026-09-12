/**
 * True when the app is currently running in its installed/standalone
 * context (added to home screen), as opposed to a regular browser tab.
 */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;

  const isNavigatorStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    isNavigatorStandalone
  );
}

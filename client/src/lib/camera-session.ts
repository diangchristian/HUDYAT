/** Owns the stream, including requests that resolve after a page is closed. */
export function createCameraSession() {
  let activeStream: MediaStream | null = null;
  let requestVersion = 0;

  const stop = () => {
    requestVersion += 1;
    activeStream?.getTracks().forEach((track) => track.stop());
    activeStream = null;
  };

  const start = async (getStream: () => Promise<MediaStream>) => {
    stop();
    const version = requestVersion;
    try {
      const stream = await getStream();
      if (version !== requestVersion) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      activeStream = stream;
      return stream;
    } catch (error) {
      if (version !== requestVersion) return null;
      throw error;
    }
  };

  return { start, stop };
}

const CAMERA_GRANTED_KEY = "hudyat.cameraGranted";

export function rememberCameraGrant() {
  localStorage.setItem(CAMERA_GRANTED_KEY, "1");
}

export function forgetCameraGrant() {
  localStorage.removeItem(CAMERA_GRANTED_KEY);
}

/** True when the camera can start without a click. The browser keeps the real grant; this never bypasses it. */
export async function cameraGrantRemembered() {
  if (localStorage.getItem(CAMERA_GRANTED_KEY) !== "1") return false;
  try {
    const { state } = await navigator.permissions.query({ name: "camera" as PermissionName });
    if (state === "granted") return true;
    forgetCameraGrant();
    return false;
  } catch {
    // Some browsers can't query the camera; a failed start clears the flag, so this can't re-prompt in a loop.
    return true;
  }
}

export function cameraErrorMessage(error: unknown) {
  const name = typeof error === "object" && error !== null && "name" in error
    ? error.name
    : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera access was blocked. Allow camera access in your browser's site settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found. Connect a camera, then try again.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera couldn't start. Close other apps using it, then try again.";
    case "SecurityError":
      return "Your browser has disabled camera access for this page. Check its camera settings.";
    case "OverconstrainedError":
      return "This camera doesn't support the requested settings. Try another camera.";
    default:
      return "The camera couldn't start. Check the connection and browser permissions, then try again.";
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import { cameraErrorMessage, createCameraSession } from "@/lib/camera-session";

type CameraStatus = "idle" | "requesting" | "live" | "error";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attemptRef = useRef(0);
  const pendingRef = useRef(false);
  const [session] = useState(createCameraSession);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState("");

  const release = useCallback(() => {
    attemptRef.current += 1;
    pendingRef.current = false;
    session.stop();
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [session]);

  const stop = useCallback(() => {
    release();
    setStatus("idle");
    setError("");
  }, [release]);

  useEffect(() => {
    // Stop on browser history/page exit as well as React route changes.
    window.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      release();
    };
  }, [release, stop]);

  const start = async () => {
    if (pendingRef.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera access needs a supported browser on HTTPS or localhost.");
      setStatus("error");
      return;
    }

    const attempt = ++attemptRef.current;
    pendingRef.current = true;
    setStatus("requesting");
    setError("");

    try {
      const stream = await session.start(() => navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      }));
      if (!stream || attempt !== attemptRef.current) return;

      const video = videoRef.current;
      if (!video) {
        release();
        return;
      }
      const tracks = stream.getVideoTracks();
      if (!tracks.length || tracks.every((track) => track.readyState === "ended")) {
        throw new Error("No live video track");
      }
      tracks.forEach((track) => {
        track.addEventListener("ended", () => {
          if (attempt !== attemptRef.current) return;
          release();
          setStatus("error");
          setError("The camera disconnected or access was revoked. Reconnect it and try again.");
        }, { once: true });
      });

      video.srcObject = stream;
      await video.play();
      if (attempt === attemptRef.current) setStatus("live");
    } catch (cause) {
      if (attempt !== attemptRef.current) return;
      session.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
      setError(cameraErrorMessage(cause));
      setStatus("error");
    } finally {
      if (attempt === attemptRef.current) pendingRef.current = false;
    }
  };

  return { videoRef, status, error, start, stop };
}

import { Camera, CameraOff, LoaderCircle } from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { useCamera } from "@/hooks/use-camera";

export default function PracticeCamera() {
  const { videoRef, status, error, start, stop } = useCamera();
  const isLive = status === "live";

  return (
    <div>
      <Card className="relative overflow-hidden border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3">
        <div className="relative aspect-video min-h-60 w-full overflow-hidden rounded-lg bg-muted sm:min-h-56">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Live mirrored camera preview"
            className={`h-full w-full -scale-x-100 object-contain ${isLive ? "" : "invisible"}`}
          />

          {!isLive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center sm:p-6">
              {status === "requesting"
                ? <LoaderCircle aria-hidden="true" className="size-8 shrink-0 animate-spin text-hudyat-gold motion-reduce:animate-none" />
                : <Camera aria-hidden="true" className="size-9 shrink-0 text-muted-foreground" />}
              <div role={error ? "alert" : "status"}>
                <p className="text-base font-extrabold">
                  {status === "requesting" ? "Waiting for camera permission…" : error ? "Camera unavailable" : "Ready to practice?"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">
                  {error || (status === "requesting"
                    ? "Choose Allow in your browser's camera prompt."
                    : "Turn on your camera to see yourself signing.")}
                </p>
              </div>
              {status === "requesting" ? (
                <ElevatedButton text="CANCEL" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" onClick={stop} />
              ) : (
                <ElevatedButton text={error ? "TRY AGAIN" : "START CAMERA"} icon={Camera} size="sm" className="min-h-11 sm:min-h-8" onClick={() => { void start(); }} />
              )}
            </div>
          )}

          {isLive && (
            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
              <span role="status" className="rounded-full bg-background/95 px-3 py-1 text-xs font-bold text-foreground">
                <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-green-500" />
                Camera on · Mirrored
              </span>
              <ElevatedButton text="STOP" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" icon={CameraOff} onClick={stop} />
            </div>
          )}
        </div>
      </Card>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Video stays in this browser. Nothing is recorded or uploaded.
      </p>
    </div>
  );
}

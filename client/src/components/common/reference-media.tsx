import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type ReferenceMediaProps = {
  videoUrl?: string | null;
  imageUrl?: string | null;
  label: string;
  className?: string;
};

export default function ReferenceMedia({
  videoUrl,
  imageUrl,
  label,
  className,
}: ReferenceMediaProps) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState({ videoUrl, imageUrl });

  if (
    trackedSrc.videoUrl !== videoUrl ||
    trackedSrc.imageUrl !== imageUrl
  ) {
    setTrackedSrc({ videoUrl, imageUrl });
    setMediaFailed(false);
  }

  const hasMedia = Boolean(videoUrl || imageUrl);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      {!mediaFailed && videoUrl ? (
        <video
          key={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full rounded-lg object-contain"
          aria-label={`Reference video for ${label}`}
          onError={() => setMediaFailed(true)}
        >
          <source src={videoUrl} />
        </video>
      ) : !mediaFailed && imageUrl ? (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={`Reference hand position for ${label}`}
          className="h-full w-full rounded-lg object-contain"
          onError={() => setMediaFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <ImageOff
            aria-hidden="true"
            className="mb-3 size-8 text-muted-foreground/60"
          />

          <p className="text-sm font-bold">
            {hasMedia
              ? "Reference couldn't load"
              : "Sign reference coming soon"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {hasMedia
              ? "Please try again later."
              : "An image or video will appear here when added."}
          </p>
        </div>
      )}
    </div>
  );
}

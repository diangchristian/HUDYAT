import { useState } from "react";
import { ImageOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PracticePrompt } from "@/lib/practice";

export default function PracticeReference({
  prompt,
}: {
  prompt: PracticePrompt;
}) {
  const [mediaFailed, setMediaFailed] = useState(false);

  const hasMedia = Boolean(
    prompt.referenceVideoUrl || prompt.referenceImageUrl,
  );

  return (
    <Card
      className="relative overflow-hidden border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3"
      aria-label={`Sign reference for ${prompt.label}`}
    >
      <div className="relative aspect-video min-h-60 w-full overflow-hidden rounded-lg bg-muted sm:min-h-56">
        {!mediaFailed && prompt.referenceVideoUrl ? (
          <video
            controls
            playsInline
            preload="metadata"
            className="h-full w-full rounded-lg object-contain"
            aria-label={`Reference video for ${prompt.label}`}
            onError={() => setMediaFailed(true)}
          >
            <source src={prompt.referenceVideoUrl} />
          </video>
        ) : !mediaFailed && prompt.referenceImageUrl ? (
          <img
            src={prompt.referenceImageUrl}
            alt={`Reference hand position for ${prompt.label}`}
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
    </Card>
  );
}
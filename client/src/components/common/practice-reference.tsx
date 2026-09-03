import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PracticePrompt } from "@/lib/practice";

export default function PracticeReference({ prompt }: { prompt: PracticePrompt }) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const hasMedia = Boolean(prompt.referenceVideoUrl || prompt.referenceImageUrl);

  return (
    <Card className="flex min-h-44 items-center justify-center overflow-hidden p-4" aria-label={`Sign reference for ${prompt.label}`}>
      {!mediaFailed && prompt.referenceVideoUrl ? (
        <video controls playsInline preload="metadata" className="max-h-60 w-full rounded-lg" aria-label={`Reference video for ${prompt.label}`} onError={() => setMediaFailed(true)}>
          <source src={prompt.referenceVideoUrl} />
        </video>
      ) : !mediaFailed && prompt.referenceImageUrl ? (
        <img src={prompt.referenceImageUrl} alt={`Reference hand position for ${prompt.label}`} className="max-h-60 w-full object-contain" onError={() => setMediaFailed(true)} />
      ) : (
        <div className="text-center">
          <ImageOff aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground/60" />
          <p className="text-sm font-bold">{hasMedia ? "Reference couldn't load" : "Sign reference coming soon"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasMedia ? "Please try again later." : "An image or video will appear here when added."}
          </p>
        </div>
      )}
    </Card>
  );
}

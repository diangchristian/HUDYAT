import { Card } from "@/components/ui/card";
import type { PracticePrompt } from "@/lib/practice";

import ReferenceMedia from "./reference-media";

export default function PracticeReference({
  prompt,
}: {
  prompt: PracticePrompt;
}) {
  return (
    <Card
      className="relative overflow-hidden border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3"
      aria-label={`Sign reference for ${prompt.label}`}
    >
      <ReferenceMedia
        videoUrl={prompt.referenceVideoUrl}
        imageUrl={prompt.referenceImageUrl}
        label={prompt.label}
        className="min-h-60 sm:min-h-56"
      />
    </Card>
  );
}

/*
 * A lesson picture: an emoji drawn as Twemoji art (so a teacher on Windows and a child on an Android
 * tablet see the same drawing), or a teacher's uploaded image. Decorative: the word sits beside it.
 * The SVGs come from jsDelivr and the service worker keeps them for offline use (vite.config.ts).
 * Twemoji art is CC-BY 4.0; the credit is on the student Settings page and in the picture picker.
 */
import { useState } from "react";

import { isImagePicture } from "@/lib/lesson-text";
import { cn } from "@/lib/utils";

const TWEMOJI_SVG = "https://cdn.jsdelivr.net/npm/@twemoji/svg@15.0.0/";

// Twemoji's file name: the code points in hex joined by "-", dropping U+FE0F unless there's a ZWJ.
const twemojiUrl = (emoji: string) => {
  const points = [...emoji].map((char) => char.codePointAt(0)!.toString(16));
  const kept = points.includes("200d") ? points : points.filter((point) => point !== "fe0f");
  return `${TWEMOJI_SVG}${kept.join("-")}.svg`;
};

// Pictures are small, so ask Cloudinary for a padded square thumbnail instead of the full upload.
const thumbnail = (url: string) => url.replace("/image/upload/", "/image/upload/c_pad,w_192,h_192,b_white/");

function Emoji({ emoji, className }: { emoji: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  // An emoji Twemoji doesn't have: fall back to the device's own drawing.
  if (failed) return <span className={cn("inline-flex items-center justify-center leading-none", className)}>{emoji}</span>;
  // CORS mode, so the service worker caches a readable 200 and never an opaque (possibly failed) response.
  return <img src={twemojiUrl(emoji)} alt="" crossOrigin="anonymous" draggable={false} onError={() => setFailed(true)} className={cn("object-contain", className)} />;
}

export default function LessonPicture({ picture, className }: { picture: string; className?: string }) {
  if (isImagePicture(picture)) {
    return <img src={thumbnail(picture)} alt="" loading="lazy" className={cn("rounded-lg bg-white object-contain", className)} />;
  }
  // Several emoji in a row ("🍎🍎🍎") draw one picture each.
  const emoji = [...new Intl.Segmenter().segment(picture)].map((part) => part.segment);
  // Keyed, so a failed emoji's fallback doesn't stick when the picture changes.
  if (emoji.length === 1) return <Emoji key={picture} emoji={picture} className={className} />;
  return (
    <span aria-hidden="true" className="inline-flex max-w-48 flex-wrap items-center justify-center">
      {emoji.map((one, i) => <Emoji key={i} emoji={one} className={className} />)}
    </span>
  );
}

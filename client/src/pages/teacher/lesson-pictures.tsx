/*
 * Pictures for young readers, inside the lesson editor's Meaning and When to use boxes: the text as
 * learners see it, where tapping a key word picks its picture (an emoji, or an uploaded image).
 * Pictures belong to a word, not a position, so editing the text keeps them and every "morning" in it
 * shares one. Pictures whose word was edited out are listed here and dropped on save (usedPictures).
 */
import { useEffect, useRef, useState } from "react";
import { Eye, ImagePlus, Plus, Trash2, X } from "lucide-react";

import LessonPicture from "@/components/common/lesson-picture";
import ProgressBar from "@/components/staff/progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploadLessonMedia } from "@/hooks/use-upload-lesson-media";
import { isEmoji, pictureKey, readingParts, signMeaningText, signWhenToUseText, usedPictures, type Pictures } from "@/lib/lesson-text";
import { cn } from "@/lib/utils";

// Small words rarely need a picture: they get no + (still tappable), so the + marks the key words.
const SMALL_WORDS = new Set(
  "a an the and or but so if as in on at to of for from with by into is are was were be been am do does did will can i me my you your he him his she her it its we us our they them their this that these those there here when what who how where why not".split(" "),
);

// shortcut: a hand-written word list; move to emoji keyword data (e.g. emojibase) if teachers want more.
const SUGGEST: Record<string, string> = {
  morning: "🌅 ☀️", afternoon: "🌤️ ☀️", evening: "🌙 🌆", night: "🌙 🌃", day: "☀️ 📅", today: "📅", tomorrow: "📅 ➡️", yesterday: "📅 ⬅️",
  greet: "👋 🤝", greeting: "👋 🤝", hello: "👋", hi: "👋", bye: "👋", goodbye: "👋", meet: "🤝", welcome: "🤗 👐",
  someone: "🧑", person: "🧑", people: "🧑‍🤝‍🧑", friend: "🧑‍🤝‍🧑", new: "✨",
  mom: "👩", mother: "👩", dad: "👨", father: "👨", parent: "👫", family: "👨‍👩‍👧", boy: "👦", son: "👦", girl: "👧", daughter: "👧",
  child: "🧒", baby: "👶", lola: "👵", grandmother: "👵", lolo: "👴", grandfather: "👴", tito: "🧔", uncle: "🧔", tita: "👩‍🦰", auntie: "👩‍🦰", cousin: "🧒", pinsan: "🧒",
  thank: "🙏", please: "🙏", help: "🤲", give: "🎁", gift: "🎁", happy: "😊", glad: "😊", sad: "😢", angry: "😠",
  fine: "👌 🙂", okay: "👌 🙂", ok: "👌", ask: "❓", question: "❓", know: "🤔", think: "🤔", nice: "😊 👍",
  eat: "🍽️", food: "🍽️", drink: "🥤", school: "🏫", home: "🏠", house: "🏠", visit: "🏠 🚶", go: "🚶", come: "🚶",
  see: "👀", look: "👀", watch: "👀", read: "📖", write: "✏️", sign: "🤟", talk: "💬", say: "💬", love: "❤️",
  letter: "🔤", alphabet: "🔤", number: "🔢", color: "🎨", shape: "🔷",
  red: "🟥", blue: "🟦", yellow: "🟨", green: "🟩", black: "⬛", white: "⬜", orange: "🟧", purple: "🟪", pink: "🌸", brown: "🟫",
  circle: "🔵", square: "🟦", triangle: "🔺", star: "⭐", heart: "❤️", diamond: "🔷", oval: "🥚",
};
const suggestFor = (key: string) =>
  key.split(" ").flatMap((word) => (SUGGEST[word] ?? SUGGEST[word.replace(/(ing|ed|es|s)$/, "")] ?? "").split(" ").filter(Boolean));

const EMOJI_GROUPS = [
  { name: "People", emoji: "👩 👨 👧 👦 👵 👴 🧒 🧑 👶 👫 👨‍👩‍👧 🧑‍🏫 🧑‍🤝‍🧑" },
  { name: "Feelings", emoji: "😊 🙂 😢 😠 😮 🤔 😴 🥰" },
  { name: "Actions", emoji: "👋 🤝 🙏 👏 👀 👂 🤲 ✋ 👆 🏃 🍽️ 📖 ✏️ 🎁" },
  { name: "Time", emoji: "🌅 ☀️ 🌤️ 🌙 🕒 📅 🍱" },
  { name: "Places", emoji: "🏠 🏫 ⛪ 🏥 🏪 🌳 🏖️" },
  { name: "Things", emoji: "🍎 🍌 ⚽ 📚 🪑 🚪 🪟 💧 🌸 🍫" },
  { name: "Colors and shapes", emoji: "🟥 🟦 🟨 🟩 ⬛ ⬜ 🔵 🔺 ⭐ ❤️" },
  { name: "Other", emoji: "❓ ✅ ❌ ➕ 💭 ✨" },
];

// Matches the Cloudinary Free plan, like the sign media dropzone.
const MAX_IMAGE_MB = 10;

// pictureKey never starts with a space, so this can't clash with a word.
const MAIN = " main";

const unique = (list: string[]) => [...new Set(list)];

function PickRow({ title, pictures, onPick }: { title: string; pictures: string[]; onPick: (picture: string) => void }) {
  if (!pictures.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-0.5">
        {pictures.map((picture) => (
          <button
            key={picture}
            type="button"
            aria-label={`Use ${picture.startsWith("https://") ? "this uploaded picture" : picture}`}
            onClick={() => onPick(picture)}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <LessonPicture picture={picture} className="size-7" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ImageUpload({ onPick }: { onPick: (url: string) => void }) {
  const [progress, setProgress] = useState(0);
  const [rejection, setRejection] = useState("");
  // Shares the media upload key, so Save waits for it.
  const upload = useUploadLessonMedia(setProgress);
  const error = rejection || upload.error?.message;

  return (
    <div className="space-y-2">
      <label className={cn("flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary focus-within:ring-3 focus-within:ring-ring/50", upload.isPending && "cursor-wait opacity-70")}>
        <ImagePlus aria-hidden="true" className="size-8 text-primary" />
        <span className="font-bold">{upload.isPending ? "Uploading..." : "Choose a picture"}</span>
        <span className="text-xs text-muted-foreground">JPG, PNG or WebP up to {MAX_IMAGE_MB} MB. A square picture on a plain background looks best.</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={upload.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // so choosing the same file again still uploads
            if (!file) return;
            if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_MB * 1024 * 1024) {
              setRejection(`Choose a JPG, PNG or WebP image up to ${MAX_IMAGE_MB} MB.`);
              return;
            }
            setRejection("");
            setProgress(0);
            upload.mutate(file, { onSuccess: ({ url }) => onPick(url) });
          }}
        />
      </label>
      {upload.isPending && <ProgressBar value={progress} max={100} label="Uploading the picture" />}
      {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
      <p className="text-xs text-muted-foreground">Only use pictures you're allowed to share, such as free pictogram sets made for schools.</p>
    </div>
  );
}

/** Stays open after a pick, so the next word is one tap away. Esc or ✕ closes it. */
function PicturePicker({ title, current, suggested, recent, onPick, onRemove, onClose }: { title: string; current?: string; suggested: string[]; recent: string[]; onPick: (picture: string) => void; onRemove: () => void; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const heading = useRef<HTMLParagraphElement>(null);
  // Bring the picker into view, and keyboard focus with it, whenever it opens for another word.
  useEffect(() => heading.current?.focus(), [title]);
  const pasted = typed.trim();
  const pickPasted = () => isEmoji(pasted) && onPick(pasted);

  return (
    <div
      role="group"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        onClose();
      }}
      className="rounded-xl border border-border bg-white p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p ref={heading} tabIndex={-1} className="flex min-w-0 items-center gap-2 font-bold outline-none [overflow-wrap:anywhere]">
          {current && <LessonPicture picture={current} className="size-8" />}
          {title}
        </p>
        <div className="flex shrink-0 gap-1">
          {current && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 aria-hidden="true" /> Remove
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="emoji">
        <TabsList>
          <TabsTrigger value="emoji">Emoji</TabsTrigger>
          <TabsTrigger value="image">Upload image</TabsTrigger>
        </TabsList>
        <TabsContent value="emoji" className="space-y-3">
          {(suggested.length > 0 || recent.length > 0) && (
            <div className="space-y-2 rounded-lg bg-accent/50 p-2">
              <PickRow title="Suggested" pictures={suggested} onPick={onPick} />
              <PickRow title="Used in this lesson" pictures={recent} onPick={onPick} />
            </div>
          )}
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {EMOJI_GROUPS.map((group) => (
              <PickRow key={group.name} title={group.name} pictures={group.emoji.split(" ")} onPick={onPick} />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              // Enter would otherwise submit the lesson form around this.
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                pickPasted();
              }}
              placeholder="Or paste any emoji (Windows: Win + .)"
              aria-label="Any emoji"
              aria-invalid={pasted !== "" && !isEmoji(pasted)}
              className="h-9"
            />
            <Button type="button" size="sm" className="h-9" disabled={!isEmoji(pasted)} onClick={pickPasted}>
              Use
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Emoji art by{" "}
            <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer" className="underline">Twemoji</a>, CC-BY 4.0.
          </p>
        </TabsContent>
        <TabsContent value="image">
          <ImageUpload onPick={onPick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const FRAME = {
  meaning: { card: "border-[#FBBF24] bg-white", text: "" },
  usage: { card: "border-[#0284C7] bg-[#E0F2FE]", text: "rounded-xl bg-white p-2.5" },
};

/** Goes inside the Meaning or When to use box, under the text. Only Meaning has a main picture. */
export default function LessonPictures({
  field,
  text,
  label,
  pictures,
  onChange,
  otherPictures,
  recent,
  mainPicture,
  onMainPictureChange,
}: {
  field: "meaning" | "usage";
  text: string;
  label: string;
  pictures: Pictures;
  onChange: (pictures: Pictures) => void;
  /** The same sign's other text: a word pictured there is suggested here first. */
  otherPictures: Pictures;
  /** Every picture in this lesson, for reuse. */
  recent: string[];
  mainPicture?: string;
  onMainPictureChange?: (picture: string) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const parts = text.trim() ? readingParts(text, label) : [];
  // The same rule the save uses, so "not saved" here always matches what gets dropped.
  const kept = usedPictures(text, label, pictures);
  const unused = Object.entries(pictures).filter(([key]) => !(key in kept));

  const open = (key: string, button: HTMLElement) => {
    opener.current = button;
    setTarget(key);
  };
  // Back to the word that opened the picker, so keyboard users keep their place.
  const close = () => {
    setTarget(null);
    opener.current?.focus();
  };
  const setPicture = (key: string, picture?: string) => {
    if (key === MAIN) return onMainPictureChange?.(picture ?? "");
    const next = { ...pictures };
    if (picture) next[key] = picture;
    else delete next[key];
    onChange(next);
  };

  const isMain = target === MAIN;
  const current = target && (isMain ? mainPicture : pictures[target]);
  const suggested = target ? unique([...(!isMain && otherPictures[target] ? [otherPictures[target]] : []), ...suggestFor(isMain ? pictureKey(label) : target)]) : [];

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border bg-white/70 p-2.5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <Eye aria-hidden="true" className="size-4" />
        Learners see · tap a key word to add a picture
      </p>
      <div className={cn("flex flex-col gap-3 rounded-2xl border-4 p-3 sm:flex-row sm:items-center", FRAME[field].card)}>
        {onMainPictureChange && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onClick={(e) => open(MAIN, e.currentTarget)}
              aria-label={mainPicture ? "Change the main picture" : "Add a main picture"}
              aria-expanded={isMain}
              className={cn("flex size-24 items-center justify-center rounded-2xl border-2 border-dashed border-[#D9C9A3] bg-white hover:bg-[#FFF1CC] focus-visible:ring-3 focus-visible:ring-primary focus-visible:outline-none", isMain && "ring-3 ring-primary")}
            >
              {mainPicture ? <LessonPicture picture={mainPicture} className="size-20" /> : <ImagePlus aria-hidden="true" className="size-7 text-[#B87800]" />}
            </button>
            <span className="text-center text-[11px] leading-tight font-bold text-[#6B5F4A]">Main picture</span>
          </div>
        )}
        <div className={cn("min-w-0 flex-1", FRAME[field].text)}>
          {parts.length ? (
            // The learner's lesson look (student font and colours), not staff UI.
            <div className="flex flex-wrap items-end gap-x-1 gap-y-2 font-body text-xl font-bold text-[#3C3C3C]">
              {parts.map((part, i) => {
                const key = pictureKey(part.text);
                if (part.kind === "space") return null;
                // Punctuation left after a sign's name ("Good morning!") sits against it.
                if (!key) return <span key={i} className="-ml-1 pb-1">{part.text}</span>;
                const picture = pictures[key];
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={picture ? `Change the picture for ${part.text}` : `Add a picture for ${part.text}`}
                    aria-expanded={target === key}
                    onClick={(e) => open(key, e.currentTarget)}
                    className={cn(
                      "group flex min-h-11 cursor-pointer flex-col items-center justify-end rounded-xl px-1.5 pt-1 pb-0.5 hover:bg-[#FFF1CC] focus-visible:ring-3 focus-visible:ring-primary focus-visible:outline-none",
                      picture && "border-2 border-hudyat-gold/40 bg-[#FFF8E7]",
                      part.kind === "sign" && "uppercase",
                      target === key && "bg-[#FFF1CC] ring-3 ring-primary",
                    )}
                  >
                    {picture ? (
                      <LessonPicture picture={picture} className="size-10" />
                    ) : (
                      !SMALL_WORDS.has(key) && (
                        // A faint + marks a key word; it gets strong on hover or keyboard focus.
                        <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full border-2 border-dashed border-[#D9C9A3] text-[#B87800] opacity-50 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                          <Plus className="size-3.5" strokeWidth={3} />
                        </span>
                      )
                    )}
                    <span className={cn(picture && "font-black")}>{part.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <p className="font-body text-lg font-bold text-[#3C3C3C]/45">{field === "meaning" ? signMeaningText(label) : signWhenToUseText(label)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Learners see this placeholder. Write the text above to add pictures.</p>
            </>
          )}
        </div>
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
          <span className="font-bold">No longer in the text, so not saved:</span>
          {unused.map(([key, picture]) => (
            <span key={key} className="inline-flex items-center gap-1 rounded-full bg-white py-0.5 pr-0.5 pl-1.5 ring-1 ring-amber-200">
              <LessonPicture picture={picture} className="size-5" />
              {key}
              <button type="button" aria-label={`Remove the picture for ${key}`} onClick={() => setPicture(key)} className="flex size-7 items-center justify-center rounded-full hover:bg-amber-100">
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {target && (
        <PicturePicker
          title={isMain ? "Main picture" : `Picture for "${target}"`}
          current={current || undefined}
          suggested={suggested}
          recent={recent}
          onPick={(picture) => setPicture(target, picture)}
          onRemove={() => setPicture(target)}
          onClose={close}
        />
      )}
    </div>
  );
}

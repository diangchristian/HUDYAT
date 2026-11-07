/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: how should "When to Use" teach WHEN, not just show a sentence?
 * Three versions of the card on the real lesson page, switchable via ?variant= (dev only):
 *   when-chat   · situation picture + "when" line, then the example as a 2-person chat
 *   when-split  · picture beside a big "when" line + the example as a quote (no chat)
 *   when-reveal · picture first with "When?"; tap it to reveal the line, then the chat
 * All three also fill missing sign photos with a still frame taken from the sign's video.
 *
 * Stand-in data: situation lines, scenes and chats below are written for Greetings and Family
 * only (not saved anywhere). Other lessons fall back to the lesson world + the example sentence.
 */
import { useState } from "react";
import { Hand } from "lucide-react";

import type { CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import { signWhenToUseText } from "@/lib/lesson-text";
import { cn } from "@/lib/utils";

import type { LessonPrompt } from "./learn-session";

export const WHEN_VARIANTS = [
  { key: "when-chat", name: "When to Use · picture + chat" },
  { key: "when-split", name: "When to Use · picture + quote" },
  { key: "when-reveal", name: "When to Use · tap to reveal" },
];
export type WhenVariant = "when-chat" | "when-split" | "when-reveal";
export const isWhenVariant = (v: string | null): v is WhenVariant => WHEN_VARIANTS.some((item) => item.key === v);

// Cloudinary serves a still frame of a video at /so_<seconds>/ with an image extension.
export const videoFrameUrl = (videoUrl?: string | null) =>
  videoUrl?.includes("/video/upload/") ? videoUrl.replace("/video/upload/", "/video/upload/so_1/").replace(/\.\w+$/, ".jpg") : undefined;

type Time = "morning" | "afternoon" | "evening";
type Place = "school" | "home" | "outside";
type Situation = { when: string; time: Time; place: Place; chat: [string, string?] };

const SITUATIONS: Record<string, Situation> = {
  "Good Morning": { when: "In the morning, when you meet someone.", time: "morning", place: "school", chat: ["Good morning!", "Good morning! How are you?"] },
  "Good Afternoon": { when: "After lunch, when you meet someone.", time: "afternoon", place: "school", chat: ["Good afternoon!", "Good afternoon! How was your day?"] },
  "Good Evening": { when: "At night, when you meet or visit someone.", time: "evening", place: "home", chat: ["Good evening!", "Good evening! Welcome."] },
  Hello: { when: "Any time you meet someone.", time: "afternoon", place: "outside", chat: ["Hello!", "Hello! Nice to meet you."] },
  "How are you": { when: "When you want to know if someone is okay.", time: "morning", place: "school", chat: ["Hello! How are you?", "I'm fine, thank you."] },
  "I'm fine": { when: "When someone asks how you are.", time: "morning", place: "school", chat: ["How are you?", "I'm fine, thank you."] },
  "Nice to meet you": { when: "When you meet someone for the first time.", time: "afternoon", place: "outside", chat: ["Hi! I'm Ana.", "Nice to meet you, Ana!"] },
  "Thank you": { when: "When someone helps you or gives you something.", time: "afternoon", place: "school", chat: ["Here is your pencil.", "Thank you!"] },
  "You're welcome": { when: "After someone says thank you to you.", time: "afternoon", place: "school", chat: ["Thank you!", "You're welcome."] },
  "See you tomorrow": { when: "When you go home and will see them the next day.", time: "evening", place: "school", chat: ["Goodbye!", "See you tomorrow!"] },
  Father: { when: "When you talk about your dad.", time: "morning", place: "home", chat: ["My father cooks breakfast every morning."] },
  Mother: { when: "When you talk about your mom.", time: "morning", place: "home", chat: ["My mother walks me to school."] },
  Son: { when: "When you talk about a boy in a family.", time: "afternoon", place: "outside", chat: ["Their son plays basketball."] },
  Daughter: { when: "When you talk about a girl in a family.", time: "morning", place: "school", chat: ["Their daughter is in Grade 3."] },
  Grandfather: { when: "When you talk about your lolo.", time: "evening", place: "home", chat: ["My grandfather tells us stories."] },
  Grandmother: { when: "When you talk about your lola.", time: "afternoon", place: "home", chat: ["My grandmother lives with us."] },
  Uncle: { when: "When you talk about your tito.", time: "afternoon", place: "home", chat: ["My uncle visits us every Sunday."] },
  Auntie: { when: "When you talk about your tita.", time: "afternoon", place: "home", chat: ["My auntie gave me a gift."] },
  Cousin: { when: "When you talk about your pinsan.", time: "afternoon", place: "outside", chat: ["My cousin and I play together."] },
  Parents: { when: "When you talk about your mom and dad together.", time: "afternoon", place: "school", chat: ["My parents come to my school program."] },
};

const SKY: Record<Time, { bg: string; orb: string; label: string }> = {
  morning: { bg: "linear-gradient(#FFD9A0, #FFF6E6)", orb: "bg-[#FFB347] shadow-[0_0_0_8px_#FFB34733] left-[12%] top-[42%]", label: "Morning" },
  afternoon: { bg: "linear-gradient(#9EDBFF, #E8F7FF)", orb: "bg-[#FFC145] shadow-[0_0_0_8px_#FFC14533] right-[14%] top-[10%]", label: "Afternoon" },
  evening: { bg: "linear-gradient(#24306E, #4B5AA8)", orb: "shadow-[-9px_7px_0_0_#FFE58A] right-[14%] top-[12%]", label: "Evening" },
};

function Place({ place }: { place: Place }) {
  if (place === "school")
    return (
      <>
        <span className="absolute bottom-[78px] left-1/2 h-8 w-52 -translate-x-1/2 bg-[#FF6B5B]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <span className="absolute bottom-6 left-1/2 flex h-14 w-48 -translate-x-1/2 justify-between rounded-t-sm bg-[#FFE7C2] px-3 pt-2">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className="size-4 rounded-sm border-2 border-white bg-[#8ED8FF]" />)}
        </span>
      </>
    );
  if (place === "home")
    return (
      <>
        <span className="absolute bottom-[70px] left-1/2 h-10 w-44 -translate-x-1/2 bg-[#C2410C]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <span className="absolute bottom-6 left-1/2 h-12 w-36 -translate-x-1/2 rounded-sm bg-[#FFF1D6]">
          <span className="absolute top-2 left-3 size-5 rounded-sm bg-[#FDE68A]" />
          <span className="absolute top-2 right-3 size-5 rounded-sm bg-[#FDE68A]" />
        </span>
      </>
    );
  return (
    <>
      {[12, 80].map((x) => (
        <span key={x} className="absolute bottom-6 flex flex-col items-center" style={{ left: `${x}%` }}>
          <span className="size-12 rounded-full bg-[#58CC02] shadow-[inset_-5px_-5px_0_#0002]" />
          <span className="h-5 w-2 bg-[#9C5B38]" />
        </span>
      ))}
    </>
  );
}

/** The "when" picture: time of day + place + the lesson's own character acting it out. */
function SituationPicture({ title, color, situation, className }: { title: string; color: CategoryColor; situation?: Situation; className?: string }) {
  if (!situation) return <LessonStage title={title} color={color} className={cn("rounded-2xl", className)} />;
  const sky = SKY[situation.time];
  return (
    <div className={cn("relative h-44 overflow-hidden rounded-2xl", className)} style={{ background: sky.bg }}>
      <span className={cn("absolute size-10 rounded-full", sky.orb)} />
      <Place place={situation.place} />
      <svg aria-hidden="true" viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full">
        <path d="M0 22 Q60 6 120 18 T200 14 V40 H0z" fill={situation.time === "evening" ? "#3F7A2A" : "#6CC644"} />
      </svg>
      <div aria-hidden="true" className="absolute bottom-2 left-1/2 w-24 -translate-x-1/2">
        <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
      </div>
      <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-[#3C3C3C] uppercase">{sky.label}</span>
    </div>
  );
}

function Chat({ lines }: { lines: [string, string?] }) {
  const [first, second] = lines;
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white"><Hand className="size-5" /></span>
        <p className="rounded-3xl rounded-bl-md bg-white px-4 py-3 text-xl font-bold text-[#3C3C3C] shadow-[0_3px_0_#0000001a]">{first}</p>
      </div>
      {second && (
        <div className="flex flex-row-reverse items-end gap-2">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1CB0F6] text-white"><Hand className="size-5 -scale-x-100" /></span>
          <p className="rounded-3xl rounded-br-md bg-[#DDF4FF] px-4 py-3 text-xl font-bold text-[#3C3C3C] shadow-[0_3px_0_#0000001a]">{second}</p>
        </div>
      )}
    </div>
  );
}

const WhenLine = ({ text, className }: { text: string; className?: string }) => (
  <p className={cn("text-2xl leading-snug font-black text-[#0C4A6E] sm:text-3xl", className)}>{text}</p>
);

const frame = "rounded-3xl border-4 border-[#0284C7] bg-[#E0F2FE] p-3 shadow-[0_6px_0_#0000001a] sm:p-4";

export function WhenToUsePrototype({ variant, prompt, title, color }: { variant: WhenVariant; prompt: LessonPrompt; title: string; color: CategoryColor }) {
  const situation = SITUATIONS[prompt.label];
  const example = signWhenToUseText(prompt.label, prompt.whenToUse);
  const chat: [string, string?] = situation?.chat ?? [example];
  const [revealed, setRevealed] = useState(false);

  if (variant === "when-split")
    return (
      <div className={cn(frame, "grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center")}>
        <SituationPicture title={title} color={color} situation={situation} className="sm:h-56" />
        <div className="space-y-3">
          {situation && <WhenLine text={situation.when} />}
          <blockquote className="rounded-2xl border-l-8 border-[#0284C7] bg-white px-4 py-3 text-xl font-semibold text-[#3C3C3C] italic">“{situation ? chat.filter(Boolean).join(" ") : example}”</blockquote>
        </div>
      </div>
    );

  if (variant === "when-reveal")
    return (
      <div className={cn(frame, "space-y-4")}>
        <button
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed(true)}
          className="relative block w-full overflow-hidden rounded-2xl text-left focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none"
        >
          <SituationPicture title={title} color={color} situation={situation} className="h-52" />
          {!revealed && (
            <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-4 py-3 text-center text-xl font-black text-[#0284C7] shadow-[0_4px_0_#0000001a] motion-safe:animate-bounce">
              When? Tap the picture!
            </span>
          )}
        </button>
        {revealed && (
          <div className="ls-rise space-y-4">
            {situation && <WhenLine text={situation.when} />}
            <Chat lines={chat} />
          </div>
        )}
      </div>
    );

  return (
    <div className={cn(frame, "space-y-4")}>
      <div className="relative">
        <SituationPicture title={title} color={color} situation={situation} className="h-48" />
        {situation && <WhenLine text={situation.when} className="relative z-10 -mt-6 mx-2 rounded-2xl bg-white px-4 py-3 text-xl shadow-[0_4px_0_#0000001a] sm:text-2xl" />}
      </div>
      <Chat lines={chat} />
    </div>
  );
}

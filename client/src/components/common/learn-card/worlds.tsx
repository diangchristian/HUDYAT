/*
 * A cartoon world behind each lesson's character, matched to its topic.
 * Idle motion everywhere; hover speeds it up. Locked lessons keep their
 * world but dimmed into night-time, with motion frozen.
 * Motion lives in learn-card.css.
 */
import { cn } from "@/lib/utils";

import { HEART_D, type PALETTE } from "./characters";

type Pal = (typeof PALETTE)[keyof typeof PALETTE];

const Cloud = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <span
    className={cn("lc-cloud absolute h-5 w-14 rounded-full bg-white shadow-[10px_-6px_0_-2px_#fff]", className)}
    style={{ animationDelay: `${delay}s` }}
  />
);

const Ground = ({ back, front }: { back: string; front: string }) => (
  <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full">
    <path d="M0 22 Q50 2 100 18 T200 14 V40 H0z" fill={back} />
    <path d="M0 30 Q60 14 120 28 T200 26 V40 H0z" fill={front} />
  </svg>
);

// Floating glyphs (letters, numbers, ?…) that bob idly and pop on hover.
function Floaters({ items, colors, className = "text-2xl" }: { items: [string, number, number][]; colors: string[]; className?: string }) {
  return items.map(([ch, x, y], i) => (
    <span
      key={i}
      className={cn("lc-glyph absolute font-black leading-none [text-shadow:0_3px_0_#0002]", className)}
      style={{ left: `${x}%`, top: `${y}%`, color: colors[i % colors.length], animationDelay: `${-i * 0.6}s` }}
    >
      {ch}
    </span>
  ));
}

const BRIGHT = ["#FF4B4B", "#1CB0F6", "#FFC145", "#58CC02", "#CE82FF", "#FF9600"];

/* Alphabet · classroom chalkboard with letters floating off it */
function Alphabet() {
  return (
    <>
      <span className="absolute inset-0 bg-[#FFF4D6]" />
      <span className="absolute inset-x-5 top-4 h-20 rounded-xl border-[5px] border-[#C98A4B] bg-[#2F6B4F]" />
      <span className="absolute left-9 top-8 font-black text-lg leading-none text-white/80 [font-family:Nunito]">A b C</span>
      <span className="absolute right-10 top-[70px] h-1.5 w-6 rounded-full bg-white" />
      <span className="absolute inset-x-0 bottom-0 h-10 bg-[#E8B878]" />
      <span className="absolute inset-x-0 bottom-10 h-1.5 bg-[#C98A4B]" />
      <Floaters items={[["A", 10, 58], ["B", 80, 50], ["c", 22, 30], ["z", 72, 14]]} colors={BRIGHT} />
    </>
  );
}

/* Numbers · toy-block playground with counting numbers */
function Numbers() {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "linear-gradient(#C9EFFF, #F2FBFF)" }} />
      <Cloud className="left-3 top-4" />
      <Ground back="#9BE15D" front="#6CC644" />
      {[
        { n: 1, c: "#FF4B4B", x: "left-4", b: "bottom-5" },
        { n: 2, c: "#1CB0F6", x: "left-14", b: "bottom-5" },
        { n: 3, c: "#FFC145", x: "left-9", b: "bottom-[60px]" },
      ].map((b) => (
        <span
          key={b.n}
          className={cn("lc-block absolute grid size-9 place-items-center rounded-lg text-lg font-black text-white shadow-[inset_-3px_-4px_0_#0002]", b.x, b.b)}
          style={{ background: b.c, animationDelay: `${b.n * -0.4}s` }}
        >
          {b.n}
        </span>
      ))}
      <Floaters items={[["4", 76, 18], ["5", 86, 44], ["+", 66, 40]]} colors={["#CE82FF", "#FF9600", "#58CC02"]} />
    </>
  );
}

/* Greetings · morning at the school gate; student and teacher take turns saying hi */
const BUBBLES = [
  { t: "Good morning, sir!", side: "right-[54%]", tail: "right-5", c: "#58CC02", delay: "0s" },
  { t: "Good morning, student!", side: "left-[54%]", tail: "left-5", c: "#1CB0F6", delay: "2.5s" },
];

function Greetings({ locked }: { locked: boolean }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "linear-gradient(#FFD9A0, #FFF6E6 65%)" }} />
      <span className="lc-sun absolute -left-8 top-6 size-28 rounded-full opacity-60" style={{ background: "repeating-conic-gradient(#FFB34755 0 12deg, transparent 12deg 24deg)" }} />
      <span className="absolute left-3 top-[52px] size-9 rounded-full bg-[#FFB347] shadow-[0_0_0_6px_#FFB34733]" />
      <Cloud className="right-0 top-[60px]" delay={-5} />
      {/* School: roof, wall with a row of windows, a little clock */}
      <span className="absolute bottom-[86px] left-1/2 h-9 w-60 -translate-x-1/2 bg-[#FF6B5B]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      <span className="absolute bottom-[90px] left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-[#C2410C] bg-white">
        <span className="absolute left-1/2 top-0.5 h-1.5 w-0.5 -translate-x-1/2 bg-[#4B4B4B]" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-[#4B4B4B]" />
      </span>
      <span className="absolute bottom-6 left-1/2 flex h-16 w-56 -translate-x-1/2 justify-between rounded-t-sm bg-[#FFE7C2] px-3 pt-2 shadow-[inset_0_-6px_0_#0000000d]">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="size-5 rounded-sm border-2 border-white bg-[#8ED8FF]" />
        ))}
      </span>
      {/* Flagpole */}
      <span className="absolute bottom-6 right-4 h-28 w-1 rounded-full bg-[#9CA3AF]" />
      <span className="lc-flag absolute bottom-[108px] right-5 h-6 w-9 origin-right rounded-l-sm bg-[#1CB0F6] shadow-[inset_0_-12px_0_#FF4B4B]" />
      <Ground back="#9BE15D" front="#6CC644" />
      <span className="absolute bottom-0 left-1/2 h-6 w-24 -translate-x-1/2 bg-[#E8D3A8]" style={{ clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)" }} />
      {!locked &&
        BUBBLES.map((b) => (
          <span
            key={b.t}
            className={cn("lc-say absolute top-2 max-w-[44%] rounded-2xl px-2.5 py-1 text-xs font-black leading-tight text-white shadow-[0_3px_0_#0002]", b.side)}
            style={{ background: b.c, animationDelay: b.delay }}
          >
            {b.t}
            <span className={cn("absolute -bottom-1.5 size-3 rotate-45", b.tail)} style={{ background: b.c }} />
          </span>
        ))}
    </>
  );
}

/* Family · a cosy house with a smoking chimney, a tree and hearts in the air */
const FAMILY_HEARTS: [left: string, top: string, size: number, color: string][] = [
  ["30%", "14%", 16, "#FF4B4B"],
  ["43%", "5%", 20, "#FF86D0"],
  ["58%", "8%", 26, "#FF4B4B"],
  ["71%", "26%", 16, "#FF86D0"],
  ["84%", "9%", 20, "#FF4B4B"],
];

function Family() {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "linear-gradient(#BDE7FF, #EAF8FF)" }} />
      <Cloud className="left-24 top-3" delay={-6} />
      <Ground back="#9BE15D" front="#6CC644" />
      {/* One drawing, so the roof, walls and chimney can't slip apart at any card size. */}
      <svg viewBox="0 0 100 124" className="absolute bottom-4 left-2 h-[62%] max-h-48 w-auto overflow-visible">
        {[0, 1, 2].map((i) => (
          <circle key={i} className="lc-smoke" cx={72} cy={10} r={5} fill="#fff" style={{ animationDelay: `${i * 0.7}s`, transformBox: "fill-box", transformOrigin: "center" }} />
        ))}
        <rect x={66} y={18} width={12} height={32} fill="#9C5B38" />
        <rect x={63} y={14} width={18} height={6} rx={2} fill="#7A4528" />
        <rect x={16} y={58} width={68} height={58} fill="#FFE2B8" />
        <rect x={76} y={58} width={8} height={58} fill="#F2CB97" />
        <path d="M50 16 L94 60 H6z" fill="#C93636" stroke="#C93636" strokeWidth={6} strokeLinejoin="round" transform="translate(0 4)" />
        <path d="M50 16 L94 60 H6z" fill="#FF4B4B" stroke="#FF4B4B" strokeWidth={6} strokeLinejoin="round" />
        <path d={HEART_D} fill="#fff" transform="translate(50 43) scale(1.25)" />
        <rect x={23} y={78} width={14} height={14} rx={3} fill="#8ED8FF" stroke="#fff" strokeWidth={2.5} />
        <rect x={63} y={78} width={14} height={14} rx={3} fill="#8ED8FF" stroke="#fff" strokeWidth={2.5} />
        <path d="M41 116 V93 a9 9 0 0 1 18 0 V116z" fill="#C98A4B" />
        <circle cx={54.5} cy={104} r={2} fill="#FFC145" />
        <rect x={36} y={116} width={28} height={5} rx={2} fill="#B98F5F" />
      </svg>
      <span className="lc-sway absolute bottom-6 right-4 flex flex-col items-center">
        <span className="size-14 rounded-full bg-[#58CC02] shadow-[inset_-5px_-5px_0_#0002]" />
        <span className="h-6 w-2.5 bg-[#9C5B38]" />
      </span>
      {FAMILY_HEARTS.map(([left, top, size, color], i) => (
        <svg key={left} viewBox="-8 -8 16 16" className="lc-heart absolute" style={{ left, top, width: size, height: size, animationDelay: `${i * -0.35}s` }}>
          <path d={HEART_D} fill={color} />
        </svg>
      ))}
    </>
  );
}

/* Colors · rainbow + paint splats that throb with colour */
function Colors() {
  return (
    <>
      <span className="absolute inset-0 bg-[#FFFDF6]" />
      <span
        className="lc-rainbow absolute left-1/2 top-6 size-64 -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, transparent 46%, #CE82FF 46% 52%, #1CB0F6 52% 58%, #58CC02 58% 64%, #FFC145 64% 70%, #FF9600 70% 76%, #FF4B4B 76% 82%, transparent 82%)" }}
      />
      <Cloud className="left-2 top-[88px] !animate-none" />
      <Cloud className="right-0 top-[88px] !animate-none" />
      {[
        { c: "#FF4B4B", p: "left-3 top-3 size-8" },
        { c: "#1CB0F6", p: "right-4 top-4 size-6" },
        { c: "#FFC145", p: "left-6 bottom-4 size-7" },
        { c: "#CE82FF", p: "right-6 bottom-5 size-9" },
      ].map((s, i) => (
        <span key={s.p} className={cn("lc-blob absolute", s.p)} style={{ background: s.c, animationDelay: `${-i * 0.9}s` }} />
      ))}
    </>
  );
}

/* Shapes · bouncy shapes on a dotted toy mat */
function Shapes() {
  return (
    <>
      <span
        className="lc-pattern absolute inset-0"
        style={{ backgroundColor: "#F3E8FF", backgroundImage: "radial-gradient(#C084FC55 2.5px, transparent 3px), radial-gradient(#C084FC33 2.5px, transparent 3px)", backgroundSize: "28px 28px", backgroundPosition: "0 0, 14px 14px" }}
      />
      <span className="lc-spin absolute left-4 top-5 size-9 rounded-lg bg-[#1CB0F6] shadow-[inset_-3px_-4px_0_#0002]" />
      <span className="lc-bounce absolute right-6 top-4 size-10 rounded-full bg-[#FF4B4B] shadow-[inset_-3px_-4px_0_#0002]" />
      <span className="lc-spin absolute bottom-6 left-8 h-0 w-0 border-x-[18px] border-b-[30px] border-x-transparent border-b-[#FFC145] [animation-direction:reverse]" />
      <span className="lc-bounce absolute bottom-8 right-8 text-4xl leading-none text-[#58CC02] [animation-delay:-.5s]">★</span>
      <span className="lc-bounce absolute left-[44%] top-3 text-3xl leading-none text-[#FF86D0] [animation-delay:-1s]">♥</span>
    </>
  );
}

/* Calendar · sun and moon taking turns over a little town */
function Calendar() {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "linear-gradient(#9EDBFF, #E8F7FF)" }} />
      <span className="lc-starfade absolute inset-0" style={{ background: "linear-gradient(#24306E, #4B5AA8)" }} />
      <span className="lc-orbit absolute left-1/2 top-[110%] size-0">
        <span className="absolute -top-[110px] -left-5 size-10 rounded-full bg-[#FFC145] shadow-[0_0_0_6px_#FFC14533]" />
        <span className="absolute top-[70px] -left-4 size-9 rounded-full" style={{ boxShadow: "-8px 6px 0 0 #FFE58A" }} />
      </span>
      {[10, 30, 70, 88].map((x, i) => (
        <span key={x} className="lc-starfade absolute size-1.5 rounded-full bg-white" style={{ left: `${x}%`, top: `${10 + (i % 2) * 16}%` }} />
      ))}
      <Ground back="#7FB8E6" front="#4A90C8" />
      <span className="absolute left-3 top-3 rounded-lg bg-white px-1.5 pb-1 text-center shadow-[0_3px_0_#0002]">
        <span className="block h-1.5 rounded-t bg-[#FF4B4B]" />
        <span className="text-sm font-black text-[#4B4B4B]">31</span>
      </span>
    </>
  );
}

/* WH Questions · outer space with question-mark planets */
function WhQuestions() {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 20%, #4B3C9E, #1B1748 75%)" }} />
      {[[8, 12], [24, 40], [40, 8], [60, 30], [88, 60], [14, 66], [76, 10]].map(([x, y], i) => (
        <span key={i} className="lc-twinkle absolute size-1 rounded-full bg-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 0.4}s` }} />
      ))}
      <span className="lc-spin absolute right-5 top-4 grid size-11 place-items-center rounded-full bg-[#FF9600] text-xl font-black text-white shadow-[inset_-4px_-4px_0_#0003] [animation-duration:8s]">?</span>
      <span className="absolute right-2 top-[38px] h-1.5 w-[68px] -rotate-12 rounded-full border-2 border-[#FFC145]" />
      <span className="lc-shoot absolute left-0 top-4 h-0.5 w-16 rounded-full bg-gradient-to-l from-white to-transparent opacity-0" />
      <Floaters items={[["?", 10, 20], ["?", 18, 62], ["!", 84, 66]]} colors={["#FFC145", "#1CB0F6", "#FF86D0"]} />
      <span className="absolute inset-x-0 -bottom-6 h-12 rounded-[50%] bg-[#8E7CC3]" />
    </>
  );
}

/* Word Concepts · cosy library with chatty speech bubbles */
function WordConcepts() {
  return (
    <>
      <span className="absolute inset-0 bg-[#FFF1E6]" />
      {[0, 1].map((row) => (
        <span key={row} className="absolute inset-x-0 flex items-end gap-0.5 border-b-[5px] border-[#C98A4B] px-3" style={{ top: 18 + row * 46, height: 40 }}>
          {BRIGHT.concat(BRIGHT).slice(row * 3, row * 3 + 11).map((c, i) => (
            <span key={i} className="w-3 rounded-t-sm" style={{ background: c, height: 22 + ((i * 7) % 14), opacity: 0.85 }} />
          ))}
        </span>
      ))}
      {[
        { t: "hi!", p: "left-3 top-2", c: "#1CB0F6" },
        { t: "wow", p: "right-3 top-12", c: "#FF86D0" },
      ].map((b, i) => (
        <span key={b.t} className={cn("lc-bubble absolute rounded-2xl px-2 py-0.5 text-xs font-black text-white shadow-[0_3px_0_#0002]", b.p)} style={{ background: b.c, animationDelay: `${i * -1.2}s` }}>
          {b.t}
        </span>
      ))}
      <span className="absolute inset-x-0 bottom-0 h-8 bg-[#E8B878]" />
    </>
  );
}

const Fallback = ({ p }: { p: Pal }) => (
  <>
    <span className="absolute inset-0" style={{ background: `linear-gradient(${p.light}, #fff)` }} />
    <Ground back={`${p.main}77`} front={p.main} />
  </>
);

const WORLDS: Record<string, (props: { locked: boolean }) => React.ReactNode> = {
  Alphabet,
  Numbers,
  Greetings,
  Family,
  Colors,
  Shapes,
  Calendar,
  "WH Questions": WhQuestions,
  "Word Concepts": WordConcepts,
};

export function WorldStage({ title, p, locked }: { title: string; p: Pal; locked: boolean }) {
  const World = WORLDS[title];
  return (
    <span aria-hidden="true" className={cn("absolute inset-0", locked && "lc-world-asleep")}>
      {World ? <World locked={locked} /> : <Fallback p={p} />}
      {/* Locked: night falls over the world while its character sleeps */}
      {locked && <span className="absolute inset-0 bg-[#1B2559]/45" />}
    </span>
  );
}

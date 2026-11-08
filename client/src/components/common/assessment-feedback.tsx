import { useEffect, useState, type CSSProperties } from "react";
import { Check, Star, X } from "lucide-react";

type Answer = { text: string; imageUrl?: string };

const MOTION = `
@keyframes feedback-pop { 0% { transform: scale(.5); opacity: 0 } 70% { transform: scale(1.12) } 100% { transform: scale(1); opacity: 1 } }
@keyframes feedback-nudge { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-10px) } 75% { transform: translateX(10px) } }
@keyframes feedback-confetti { from { transform: translateY(-20px) rotate(0); opacity: 1 } to { transform: translateY(80dvh) rotate(540deg); opacity: 0 } }
@keyframes feedback-ring { from { transform: scale(1); opacity: .8 } to { transform: scale(3); opacity: 0 } }
@keyframes feedback-star { 0% { transform: translate(-50%,-50%) scale(.3); opacity: 0 } 25% { opacity: 1 } 100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(180deg); opacity: 0 } }
@keyframes feedback-rays { from { transform: translate(-50%,-50%) rotate(0) } to { transform: translate(-50%,-50%) rotate(45deg) } }
`;
const CONFETTI_COLORS = ["var(--hudyat-gold)", "#FFFFFF", "#FFF4D6", "#FFE08A"];
const STARS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 2 * Math.PI;
  const reach = i % 2 ? 110 : 150;
  return { x: `${Math.round(Math.cos(angle) * reach)}px`, y: `${Math.round(Math.sin(angle) * reach)}px` };
});

/** The celebration behind the check: rings and stars bursting out of the badge. */
function CorrectBadge() {
  return (
    <span className="relative z-10 flex size-28 items-center justify-center rounded-full bg-white text-green-700 shadow-xl motion-safe:animate-[feedback-pop_.45s_ease-out] sm:size-36">
      {[0, 250].map((delay) => (
        <span key={delay} aria-hidden="true" className="absolute inset-0 rounded-full border-4 border-white motion-reduce:hidden" style={{ animation: `feedback-ring 1s ease-out ${delay}ms both` }} />
      ))}
      {STARS.map(({ x, y }) => (
        <Star key={x + y} aria-hidden="true" className="absolute top-1/2 left-1/2 size-7 fill-hudyat-gold text-hudyat-gold motion-reduce:hidden" style={{ "--x": x, "--y": y, animation: "feedback-star 1.1s ease-out 150ms both" } as CSSProperties} />
      ))}
      <Check aria-hidden="true" className="size-20 sm:size-24" strokeWidth={4} />
    </span>
  );
}

/** The image (when there is one) and always the name: video questions are answered by name. */
function CorrectSign({ answer, large = false }: { answer?: Answer; large?: boolean }) {
  if (!answer) return null;
  return (
    <span className={large ? "flex w-full flex-col items-center gap-2" : "flex shrink-0 items-center gap-2"}>
      {answer.imageUrl && (
        <img src={answer.imageUrl} alt="" className={`rounded-xl bg-white object-contain ${large ? "max-h-[28dvh] w-full max-w-xs p-2" : "size-16 shrink-0 p-1"}`} />
      )}
      <span className={`rounded-xl bg-white px-4 py-1 font-extrabold text-foreground ${large ? "text-2xl sm:text-3xl" : "text-lg"}`}>{answer.text}</span>
    </span>
  );
}

/** Fills the question card right after checking; tap or wait and the answers show underneath. */
export function FeedbackOverlay({ isCorrect, correctAnswer, streak }: { isCorrect: boolean; correctAnswer?: Answer; streak: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    // Wrong stays longer: the child needs time to study the right sign.
    const timer = setTimeout(() => setVisible(false), isCorrect ? 2600 : 3000);
    return () => clearTimeout(timer);
  }, [isCorrect]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => setVisible(false)}
      className={`absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl p-4 text-white ${isCorrect ? "bg-gradient-to-b from-green-500 to-green-700" : "bg-[#d95849]/95 motion-safe:animate-[feedback-nudge_.4s_ease-in-out]"}`}
    >
      <style>{MOTION}</style>
      {isCorrect ? (
        <>
          <span aria-hidden="true" className="absolute top-1/2 left-1/2 size-[250vmax] motion-safe:animate-[feedback-rays_2.6s_linear_both]" style={{ transform: "translate(-50%,-50%)", background: "repeating-conic-gradient(rgb(255 255 255 / .1) 0 15deg, transparent 15deg 30deg)" }} />
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} aria-hidden="true" className={`absolute top-0 motion-reduce:hidden ${i % 2 ? "size-3 rounded-full" : "h-4 w-2 rounded-sm"}`} style={{ left: `${1 + i * 2.5}%`, background: CONFETTI_COLORS[i % 4], animation: `feedback-confetti ${1.3 + (i % 4) * .2}s ease-in ${(i % 8) * 80}ms both` }} />
          ))}
          <CorrectBadge />
          <span role="status" className="relative z-10 text-5xl font-extrabold drop-shadow-md motion-safe:animate-[feedback-pop_.45s_ease-out_.15s_both] sm:text-6xl">Correct!</span>
          {/* The sign they got right, so the win also reinforces what it looks like. */}
          <span className="relative z-10 flex w-full flex-col items-center [&_img]:max-h-[18dvh]"><CorrectSign answer={correctAnswer} large /></span>
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-xl font-bold text-green-800">
            <Star aria-hidden="true" className="size-6 fill-hudyat-gold text-hudyat-gold" />
            {streak >= 2 ? `${streak} in a row!` : "Great job!"}
          </span>
        </>
      ) : (
        <>
          <span className="flex size-20 items-center justify-center rounded-full bg-white text-[#d95849] motion-safe:animate-[feedback-pop_.4s_ease-out]">
            <X aria-hidden="true" className="size-14" strokeWidth={4} />
          </span>
          <span role="status" className="text-4xl font-extrabold sm:text-5xl">Not quite</span>
          <span className="text-xl">This is the right sign:</span>
          <CorrectSign answer={correctAnswer} large />
        </>
      )}
    </button>
  );
}

/** Stays in the hint's place until NEXT, so the result is still there after the overlay leaves. */
export function FeedbackBanner({ isCorrect, correctAnswer }: { isCorrect: boolean; correctAnswer?: Answer }) {
  const Icon = isCorrect ? Check : X;
  return (
    <div className={`mx-auto mt-[clamp(0.5rem,1.5vh,1.5rem)] flex w-full max-w-2xl shrink-0 items-center gap-3 rounded-2xl p-[clamp(0.5rem,1.5vh,1rem)] text-white ${isCorrect ? "bg-green-600" : "bg-[#d95849]"}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-white ${isCorrect ? "text-green-700" : "text-[#d95849]"}`}>
        <Icon aria-hidden="true" className="size-7" strokeWidth={3} />
      </span>
      <p className="min-w-0 flex-1 text-xl font-bold">{isCorrect ? "Correct! Great job!" : "The right sign is:"}</p>
      <CorrectSign answer={correctAnswer} />
    </div>
  );
}

/** Each question gets a segment that shows how it went. */
export function ResultProgress({ results, current, total }: { results: boolean[]; current: number; total: number }) {
  return (
    <div role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} className="flex h-4 gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`flex-1 rounded-full ${results[i] === true ? "bg-green-600" : results[i] === false ? "bg-[#d95849]" : i === current - 1 ? "bg-hudyat-gold" : "bg-[#E5E5E5]"}`} />
      ))}
    </div>
  );
}

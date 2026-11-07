/* eslint-disable react-refresh/only-export-components -- throwaway prototype */
// PROTOTYPE: three animated student navbars on existing routes, selected by ?variant=nav-*.
import type { ReactNode } from "react";
import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import "./navbar-prototype.css";

export const NAVBAR_VARIANTS = [
  { key: "nav-buddies", name: "Little buddies" },
  { key: "nav-stickers", name: "Sticker shelf" },
  { key: "nav-orbit", name: "Pocket orbit" },
] as const;

function Face() {
  return (
    <g className="nvp-face">
      <g className="nvp-eyes">
        <ellipse cx="-6" cy="0" rx="3.8" ry="4.8" fill="white" />
        <ellipse cx="6" cy="0" rx="3.8" ry="4.8" fill="white" />
        <circle cx="-5.5" cy=".8" r="2.1" fill="#3c3b46" />
        <circle cx="6.5" cy=".8" r="2.1" fill="#3c3b46" />
        <circle cx="-5" cy="-.2" r=".7" fill="white" />
        <circle cx="7" cy="-.2" r=".7" fill="white" />
      </g>
      <path className="nvp-happy" d="M-10 1 q4-6 8 0 M2 1 q4-6 8 0" fill="none" stroke="#3c3b46" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="-12" cy="6" rx="4" ry="2.5" fill="#ed8f8a" opacity=".6" />
      <ellipse cx="12" cy="6" rx="4" ry="2.5" fill="#ed8f8a" opacity=".6" />
      <path d="M-3 8 q3 4 6 0" fill="none" stroke="#3c3b46" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

const DRAWINGS: Record<string, ReactNode> = {
  Home: (
    <g className="nvp-house">
      <rect x="13" y="26" width="39" height="33" rx="8" fill="#5a9fc5" />
      <rect x="13" y="23" width="35" height="32" rx="7" fill="#a4d8ec" />
      <path className="nvp-roof" d="M7 29 L32 8 57 29 Q59 33 54 35 L32 18 11 35 Q5 34 7 29z" fill="#e99a80" />
      <rect x="26" y="45" width="12" height="14" rx="5" fill="#f8dfb2" />
      <g transform="translate(32 34) scale(.8)"><Face /></g>
      <path d="M20 51 h-1 M46 51 h-1" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  Learn: (
    <g className="nvp-book">
      <path d="M32 18 Q16 10 5 16 V50 Q18 46 32 55 Q46 46 59 50 V16 Q48 10 32 18z" fill="#4d9a8e" />
      <path d="M32 14 Q18 7 8 12 V46 Q21 42 32 51z" fill="#c1e5c6" />
      <path className="nvp-page" d="M32 14 Q46 7 56 12 V46 Q43 42 32 51z" fill="#e6f4d5" />
      <path d="M32 15 v35" stroke="#78b69a" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 17 l10 2 M40 19 l10-2" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(32 31) scale(.78)"><Face /></g>
    </g>
  ),
  Practice: (
    <g className="nvp-hand">
      <path d="M17 37 V18 a4 4 0 0 1 8 0 v13 V10 a4 4 0 0 1 8 0 v20 V12 a4 4 0 0 1 8 0 v20 V20 a4 4 0 0 1 8 0 v25 q0 16-17 16 Q18 61 12 49 L5 38 q-3-7 3-8 q4-1 9 7z" fill="#d99568" />
      <path d="M15 35 V16 a4 4 0 0 1 8 0 v13 V8 a4 4 0 0 1 8 0 v20 V10 a4 4 0 0 1 8 0 v20 V18 a4 4 0 0 1 8 0 v25 q0 15-16 15 Q17 58 10 47 L3 36 q-3-6 3-7 q4-1 9 6z" fill="#ffcd9d" />
      <g transform="translate(30 39) scale(.85)"><Face /></g>
      <path className="nvp-wave-lines" d="M53 14 q6 7 5 14 M57 8 q8 9 7 18" fill="none" stroke="#d6ad64" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  Assessment: (
    <g className="nvp-clipboard">
      <rect x="11" y="13" width="40" height="47" rx="8" fill="#9a85bc" />
      <rect x="8" y="10" width="40" height="47" rx="8" fill="#cdbce6" />
      <rect x="15" y="18" width="26" height="31" rx="4" fill="#fffaf3" />
      <rect x="20" y="7" width="17" height="9" rx="4" fill="#a18bc3" />
      <path d="M21 24 h14" stroke="#e2d9ec" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(28 35) scale(.7)"><Face /></g>
      <g className="nvp-pencil" transform="rotate(18 52 38)">
        <rect x="48" y="20" width="8" height="27" rx="3" fill="#f5bc55" /><path d="M48 46 h8 l-4 9z" fill="#d6aa7c" /><path d="M50 51 h4 l-2 4z" fill="#66574d" />
        <rect x="48" y="18" width="8" height="6" rx="2" fill="#edb0a3" />
      </g>
    </g>
  ),
  "My Progress": (
    <g>
      <g className="nvp-cup">
        <path d="M18 18 H7 v9 q0 12 15 12 M46 18 h11 v9 q0 12-15 12" fill="none" stroke="#e2a13d" strokeWidth="6" strokeLinejoin="round" />
        <path d="M17 13 h30 v18 q0 17-15 17 Q17 48 17 31z" fill="#d9a03a" />
        <path d="M17 12 h27 v17 q0 15-13 15 Q17 44 17 29z" fill="#ffd067" />
        <path d="M29 45 h6 v10 h-6z" fill="#d9a03a" /><rect x="22" y="53" width="21" height="7" rx="3.5" fill="#efbc57" />
        <g transform="translate(32 28) scale(.8)"><Face /></g>
        <path d="M17 13 h30" stroke="#ffe5a1" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path className="nvp-spark" d="M54 5 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f3b746" />
    </g>
  ),
  Other: (
    <g className="nvp-cloud">
      <path d="M17 54 C-2 54-1 31 12 29 C10 11 37 6 43 23 C62 15 70 44 53 51 Q46 56 17 54z" fill="#cf8b86" />
      <path d="M15 50 C-4 50-2 28 11 25 C10 8 35 3 42 19 C61 11 69 40 51 47 Q44 52 15 50z" fill="#f4b6a7" />
      <g transform="translate(32 28) scale(.8)"><Face /></g>
      <g fill="#ba7772"><circle className="nvp-dot" cx="22" cy="46" r="2" /><circle className="nvp-dot nvp-dot-two" cx="32" cy="46" r="2" /><circle className="nvp-dot nvp-dot-three" cx="42" cy="46" r="2" /></g>
    </g>
  ),
};


const BACKGROUNDS: Record<string, ReactNode> = {
  Home: (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#e8f5ff" />
      <circle className="nvp-sun" cx="53" cy="14" r="7" fill="#ffd976" />
      <path className="nvp-sky-cloud" d="M4 17 q0-5 5-5 q2-7 8-3 q6-2 7 4 q6 0 5 5 H4z" fill="white" />
      <path d="M2 58 q15-11 30 0 q18-12 34-1 v9 H2z" fill="#b7dca7" />
    </>
  ),
  Learn: (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#edf7e8" />
      <path d="M5 20 h58 M5 34 h58 M5 48 h58" stroke="#cce5bd" strokeWidth="1.5" />
      <g className="nvp-letters" fontSize="10" fontWeight="900" fill="#6ba783">
        <text x="3" y="13" rotate="-12">A</text><text x="53" y="61" rotate="12">B</text>
      </g>
    </>
  ),
  Practice: (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#fff0df" />
      <g className="nvp-ripples" fill="none" stroke="#f4bd83" strokeWidth="2">
        <circle cx="34" cy="34" r="28" /><circle cx="34" cy="34" r="20" />
      </g>
      <path d="M53 53 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#edab52" />
    </>
  ),
  Assessment: (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#f2ecfc" />
      <path d="M6 19 h56 M6 33 h56 M6 47 h56 M6 61 h56" stroke="#e0d5f2" strokeWidth="1.5" />
      <path className="nvp-check" d="M50 10 l4 4 8-9 M3 54 l4 4 7-8" fill="none" stroke="#86b391" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "My Progress": (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#fff4d3" />
      <g className="nvp-confetti" fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M7 6 l3 5 M57 40 l4 2" stroke="#f49a8b" />
        <path d="M9 47 l-3 4 M49 59 l4 3" stroke="#a394d4" />
        <path d="M27 5 l-1 4 M61 23 l-4 1" stroke="#78bca8" />
      </g>
    </>
  ),
  Other: (
    <>
      <rect x="2" y="2" width="64" height="64" rx="18" fill="#fff0ed" />
      <ellipse cx="34" cy="34" rx="28" ry="22" fill="none" stroke="#edc3bd" strokeWidth="1.5" strokeDasharray="2 4" />
      <g className="nvp-orbit-dots">
        <circle cx="11" cy="8" r="4" fill="#e7b366" /><circle cx="59" cy="52" r="4" fill="#a8b8da" />
        <circle cx="13" cy="60" r="3" fill="#96c6ad" />
      </g>
    </>
  ),
};

export function CartoonNavIcon({ name }: { name: string }) {
  return (
    <svg className="nvp-drawing" viewBox="0 0 68 68" aria-hidden="true" focusable="false">
      <g className="nvp-scene">{BACKGROUNDS[name] ?? BACKGROUNDS.Other}</g>
      {DRAWINGS[name] ?? DRAWINGS.Other}
    </svg>
  );
}

export default function NavbarPrototypeControls({ current }: { current: string }) {
  return (
    <div className="nvp-controls">
      <PrototypeSwitcher variants={[...NAVBAR_VARIANTS]} current={current} />
    </div>
  );
}

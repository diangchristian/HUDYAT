import { Pause, Play } from "lucide-react";
import type { MyProgress } from "@/api/progress-api";

function Face() {
  return (
    <g>
      <g className="progress-blink">
        <ellipse cx="-11" cy="0" rx="6" ry="8" fill="white" />
        <ellipse cx="11" cy="0" rx="6" ry="8" fill="white" />
        <ellipse cx="-10" cy="1" rx="3" ry="4.5" fill="#34343f" />
        <ellipse cx="12" cy="1" rx="3" ry="4.5" fill="#34343f" />
        <circle cx="-9" cy="-1" r="1.3" fill="white" />
        <circle cx="13" cy="-1" r="1.3" fill="white" />
      </g>
      <ellipse cx="-22" cy="10" rx="7" ry="4" fill="#fb8e7b" opacity=".65" />
      <ellipse cx="22" cy="10" rx="7" ry="4" fill="#fb8e7b" opacity=".65" />
      <path d="M-7 13 Q0 23 7 13" fill="none" stroke="#34343f" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function TrophyMark() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="progress-mark">
      <ellipse className="progress-shadow" cx="80" cy="145" rx="36" ry="6" fill="#e8b64f" opacity=".22" />
      <g className="progress-trophy">
        <path d="M48 39 H25 V54 Q25 80 53 80 M112 39 H135 V54 Q135 80 107 80" fill="none" stroke="#dd961e" strokeWidth="12" strokeLinejoin="round" />
        <path d="M48 36 H25 V51 Q25 73 51 73 M112 36 H135 V51 Q135 73 109 73" fill="none" stroke="#ffc145" strokeWidth="9" strokeLinejoin="round" />
        <path d="M70 94 H90 V125 H70z" fill="#e6a124" />
        <rect x="53" y="120" width="54" height="16" rx="8" fill="#ce8b1c" />
        <rect x="50" y="118" width="58" height="13" rx="6.5" fill="#ffd66b" />
        <path d="M43 30 H117 V65 Q117 105 80 105 Q43 105 43 65z" fill="#e6a124" />
        <path d="M43 30 H111 V63 Q111 97 77 97 Q43 97 43 63z" fill="#ffc145" />
        <path d="M53 40 V56" stroke="#ffe9a4" strokeWidth="7" strokeLinecap="round" />
        <g transform="translate(80 65)"><Face /></g>
        <rect x="39" y="25" width="82" height="13" rx="6.5" fill="#ffdb76" />
      </g>
      <path className="progress-twinkle" d="M127 10 L131 20 141 24 131 28 127 38 123 28 113 24 123 20z" fill="#ffb12b" />
      <path className="progress-twinkle progress-delay" d="M25 93 L28 100 35 103 28 106 25 113 22 106 15 103 22 100z" fill="#9b87e8" />
      <path className="progress-confetti" d="M17 17 L21 24 M143 99 L138 104" stroke="#f59d99" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function SproutMark() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="progress-mark">
      <ellipse cx="80" cy="144" rx="43" ry="7" fill="#9ebd6f" opacity=".2" />
      <g className="progress-leaves">
        <path d="M80 84 V46" fill="none" stroke="#4e8b48" strokeWidth="7" strokeLinecap="round" />
        <path d="M80 62 C43 67 33 45 38 25 C63 22 83 36 80 62z" fill="#5caa58" />
        <path d="M80 52 C79 24 102 13 122 17 C127 43 105 59 80 52z" fill="#98ce62" />
        <path d="M45 33 L75 57 M112 27 L84 49" fill="none" stroke="#d5ee9c" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <path d="M43 83 H117 L108 128 Q106 139 95 139 H65 Q54 139 52 128z" fill="#cc795b" />
      <path d="M43 83 H109 L101 124 Q100 133 90 133 H65 Q54 133 52 122z" fill="#f2a17f" />
      <rect x="37" y="74" width="86" height="18" rx="8" fill="#df8665" />
      <rect x="37" y="72" width="82" height="14" rx="7" fill="#ffbb96" />
      <g transform="translate(80 106) scale(.86)"><Face /></g>
      <g className="progress-twinkle">
        <circle cx="25" cy="62" r="5" fill="#ffc145" />
        <path d="M131 64 L134 71 141 74 134 77 131 84 128 77 121 74 128 71z" fill="#ffc145" />
      </g>
    </svg>
  );
}

function NotebookMark() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="progress-mark">
      <g className="progress-notebook">
        <rect x="35" y="25" width="94" height="117" rx="15" fill="#459994" />
        <rect x="30" y="20" width="94" height="117" rx="15" fill="#83ccc1" />
        <rect x="43" y="33" width="67" height="89" rx="7" fill="#f4fffb" />
        <path d="M56 48 H96 M56 60 H81" stroke="#c2e8dd" strokeWidth="5" strokeLinecap="round" />
        <g transform="translate(77 85) scale(.8)"><Face /></g>
        <path d="M52 16 V31 M76 16 V31 M100 16 V31" stroke="#459994" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g className="progress-twinkle">
        <circle cx="124" cy="120" r="23" fill="#ffc145" />
        <path d="M113 120 L121 128 135 113" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function ProgressHeader({
  playing,
  onToggle,
}: {
  playing: boolean;
  onToggle: () => void;
}) {
  const MotionIcon = playing ? Pause : Play;

  return (
    <header className="progress-header">
      <div className="progress-header-content">
        <div className="progress-header-art"><NotebookMark /></div>
        <div>
          <p className="progress-eyebrow">My journey / Little keepsakes</p>
          <h1 id="my-progress-heading">My <span>Progress</span></h1>
          <p className="progress-description">
            A page for every little win.<br />A story only your hands can tell.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="progress-motion-button"
        onClick={onToggle}
        aria-pressed={!playing}
      >
        <MotionIcon size={16} aria-hidden="true" />
        {playing ? "Pause animations" : "Play animations"}
      </button>
    </header>
  );
}

export function ProgressSummary({ summary }: { summary: MyProgress["summary"] }) {
  const stats = [
    { label: "Categories completed", value: `${summary.completedCategories}/${summary.totalCategories}`, Mark: TrophyMark, color: "#fff5da" },
    { label: "Categories in progress", value: summary.inProgressCategories, Mark: SproutMark, color: "#eef6e7" },
    { label: "Assessments submitted", value: summary.assessmentAttempts, Mark: NotebookMark, color: "#eaf6f3" },
  ];

  return (
    <section aria-label="Progress summary" className="grid gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, Mark, color }) => (
        <article className="progress-stat sm:flex-col sm:text-center md:flex-row md:text-left" key={label}>
          <div className="progress-stat-art" style={{ backgroundColor: color }}><Mark /></div>
          <div className="min-w-0">
            <p className="text-3xl font-extrabold text-foreground">{value}</p>
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

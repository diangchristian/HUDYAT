import type { CSSProperties } from "react";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { ProgressCategory } from "@/api/progress-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import StatusBadge from "@/components/common/status-badge";
import { LessonCharacter, PALETTE } from "@/components/common/learn-card/characters";
import { WorldStage } from "@/components/common/learn-card/worlds";
import "@/components/common/learn-card/learn-card.css";

const STATUS = {
  COMPLETED: { label: "Completed", icon: CheckCircle2, tone: "success" },
  IN_PROGRESS: { label: "In progress", icon: PlayCircle, tone: "info" },
  NOT_STARTED: { label: "Not started", icon: Circle, tone: "neutral" },
} as const;

const DESCRIPTIONS: Record<string, string> = {
  Alphabet: "From A to Z, one sign at a time.",
  Numbers: "Make every number count with your hands.",
  Greetings: "A friendly hello starts with your hands.",
  Family: "Signs for the people closest to you.",
  Colors: "Bring a little color to every conversation.",
  Shapes: "Find the shapes hiding in everyday things.",
  Calendar: "Signs for days, months, and moments.",
  "WH Questions": "Who, what, where? Let your curiosity lead.",
  "Word Concepts": "Turn everyday ideas into signs.",
};

export default function ProgressCategoryCard({ category }: { category: ProgressCategory }) {
  const color = CATEGORIES.find((item) => item.title === category.name)?.color ?? "blue";
  const palette = PALETTE[color];
  const assessment = category.latestAssessment;

  return (
    <article
      className="progress-card group"
      tabIndex={0}
      aria-label={`${category.name} progress`}
      style={{ "--progress-accent": palette.main, "--progress-soft": palette.light, "--progress-edge": palette.dark } as CSSProperties}
    >
      <div className="progress-photo">
        <div className="progress-photo-scene">
          <WorldStage title={category.name} p={palette} locked={false} />
          <div className="progress-photo-character">
            <LessonCharacter title={category.name} color={color} className="progress-character" />
          </div>
        </div>
        <div className="progress-photo-caption">
          <h3>{category.name}</h3>
          <StatusBadge {...STATUS[category.status]} className="progress-status" />
        </div>
      </div>
      <div className="progress-note">
        <p className="progress-encouragement">
          {DESCRIPTIONS[category.name] ?? `Explore ${category.name.toLowerCase()} through sign language.`}
        </p>
        <div className="progress-lesson">
          <div className="progress-label">
            <span>Lesson progress</span><b>{category.progressPercent}%</b>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`${category.name} lesson progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={category.progressPercent}
          >
            <div className="progress-fill" style={{ width: `${category.progressPercent}%` }} />
          </div>
        </div>
      </div>
      <div className="progress-assessment">
        <p className="progress-kicker">Latest assessment</p>
        {assessment ? (
          <>
            <p className="progress-score">
              {assessment.score}<span> / {assessment.totalPoints}</span><b>{assessment.percentage}%</b>
            </p>
            <p className="progress-history">
              Submitted <time dateTime={assessment.completedAt}>{new Date(assessment.completedAt).toLocaleDateString()}</time>
              {" · "}{category.assessmentAttempts} attempt{category.assessmentAttempts === 1 ? "" : "s"}
            </p>
          </>
        ) : (
          <p className="progress-no-score">No assessment attempts yet.</p>
        )}
      </div>
    </article>
  );
}

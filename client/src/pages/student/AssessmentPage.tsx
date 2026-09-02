import { useState } from "react";
import { ArrowRight, Check, ChevronRight, CirclePlay, Eye, Minus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

type AssessmentStatus = "not-started" | "completed" | "in-progress";

type Assessment = {
  title: string;
  description: string;
  status: AssessmentStatus;
  items: number;
  score?: string;
  progress?: number;
  theme: "coral" | "blue" | "mint";
};

const assessments: Assessment[] = [
  { title: "Greetings", description: "Practice saying hello, goodbye, and asking how someone is doing.", status: "not-started", items: 10, theme: "coral" },
  { title: "Numbers", description: "Counting from 1 to 20 and basic quantities.", status: "completed", items: 10, score: "8/10", theme: "mint" },
//   { title: "Shapes", description: "Identifying common shapes and patterns.", status: "in-progress", items: 12, progress: 55, theme: "blue" },
 
];

const filters = ["All", "Available", "Completed"] as const;

const statusDetails = {
  "not-started": { label: "Not Started", color: "#eef1f3", icon: CirclePlay },
  completed: { label: "Completed", color: "#3da44b", icon: Check },
  "in-progress": { label: "In Progress", color: "#3b9cdb", icon: Minus },
};

const thumbnailStyles = {
  coral: "bg-[#e8f5f7] text-[#ee8060]",
  mint: "bg-[#dff1ed] text-[#e4bb4d]",
  blue: "bg-[#e3f2fa] text-[#2385c3]",
};

const thumbnailArt = {
  coral: "HELLO!  1  2  3",
  mint: "1   2   3",
  blue: "△  ○  □  ☆",
};

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const visibleAssessments = assessments.filter((assessment) => {
    if (activeFilter === "Completed") return assessment.status === "completed";
    if (activeFilter === "Available") return assessment.status !== "completed";
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl font-body text-[#111827]">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">  
        <div className="flex items-center gap-4">
          <img src="/icons/assessment.png" alt="" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assessments</h1>
            <p className="mt-1 text-base">Show what you've learned. <Sparkles className="ml-1 inline size-4 text-[#f5ae24]" /></p>
          </div>
        </div>

        <div className="flex w-fit rounded-full bg-[#e7e9eb] p-1 shadow-inner">
          {filters.map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`min-w-20 rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${activeFilter === filter ? "bg-[#ffc145] text-[#5c430b] shadow-[0_2px_3px_rgb(0_0_0/0.12)]" : "text-[#374151] hover:bg-white/60"}`}>
              {filter}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {visibleAssessments.map((assessment) => {
          const details = statusDetails[assessment.status];
          const StatusIcon = details.icon;
          return (
            <article key={assessment.title} className="relative flex min-h-91.25 flex-col w-sm sm:w-full  overflow-hidden rounded-2xl border border-[#dbc8ae] bg-white p-4 shadow-[0_2px_3px_rgb(0_0_0/0.06)]">
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: details.color }} />

              <div className="mb-4 flex items-center justify-between gap-2 text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#b8bfc5] px-2.5 py-1" style={{ backgroundColor: assessment.status === "completed" ? details.color : "#eef1f3", color: assessment.status === "completed" ? "white" : "#334155" }}>
                  <StatusIcon className="size-3.5" /> {details.label}
                </span>
                <span className="rounded-full bg-[#edf0f2] px-2.5 py-1">{assessment.score ? `Score: ${assessment.score}` : `${assessment.items} Items`}</span>
              </div>

              <div className={`relative flex h-31.5 items-center justify-center overflow-hidden rounded-xl border border-[#dbe1e4] ${thumbnailStyles[assessment.theme]}`}>
                <div className="absolute inset-3 rounded-lg border-2 border-white/70 bg-white/35" />
                <div className="relative text-center text-2xl font-extrabold tracking-[0.18em] drop-shadow-sm">{thumbnailArt[assessment.theme]}</div>
              </div>

              <div className="flex flex-1 flex-col pt-4">
                <h2 className="text-xl font-extrabold">{assessment.title}</h2>
                <p className="mt-1 text-sm leading-5 text-[#374151]">{assessment.description}</p>
                {assessment.progress && <div className="mt-4 h-2 overflow-hidden rounded-full border border-[#c4b9ab] bg-[#eee9e2]"><div className="h-full rounded-full bg-[#087bbd]" style={{ width: `${assessment.progress}%` }} /></div>}
                <button type="button" onClick={() => assessment.status === "not-started" ? navigate("/student/assessment/1") : assessment.status === "completed" && navigate("/student/assessment/result") } className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg border-b-4 px-3 text-sm font-extrabold transition-transform active:translate-y-1 active:border-b-0 ${assessment.status === "completed" ? "border-[#19732b] bg-[#3da44b] text-white" : assessment.status === "in-progress" ? "border-[#00538b] bg-[#0873b6] text-white" : "border-[#b87800] bg-[#ffbd3d] text-[#573d00]"}`}>
                  {assessment.status === "completed" ? "View Result" : assessment.status === "in-progress" ? "Continue" : "Start Assessment"}
                  {assessment.status === "completed" ? <Eye className="size-4" /> : assessment.status === "not-started" ? <ArrowRight className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  )
}

export default AssessmentPage
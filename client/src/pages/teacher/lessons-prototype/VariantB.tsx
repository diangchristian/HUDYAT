/*
 * PROTOTYPE — throwaway. Variant B: "Sign gallery" — big visual cards
 * led by a 2×2 mosaic of the lesson's own sign images, with search and
 * learning-area tabs. Content-first: you recognise a lesson by its signs.
 */
import { useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssessmentListArea } from "@/api/teacher-api";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { flattenLessons, type Lesson } from "@/lib/lessons";
import { QuizPill, SignThumb } from "./shared";

function GalleryCard({ lesson }: { lesson: Lesson }) {
  const { data: gestures = [] } = useCategoryGestures(lesson.categoryId);
  const mosaic = gestures.slice(0, 4);

  return (
    <Link
      to={`/teacher/quizzes/${lesson.categoryId}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative grid aspect-[4/3] grid-cols-2 gap-px bg-border">
        {mosaic.map((gesture) => (
          <SignThumb key={gesture.id} gesture={gesture} className="size-full p-2" />
        ))}
        {Array.from({ length: Math.max(0, 4 - mosaic.length) }, (_, i) => (
          <span key={i} className="bg-muted" />
        ))}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {lesson.gestureCount} signs
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <LessonIcon name={lesson.categoryName} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground group-hover:text-primary">
              {lesson.categoryName}
            </p>
            <p className="text-xs text-muted-foreground">{lesson.areaName}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <QuizPill lesson={lesson} />
          {!lesson.assessment && (
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <Plus className="size-3.5" /> Create
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function VariantB({ areas }: { areas: AssessmentListArea[] }) {
  const [area, setArea] = useState("all");
  const [query, setQuery] = useState("");

  const lessons = flattenLessons(
    areas.filter((a) => area === "all" || a.id === area),
  ).filter((lesson) =>
    lesson.categoryName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Lessons
          </h1>
          <p className="text-muted-foreground">
            Every sign your learners will practice, lesson by lesson.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search lessons"
            placeholder="Search lessons…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-full bg-white pl-9"
          />
        </div>
      </header>

      <Tabs value={area} onValueChange={(value) => setArea(String(value))}>
        <TabsList className="h-11 rounded-full bg-secondary p-1">
          <TabsTrigger value="all" className="rounded-full px-4 font-bold">
            All
          </TabsTrigger>
          {areas.map((a) => (
            <TabsTrigger key={a.id} value={a.id} className="rounded-full px-4 font-bold">
              {a.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {lessons.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No lessons match.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <li key={lesson.categoryId}>
              <GalleryCard lesson={lesson} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

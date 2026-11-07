# Animated progress logo and cards prototype

Status: ready-for-human
Type: prototype

## Question

Which of five cartoon logo, animated icon, and category-card directions best fits Hudyat's My Progress page,
with Duolingo-like playfulness and a distinct Hudyat identity?

## Primary source

Archived throwaway branch: `prototype/progress-logo` at `7bd5b52`.
Prototype: `client/src/pages/student/progress-logo-prototype/`.
Host: the existing authenticated `/student/progress` page; live progress remains read-only.
Card extension issue: [01-category-cards.md](issues/01-category-cards.md).
Implementation: [02-implement-little-keepsakes.md](issues/02-implement-little-keepsakes.md).

The prototype paths and comparison URLs below refer to the archived branch.
The implementation uses Little keepsakes directly on `/student/progress` in development and production.

Run `npm run dev` from `client/` with the usual API server running, sign in as a learner,
then open `/student/progress?variant=trophy`. No packages or environment changes needed.

## Directions

- `?variant=trophy` — Trophy club: a bouncing gold cup and collectible sign cards with category-themed
  illustrated backgrounds, matching short descriptions, and chunky edges.
- `?variant=sprout` — Little by little: a garden journal with category portraits, growing leaves,
  ruled entries, a bookmark, and a separate assessment column.
- `?variant=rocket` — Up we go!: explorer tickets with category scenes, a flight route,
  a mascot orbit, dashed seams, and blue ink.
- `?variant=scrapbook` — Little keepsakes: a notebook logo, taped category photographs with the
  Learn cards' shared animated worlds, a ruled note, and folded-paper assessment summaries in a
  compact three-column desktop collection.
- `?variant=arcade` — Pocket arcade: a smiling star logo, compact navy displays,
  category characters, pixel lights, and real progress and assessment readouts.

All directions include animated trophy, sprout and notebook summary icons using the
existing progress values. Use the floating arrows or left/right keys to compare.
Category characters reuse the original artwork from the existing lesson-card prototype.
Cards retain the actual status, progress, assessment scores, submission dates and attempt counts.
Each direction includes category-specific descriptions. Hover or Tab to a card to see its reaction:
Trophy portraits pop, Sprout leaves grow and the bookmark flutters, Rocket mascots take off along
a moving route, Scrapbook photos wobble, and Arcade screens shine. The shared character smiles
and progress highlights react too. These effects never change progress or hide information.
Not-started categories remain accessible summaries rather than being presented as locked.
Pause/play applies to every prototype icon, including the category characters and hover reactions.
Reduced-motion preferences disable animation.
Variants and their switcher only render during development; the ordinary page is the default.

## Verdict

The user selected Little keepsakes for the PWA's My Progress page. Its notebook identity,
taped photographs, shared Learn backgrounds, and compact three-column desktop layout are
the accepted design. Characters have no translucent circle behind them.

The implementation removes the comparison switcher and all losing progress variants.
Production components live under `client/src/pages/student/progress/` on
`feature/little-keepsakes-progress`; the full comparison remains on the archived branch.

## Validation

TypeScript/Vite production build and ESLint for the changed TSX files passed.
The existing development server serves the host page and prototype modules on port 5173.
The production build includes the selected design and excludes the comparison variants.
Browser visual verification was unavailable because the browser connection host was offline.
No automated tests were added for this throwaway visual prototype.

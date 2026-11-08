# Student home redesign

Status: resolved

## Question

How should `/student/home` look so it feels friendly and lively to deaf elementary
learners without overwhelming them?

## Verdict (2026-11-08)

`adv-refined` won: keep the "Today's adventure" layout and fix its problems. It is now
the real page, `client/src/pages/student/StudentHomePage.tsx`.

Decisions that came out of the review:

- Mode tiles use the sidebar's own figures and paper backgrounds, so the two match.
- The card uses the Learn page's progress bar (`LessonProgressBar`), not a custom one.
- Stickers are an album of same-sized slots: earned, next, or a "?" mystery.
- The Family character follows the Greetings build, and its house is one SVG.
- CONTINUE stays gold, the only gold element on the page, unlike the lesson-coloured
  Learn card buttons.

## Open

- The tile says "Quiz" while the sidebar says "Assessment" for the same figure.

## Prototypes

Not in the app any more. `prototypes/` holds the two rounds from this review
(`adv-refined`/`adv-poster`/`adv-quest` and `kid-stage`/`kid-town`/`kid-friends`) as
reference; they won't compile from here. The earlier `home-prototype.tsx` and
`home-alive-prototype.tsx` are in git history under `client/src/pages/student/`.

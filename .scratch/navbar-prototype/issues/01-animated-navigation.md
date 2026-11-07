# Compare cartoon navbar icons and themed backgrounds

Status: ready-for-human
Type: prototype

## Request

Make the student navbar icons cartoonish, animated and lively, with hover effects and
background effects based on the destination names. Ponytail lite: reuse the existing
artwork, and include the current list arrangement as the smaller option.

## Primary source

Branch: `feature/navbar-improvement`.
Prototype: `client/src/layouts/navbar-prototype/`.
Spec: [../spec.md](../spec.md).
Preview: `/student/home?variant=nav-buddies`, `?variant=nav-stickers`, or `?variant=nav-orbit`.

## Answer

Three arrangements are ready to compare: a familiar vertical buddy list, a taped sticker
board, and a compact icon rail. Each includes six original characters with matching
destination scenes, hover/focus reactions, and an active-page indication.
The user requested removing the pause/play control; navbar motion runs automatically.
The same artwork appears in the mobile bottom navbar. Reduced motion is supported.
The choice stays in the URL while navigating. The existing route content and real data remain.
The prototype and its switcher are gated to development builds. No winner is selected yet.

## Validation

Client TypeScript/Vite/PWA build and targeted ESLint passed. Static render checks cover
all three variants, all six destination scenes on desktop/mobile, active links, retained
preview URLs and routed content, the ordinary-navbar fallback, and absence of the pause/play control.
The production JavaScript excludes the variant labels, cartoon comparison and controls.
No automated test files added for this throwaway prototype. Browser visual verification remains pending.

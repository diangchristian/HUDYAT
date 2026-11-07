# Make Little Buddies the student navbar

Status: ready-for-human
Type: implementation

## Decision and source

The user selected Little Buddies for the real project and requested removing Sticker Shelf
and Pocket Orbit. Implementation branch: `feature/navbar-improvement`.
The full comparison is preserved at `b72f3a6` on `prototype/navbar-cartoon-variants`.

## Result

The normal student routes render Little Buddies in development and production, with no
variant parameter or floating comparison controls. The pause/play control remains removed.
Production artwork and styles live in `client/src/layouts/student-nav/`; the navbar prototype
directory and the two losing layouts are removed.

The six existing cartoon icons retain their destination backgrounds, idle animation,
hover/focus reactions and reduced-motion support. They appear in the 16rem desktop sidebar
and the labelled mobile bottom navbar. Mobile content padding accounts for the bottom navbar
and the device's safe area; the prototype control spacer is removed.

Navigation uses the existing student URLs, with active-page indication. Settings and logout
keep their existing handlers, and logout still uses the shared session cleanup hook.
The Other menu opens with its button and closes with Escape, returning focus to that button.
All buttons have labels and visible keyboard focus; decorative SVGs stay hidden from assistive
technology. Routed page content and the separate staff layouts retain their existing behavior.

The unused PNG-image property is removed from the sidebar item type and its single caller.
No dependencies, persistence, database changes, or new layout options are introduced.

## Validation

Client TypeScript/Vite/PWA build, targeted ESLint, and all 77 existing client tests passed.
Static rendering checks cover the default navbar on all five student routes, all six scenes
on desktop/mobile, active and nested links, unchanged hrefs and page content, old variant
URLs, menu labels, icon fallback, reduced-motion styles and safe-area padding.
The production bundle includes the selected icons and excludes the losing variants,
prototype styles and controls. The PWA service worker precaches the resulting bundle.
Standards and spec reviews reported no findings.
Browser interaction and installed-PWA checks remain pending.

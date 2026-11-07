# Extend the animated progress identity to category cards

Status: ready-for-human
Type: prototype

## Question

How should the category cards share the animated logos' playful character while keeping
a Hudyat identity and the existing progress information?

## Primary source

Archived branch: `prototype/progress-logo` at `7bd5b52`.
Code: `client/src/pages/student/progress-logo-prototype/category-card.tsx` and `category-card.css`.
Preview: `/student/progress?variant=trophy`, `?variant=sprout`, `?variant=rocket`,
`?variant=scrapbook`, or `?variant=arcade`.

## Answer

Five alternatives are ready for comparison: collectible signbook cards, a horizontal
growth journal, explorer tickets, a pasted-photo scrapbook, and pocket arcade displays.
Existing original category characters are reused;
warm gold, category illustrations, and short category-specific descriptions establish the Hudyat identity.
Actual progress, statuses, latest scores, submission dates, and attempt counts remain visible.
The existing pause control covers the added animations and reduced motion remains supported.
The user selected Little keepsakes. Its production implementation is recorded in
[02-implement-little-keepsakes.md](02-implement-little-keepsakes.md); the full comparison
and the paths above remain available on the archived branch.

## Trophy refinement

The user requested category-based backgrounds and descriptions, and removal of the decorative
"sign by sign" seals and unused "H / SIGNBOOK" labels from Trophy cards. Each of the nine
categories now has its own scene and copy: letter tiles, numbered bubbles, greeting bubbles,
a family neighborhood, paint rainbows, geometry, calendar pages, question bubbles, or books and ideas.
Background motion uses the existing pause and reduced-motion controls. Sprout and Rocket retain
their separate designs. This is a refinement of Trophy, not approval to ship it to production.

## More options and hover reactions

The user requested stronger alternatives and hover animations. Sprout now has a garden scene,
category descriptions, growing foliage and a fluttering bookmark. Rocket has category scenes,
category descriptions, an orbit around each mascot, and a moving flight path during its takeoff reaction.
Two additional directions bring the comparison to five: Scrapbook with taped photographs and
a notebook logo; Arcade with ink-blue displays, pixel lights and an original smiling star logo.

Hover reactions also work when a card receives keyboard focus, with a visible focus outline.
Trophy portraits pop, Scrapbook photos wobble and Arcade screens catch a moving highlight.
Character reactions are bounded rather than hopping continuously. Pause stops hover movement
as well as idle movement, including pseudo-elements; reduced motion disables the animations.
Every variant continues to show the actual lesson and assessment values without new mutations.

## Little keepsakes sizing

The user requested smaller Little keepsakes cards so three fit in a desktop row.
Scrapbook now uses three columns from 1024px, two from 768px, and one on phones.
Smaller photo scenes and tighter card spacing keep the taped-photo design compact and readable.
This refines the existing prototype rather than selecting a production design.

## Little keepsakes backgrounds

The user requested the Learn cards' backgrounds for Little keepsakes.
Each photograph now reuses the same category-specific `WorldStage` as Learn, including its animations.
Characters sit directly on these backgrounds; the user requested removing the translucent circle.
The compact three-column layout, character portraits, taped frames, and progress values remain.
The shared worlds follow the existing pause and reduced-motion controls.

## Validation

Client production build and targeted ESLint passed, including the Little keepsakes sizing
and shared-background refinements. Browser visual verification remains pending.

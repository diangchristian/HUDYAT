# Lively cartoon student navbar

Status: ready-for-human
Type: prototype

## Question

Which navbar arrangement suits Hudyat while giving each destination a cartoon character,
a background based on its name, and a lively hover reaction?

## Primary source

Archived comparison: `prototype/navbar-cartoon-variants` at `b72f3a6`.
Prototype code on that snapshot: `client/src/layouts/navbar-prototype/`.
Production code: `client/src/layouts/student-nav/` and `SidebarLayout.tsx`.
Implementation branch: `feature/navbar-improvement`.
Issue: [01-animated-navigation.md](issues/01-animated-navigation.md).
Implementation: [02-implement-little-buddies.md](issues/02-implement-little-buddies.md).

Run `npm run dev` from `client/`, with the normal API server available. Sign in as a learner
and open `/student/home`; Little Buddies is now the default navbar in development and production.
The comparison URLs and directions below describe the archived prototype snapshot.

## Directions

- `nav-buddies` — Little buddies: the smaller option, keeping the familiar vertical list.
- `nav-stickers` — Sticker shelf: a two-column board of taped cartoon tiles.
- `nav-orbit` — Pocket orbit: a narrow icon rail with captions and a floating mobile dock.

The desktop sidebar and mobile bottom navbar use the same six original icon characters:

| Destination | Background | Hover or keyboard-focus reaction |
| --- | --- | --- |
| Home | Blue sky, sun, drifting clouds, green hills | Roof pops and clouds drift faster |
| Learn | Ruled paper and floating letters | Book page flips and letters bob faster |
| Practice | Warm concentric ripples | Hand waves and ripples pulse faster |
| Assessment | Worksheet lines and checkmarks | Pencil writes and checks draw in |
| My Progress | Golden confetti | Trophy hops and confetti dances |
| Other | Pastel dotted orbit | Cloud smiles and its dots bounce |

Hover and focus also reveal a matching background pattern on each nav item.
The icons blink and breathe at rest. The user requested removing the pause/play button;
navbar animations run automatically and reduced-motion preferences disable animation.

## Scope and verdict

The user selected Little Buddies for the real project. It now renders on the existing
authenticated student routes without a variant parameter or comparison switcher.
Sticker Shelf and Pocket Orbit are removed from the implementation and preserved in the archive.
Settings, logout, active-page indication, student data, and routed page content are retained.
The Other menu opens with its button and closes with Escape. Staff navigation uses its own layout.

Artwork and layout foundations reuse the earlier navbar prototype archived on
`prototype/progress-logo`; the destination backgrounds are the new refinement.
No packages or persistence added. Little Buddies is the accepted direction.

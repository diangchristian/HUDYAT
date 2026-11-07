# Lively cartoon student navbar

Status: ready-for-human
Type: prototype

## Question

Which navbar arrangement suits Hudyat while giving each destination a cartoon character,
a background based on its name, and a lively hover reaction?

## Primary source

Branch: `feature/navbar-improvement`.
Code: `client/src/layouts/navbar-prototype/` and its integration in `SidebarLayout.tsx`.
Issue: [01-animated-navigation.md](issues/01-animated-navigation.md).

Run `npm run dev` from `client/`, with the normal API server available. Sign in as a learner
and open `/student/home?variant=nav-buddies`. The existing floating arrows and left/right keys
switch between the three directions. Clicking a nav item keeps the chosen variant.

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
The icons blink and breathe at rest. A pause/play control stops navbar motion without
stopping the page's own animations, and reduced-motion preferences disable animation.

## Scope and verdict

This is a development-only comparison on the existing authenticated student routes.
The ordinary navbar remains the default until a design is selected. The existing Settings,
logout, active-page indication, student data, and routed page content are retained.
The Other menu can be opened with its button and closed with Escape in the prototype.
Staff navigation uses its own layout.

Artwork and layout foundations reuse the earlier navbar prototype archived on
`prototype/progress-logo`; the destination backgrounds are the new refinement.
No packages or persistence added. Awaiting the user's visual selection.

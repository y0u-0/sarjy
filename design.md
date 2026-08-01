# Sarjy Design System: "Data Playground"

A design language distilled from the look-and-feel of nvg8.io (Navigate) and tailored to a SQL-learning product: serious data tooling wrapped in a warm, playful, sticker-like shell. The thesis: **databases feel intimidating; the UI should feel like a toy you can't break** (which is literally true here, since the sandbox resets every run).

## 1. Core vibe

- **Dual canvas.** Two worlds, both first-class: warm **cream** for marketing/landing moments, near-black **ink** for the focused workspace. Never pure white, never pure black.
- **Sticker construction.** Colored surfaces get a thin 1px ink outline, like die-cut stickers on a notebook. Flat fills only: no gradients, no glassmorphism, no glow.
- **Confident type.** One heavy grotesk doing the shouting in sentence case, tiny bold uppercase labels doing the organizing, a mono carrying all data (SQL, results, schema).
- **Pills act, tiles decorate.** Anything clickable is a full pill. Decorative identity comes from chunky one-color glyph tiles (square / circle / arrow-clipped shapes).
- **Motion that snaps.** Fast ease-out everything. Elements arrive settled; hovers lift; nothing floats aimlessly. The only "alive" element is the voice orb.

## 2. Tokens

### Color (raw brand values)

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#141414` | Dark canvas, outlines, text-on-color |
| `--ink-soft` | `#1d1d1d` | Raised dark panels (cards on ink) |
| `--cream` | `#fdf9f0` | Light canvas, text-on-ink |
| `--lime` | `#c7ff69` | Primary actions, success, "go" |
| `--lime-soft` | `#e3ffb3` | Success tint surfaces |
| `--tangerine` | `#ff6d38` | Errors, destructive, the orb's pulse |
| `--periwinkle` | `#7a78ff` | Teacher/voice identity, info |
| `--amber` | `#ffc216` | Highlights, in-progress, decorative tiles |
| `--sky` | `#4d9fff` | Decorative tiles, secondary info |

Rules:
- Text on any colored fill is always `--ink`. Text on ink is `--cream` (90% opacity for body, 55% for muted).
- Lime = action & correctness. Tangerine = failure & heat. Periwinkle = Sarjy (the teacher). Never swap these meanings.
- Colored fills always carry `border: 1px solid var(--ink)` on cream, or `border: 1px solid` 12% cream on ink.

### Type

| Role | Font | Usage |
| --- | --- | --- |
| Display | **Archivo** (variable, weight 600–900) | Hero headlines (clamp 2.5–5.5rem, line-height 0.95, tracking -0.02em), page titles, big numbers |
| Body / UI | **Archivo** (weight 400–600) | Everything interactive and explanatory |
| Labels | Archivo 700, 11–12px, uppercase, tracking +0.08em | Section headers, table headers, nav groups |
| Data | **JetBrains Mono** (400/600) | SQL editor, results tables, schema, error messages |

Sentence case everywhere except labels. Headlines end with a period when they're a full sentence.

### Shape

- Radius scale: pills `9999px` (all buttons, inputs, chips), panels `16px`, tiles/cards `20–24px`, hero tiles `28px`.
- The workspace keeps panels at `16px`; nothing inside the app is sharp-cornered anymore.
- Decorative tiles alternate silhouettes: rounded-square, circle, and "tag" (one side clipped to a point via `clip-path`).

### Motion

- Easing: `--ease-snap: cubic-bezier(0.22, 1, 0.36, 1)`. Everything uses it; 300ms is the house duration.
- **Hover grammar never moves the element.** Inside the app, hovers are quiet fill shifts (colored pills dim to 85%, transparent pills fill 10% foreground); press is a 0.97 squish. The signature **lime-flood + radius morph** (capsule floods lime and corners relax to ~12-16px over 300ms) is reserved for the **landing page only**; apply it there with explicit `hover:rounded-xl hover:bg-lime hover:text-ink` classes.
- **Press grammar is squish.** Active state scales to 0.97 (icon buttons 0.95), like pressing a soft button.
- Text links underline-slide: a 1px underline scales in from the left on hover (`scaleX 0→1`, origin left).
- Entrances: fade + 12px rise, no scale-from-zero except the grade banner (scale 0.97→1, it should "stamp" in).
- The orb is the only continuously-animated element. Everything else rests.
- `prefers-reduced-motion`: all transforms reduce to opacity fades.

## 3. Component recipes

- **Primary button:** lime pill, ink text (600), 1px ink border; hover floods to cream (ink text stays), press squishes to 0.97. Icon optional, 16px.
- **Secondary button:** transparent pill, 1px border; hover inverts: fills with the canvas's opposite color and flips text (cream↔ink).
- **Destructive:** tangerine pill, ink text, same construction as primary.
- **Pill nav (sidebar items):** transparent pills; active = cream-on-ink inverted chip (lime check icon when done).
- **Cards/panels:** `--ink-soft` on ink (or cream on cream-canvas with ink border), radius 16px, padding 16px, label row on top.
- **Inputs:** pill, 1px border, transparent bg, focus ring = 2px lime, no glow.
- **Tables (results):** mono 12px, header row uppercase label style with a colored underline (lime for Goal, cream/30 for Yours), zebra rows at 4% cream, numbers right-aligned... keep left for simplicity, `NULL` italic muted.
- **Grade banner:** sticker: lime-soft fill + ink text + lime border when passed; tangerine-tint when failed; stamps in with scale.
- **Glyph tiles:** 1-color fill + ink glyph, used in hero and empty states. SQL flavored: table, braces, chart, key, join-circles.
- **Marquee strip:** thin ink band with mono SQL keywords scrolling slowly (landing only, pausable, reduced-motion safe).
- **The orb (Sarjy):** a flat periwinkle sticker disc with an ink outline that behaves like a small character. It breathes (gentle 4s scale), blinks on offset cycles, scans side to side while connecting, and grows a three-bar ink equalizer mouth driven by her live speech volume. A lime ring around the disc scales with the student's mic level, so you can see that she hears you. Disconnected: muted disc, closed eyes, flat mouth. DOM and CSS only, no WebGL. Caption bubble stays a cream sticker.
- **Hint card (Sarjy's screen tool):** a sticker that stamps in bottom-left when she calls `show_hint`. Level sets the fill: sky for a nudge, amber for a hint, lime-soft for a solution. Ink text, ink outline, hard offset shadow, level chip + dismiss X in the header. SQL renders in a mono block; for solutions the SQL hides behind an ink "Reveal the answer" pill so seeing the full query is always the student's explicit choice. One card at a time; cleared on exercise change.

## 4. Page treatments

- **Landing:** cream canvas. Giant ink display headline with an inline lime glyph chip, one-line subcopy, lime primary CTA. Below: row of decorative data tiles, three sticker feature cards, SQL-keyword marquee, ink footer band.
- **Login:** ink canvas, centered cream sticker card, pill inputs, lime submit.
- **Workspace (/learn):** ink canvas, three zones: sidebar (pill nav + brand + user), center (prompt sticker, editor panel, run pills, goal/result twin tables), schema rail (mono, quiet). Lime is reserved for Run-adjacent actions and success; the editor panel is the visual anchor.
- **Teacher dock:** orb + cream caption sticker; transcript panel is an ink-soft card with pill input.

## 5. Don'ts

- No gradients, no blur/glass, no neon glows, no pure #000/#fff.
- No gray-on-gray: if a surface needs separation, give it the outline, not a shadow blur.
- Don't use lime for anything that isn't actionable or correct.
- Don't animate layout (width/height); transform/opacity only.
- Don't add a top header bar; navigation lives in the sidebar and the page itself.

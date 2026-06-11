# Design Doctrine

> This is the living design language for Timekeep. Engineering constraints live in CLAUDE_DOCTRINE.md. This document governs how the product feels, behaves, and expresses itself.

---

## Identity

**Timekeep is a precision instrument for people whose time is their livelihood.**

Not an app. Not a dashboard. A clock — the thing humans have historically charged with measuring the most valuable resource they possess.

That identity governs every visual and interaction decision. A precision instrument does not decorate itself. It does not apologize. It does not require explanation. It is what it is, and it behaves accordingly.

---

## Dual Emotional Registers

This product serves two entirely different contexts. They must feel different.

### Employee — personal time

The employee is giving their time to someone else. The clock-in moment is a contract being entered. The elapsed timer is that contract being honored. The clock-out is its conclusion.

The employee interface is **intimate and honest**. It acknowledges the weight of what's happening — this person is at work — without being heavy-handed. The on-shift dark state is not decorative; it communicates: you are committed to this moment.

Where the employee register is calm: upcoming shifts, schedule view, off-shift state.
Where it applies weight: the on-shift dark state, clock-out (consequential action, holds before firing).

### Admin — operational authority

The manager needs to know three things instantly: who's here, is anyone missing, who's coming. The admin interface delivers this **without decoration, without reassurance, without noise**.

The admin register is **direct and confident**. It knows what it is. It does not soften information that should be sharp. A late employee is not a styled card; it is an interruption.

Where the admin register is calm: schedule grid, time entries, employee list, templates.
Where it applies force: the dashboard status number (commands the viewport), the late section (visual interruption, not a card), overtime states.

---

## Calm Until Force Is Required

This is the governing principle. The product is calm by default. When force is required, it arrives without apology and departs without explanation.

**Force is required:**
- Late employees on the admin dashboard. They interrupt the layout's normal card pattern — ruled border, no card container, compressed rows.
- Clock-out on the employee interface. The most consequential action in the employee experience. Hold-to-confirm adds physical weight without being bureaucratic.
- Overtime states. Amber replaces black. The progress bar turns amber. The elapsed time turns amber.
- Missed clock-out. The amber state uses the same layout bones as the normal state — the disruption is in the color, not the structure.

**Force is never required:**
- Loading states. These are procedural.
- Schedule grid data. The grid is a neutral instrument.
- List rows in time entries. Historical record.
- Upcoming shift view. Anticipatory, not urgent.

**The litmus test:** Would removing the visual weight make the admin miss something they need to act on? If yes, the weight is earned. If no, it is decoration.

---

## Spatial System

Four planes. Use all four. Never add a fifth.

- **Ground** (`#f7f5f2`) — the base environment. The warm cream that sets the thermal quality of the whole product.
- **Surface** (`#fffefb`, `#faf8f5`) — primary content areas and cards. Where work happens.
- **Elevated** — modals, bottom sheets, contextual overlays. These must animate as ascent: scale up, shadow expands, backdrop dims.
- **Urgent** — missed clock-out state, critical error banners. Closest to the user. Does not ease in; it arrives.

Depth must be honest. A shadow is a spatial claim. An elevated element casts a shadow proportional to its elevation. Elements without elevation do not cast shadows. Frosted glass is used only where what lies behind it is spatially meaningful — the nav bar is frosted because it floats above two different backgrounds simultaneously. That is a spatial truth, not an aesthetic.

---

## Motion Language

Motion encodes spatial relationship and emotional weight. It is not polish applied after layout decisions are made.

**Page transitions:**
`animate-page-in` (opacity + translateY from bottom) communicates arrival. Peer navigation between sections can eventually be directional (horizontal). For now, the vertical fade communicates that the page is loading into view from below — arriving, not swapping.

**Modal entrance:**
Sheets rise from bottom (`animate-sheet-up`). Desktop modals float in (`animate-float-in`). Both communicate that these elements occupy a different spatial plane.

**The clock-in moment:**
`animate-clock-in` — the most authored animation in the product. Scale and opacity arrive together on a long expo-out curve. This communicates weight. Nothing else in the product gets this much duration.

**List reveals:**
`stagger-fast` on card containers — rows reveal sequentially at 40ms intervals. Used only on lists that have genuine reading order (on-shift, upcoming). Never used on static administrative lists.

**The hold mechanic:**
The clock-out button fills left-to-right over 700ms on pointer hold. This is consequential friction — not bureaucracy, not obstruction. It communicates: this matters. Consider it. On cancel, the fill retreats in 200ms.

**What motion is never used for:**
- Hover effects that communicate nothing (hover scale on cards is decoration)
- Transitions that delay interaction
- Entrance animations on content the user has already seen
- Background motion that competes with foreground content

---

## Typography System

**Two typefaces. No third.**

- **Inter** — names, labels, actions, copy, all prose. The default.
- **JetBrains Mono** — all time values, all durations, all numeric metrics. Applied via `.font-mono`. Carries the semantic register of precision: this is a measured value, not an estimate.

**Where Mono belongs:**
Clock times, elapsed durations, shift ranges, progress metrics, date numbers, countdowns.

**Where Mono does not belong:**
Names, labels, section headers, action text, error messages, descriptions.

**Scale:**
- Display: `clamp(4rem, 16vw, 5.5rem)` — status number on admin dashboard, elapsed timer on employee clock
- Large: `text-3xl font-semibold tracking-tight` — primary page headings
- Body: `text-sm` / `text-base` — row content
- Label: `text-[10px] uppercase tracking-widest font-semibold` — section indicators, used sparingly
- Micro: `text-xs` — secondary row content, times

**Weight as authority:**
The admin dashboard status number uses `font-extrabold` in mono. This is the only place in the product that uses this weight. It commands the viewport before the user reads it. The word "on shift" beside it is `text-lg font-normal` — it describes the number, it does not compete with it. This contrast is the point.

**Tracking:**
- `tracking-tight` — all headings
- `tracking-[-0.01em]` — all body text, labels, actions (the standard)
- `tracking-widest` — section indicator labels in uppercase only
- Never `tracking-wide` or `tracking-wider` — these are generic defaults, not authored choices

---

## Color and Thermal Quality

The product runs warm. This is a deliberate thermal choice — not a color preference.

- Ground: `#f7f5f2` — warm cream, slightly tan
- Surface: `#fffefb` — near-white with warmth
- Ink: `#0d0c0b` — near-black with warmth, never pure #000
- Dark surface: `#141210` — the on-shift state. Deep, warm near-black.

**Semantic colors — fixed, never adjusted for identity:**
- Success/active: `green-500` pulse dot
- Warning/late: `amber-400` / `amber-500` — late state, overtime, missed clock-out
- Danger: `red-500` — error messages only

**The late section uses amber as structural language**, not just color. The left border rule in `border-amber-400` creates a non-card pattern that interrupts the normal card rhythm. This is structural authority, not decoration.

---

## Interaction Physics

**Buttons:**
Primary action buttons (`bg-[#141210]`) use `active:scale-[0.97]` — a decisive depression, not a subtle shift. The 3% scale communicates that something is being pressed.

**The clock-out hold:**
700ms fill, 16ms tick interval (60fps), 200ms ease-out on cancel. These numbers are not arbitrary — 700ms is long enough to feel intentional without feeling punitive. Under 500ms and the hold feels accidental. Over 1000ms and it feels bureaucratic.

**Modals:**
Sheet-up on mobile: `320ms cubic-bezier(0.32, 0.72, 0, 1)` — this is close to `ease-out` but with a slightly sharper initial velocity. It feels physical.
Float-in on desktop: `280ms cubic-bezier(0.16, 1, 0.3, 1)` — expo-out, snaps into place.

**Spring easing** (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — reserved for elements where slight overshoot communicates liveness. Used on `animate-scale-in`. Not used on buttons (buttons are switches, not organic objects).

---

## The ClockInterface as Anchor

The employee ClockInterface is the product's canonical moment. It is the surface that everything else in the product serves.

It must remain:
- Full-screen — it occupies the entire device
- State-machine driven — dark (on-shift), light (off-shift/upcoming), amber (missed)
- Emotionally distinct between states — these are not the same page in different colors
- The only surface in the product where the background is not `#f7f5f2`

When in doubt about an employee-facing design decision, ask: does this support or undermine the integrity of the ClockInterface? If it distracts from, softens, or over-explains what the ClockInterface communicates, it should be removed.

---

## What This Product Refuses

**Frosted glass as a default surface.** The nav bar is frosted because it sits above two different backgrounds. Nothing else uses frosted glass.

**Section labels everywhere.** `text-[10px] uppercase tracking-widest` is reserved for category indicators where the reader needs to understand what category of thing they're looking at. Used on every list, it becomes noise. The admin dashboard's on-shift list drops its label when the large status number already provides the context.

**Rounded corners on everything.** `rounded-2xl` is the default for cards and inputs. The late section on the admin dashboard uses no card and no rounded container — the ruled amber border is the container. Structural variety communicates structural difference.

**Equal visual weight for unequal information.** A late employee and an on-shift employee are not in the same category of event. Their visual treatments must differ in structure, not just color.

**Warmth where gravity is required.** The missed clock-out state uses amber. The late section uses amber and a ruled border. These are not softened with friendly copy or gentle rounded containers. They are what they are.

---

## Divergences from Root Doctrine

The root doctrine applies universally. Timekeep diverges from it in specific ways:

**Lower spatial drama.** This is an operational tool, not a creative product. The root doctrine's language about "cinematic behavior" and "held tension" applies selectively here. Reserve spatial drama for: the status number on the admin dashboard, the ClockInterface state transitions, and destructive action confirms. The schedule grid, time entries, and template pages are calm instruments — spatial drama here would be noise.

**No ambient motion.** The root doctrine describes ambient systems that breathe. This product has no ambient motion and should not acquire it. The only live motion is the elapsed timer and the countdown — both are data, not atmosphere.

**Restraint over experimentation.** The root doctrine encourages one experimental moment per context. This product uses restraint more aggressively. The hold mechanic on clock-out is the product's one authored interaction innovation. One is correct here. More would be character tourism.

**The product does not perform.** The root doctrine warns against "assembled instead of authored." The risk in this product is the opposite — performing authorship while the underlying interactions remain generic. Every authored moment must earn its existence through operational utility, not aesthetic ambition.

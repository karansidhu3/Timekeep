# TimeKeep — Visual Systems Audit & Design Language

**Phase 1: Audit → Phase 2: Design System → Phase 3: References → Phase 4: Implementation**

This document is written after reading every component, page, and layout file in the codebase. Nothing here is theoretical.

---

## PHASE 1 — COMPLETE VISUAL AUDIT

---

### Typography

**Current state:**

The font stack is `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`. On Apple devices this renders in San Francisco, which is genuinely good — it's the right typeface for an operational mobile tool. On other platforms it falls to Segoe UI or generic system-ui, producing an inconsistent experience.

The type scale is ad-hoc Tailwind steps, not a designed system. Sizes in use across the product: `text-[10px]`, `text-xs` (12px), `text-[11px]`, `text-sm` (14px), `text-[15px]`, `text-base` (16px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px). Nine different sizes with no defined hierarchy. Some are Tailwind tokens, two are arbitrary pixel values.

**What's genuinely strong:**

The ShiftCard time hierarchy is the best typography in the product. `text-3xl font-semibold tracking-tight` for the start time, `text-xl font-medium text-stone-400` for "until {end}". This is editorial. The size differential communicates importance without explanation. Preserve this completely.

The eyebrow label pattern (`text-xs font-semibold uppercase tracking-widest`) used for "TODAY'S SHIFT", "Staff", "Shifts", "Active" creates a strong labeling system. The uppercase + widest tracking reads as system language, not body copy. This is correct.

**What's wrong:**

`tracking-widest` and `tracking-wide` are used interchangeably. "TODAY'S SHIFT" uses `tracking-widest`. The stat card labels use `tracking-wide`. These eyebrow labels are the same element performing the same function — they must have the same tracking. Currently they don't.

There is no defined display size. `text-3xl` (30px) is the maximum. For the clock-in active state — the single most operationally significant state in the product — the employee sees a green box with `text-sm font-medium` text. The most important state has the smallest typographic weight. This is inverted hierarchy.

The wordmark ("Timekeep") is `text-xl font-semibold`. Identical weight to the employee dashboard h1 ("Hi, Marcus"). The brand has no visual authority over the content. On the login page this matters most — the product announces itself at exactly the same scale as a page heading.

The admin dashboard heading is `text-2xl`. The employee heading is `text-xl`. Inconsistent without justification.

---

### Spacing

**Current state:**

Page containers: employee uses `px-4`, admin uses `px-6`. Page tops use `pt-page` (correct, safe-area aware). Bottom padding is inconsistent: `pb-6`, `pb-10`, `pb-nav`.

Card internal padding: `p-4` and `p-5` both in use. The stat cards use `p-4`. The ShiftCard uses `p-5`. They're different elements, but the inconsistency compounds — it suggests the spacing wasn't designed from a grid.

Vertical rhythm: section headers have `mb-6` or `mb-8` depending on the page. The gap between the header and the first content element varies without an apparent rule.

**What's wrong:**

There is no spacing scale. The product uses Tailwind's raw values (p-3, p-4, p-5, p-6, gap-1, gap-2, gap-3, gap-4) without a defined system. This means every spacing decision was made independently. The result is visually functional but not rhythmically coherent — nothing feels measured against a common unit.

The admin schedule page header is particularly crowded. Two rows, six interactive elements. On first row: h1 + "+ New shift" button. On second row: date range text + "Templates →" link + "Apply template" button + week nav (two arrows + optional "This week" button). That's a lot of affordances competing in a tight space.

---

### Layout Rhythm

**Employee side:** `max-w-lg` (512px) container. Works well for mobile. The single-column card stack (ShiftCard → ClockInButton) is clean and proportional. Nothing to fix here.

**Admin side:** `max-w-3xl` (768px) for dashboard and employees, `max-w-4xl` (896px) for schedule. This is reasonable. The sidebar is 56 (224px), main content gets the rest. On large screens the content area can feel wide relative to the card density.

**Inconsistency:** The `ml-0 md:ml-56` on the admin `<main>` element directly offsets for the 56-unit sidebar. This is functional but brittle — if the sidebar width changes, two values need updating. Minor.

---

### Color System

**What's genuinely strong:**

`#faf9f7` for the page background is correct and should never change. It's warm without being tinted, neutral without being clinical. The `#1a1917` foreground pairs with it perfectly — warm near-black with slight brown undertone.

The stone palette throughout is unified. The product doesn't use blue, purple, orange, or any chromatic color outside of semantic states. This is discipline.

Semantic colors are correct: green for active/success, amber for warning/missed, red for errors/danger. The amber missed-clock-out state (`bg-amber-50 border-amber-200`) is well-executed — it communicates urgency without alarm.

**What's wrong:**

Cards are `bg-white` (#ffffff) against the `#faf9f7` background. Pure white is the one surface that breaks the warmth. The contrast between card and page is correct for hierarchy, but the white card is slightly clinical — it reads as a default, not a considered choice. The difference between `#ffffff` and `#fffefb` is imperceptible to conscious inspection but registers subconsciously as warmer.

The clocked-in status indicator is `bg-green-50 border-green-200`. This is the right semantic color, but `green-50` is extremely pale — barely distinguishable from white at a glance. The operational state "I am currently on shift" should be visually commanding, not pastel.

There is no mid-tone. The text scale jumps from `stone-500` (muted) to `stone-400` (dim) to `stone-300` (near-invisible). `stone-300` is used for the arrow chevrons in the template manager and as text in "→" separators. On `#faf9f7`, stone-300 is borderline inaccessible at small sizes.

---

### Surfaces & Cards

**What's genuinely strong:**

The card component is appropriately restrained: `rounded-2xl border border-stone-200 shadow-sm`. No gradient, no blur, no aggressive drop shadow. The `rounded-2xl` (16px) radius gives the cards warmth without feeling toy-like.

The division between card variants is clean: white cards for content, green-tinted rows for active time entries, amber for warnings.

**What's wrong:**

There is only one surface elevation: the card. Everything is either page background or card. No intermediate elevation for hover states, no elevated elevation for focused elements. The product lives entirely in flat 2D. For an editorial operational aesthetic, a subtle depth hierarchy communicates that different elements have different weights.

The `shadow-sm` is correct for the default but the shadow color is neutral dark. Tailwind's default `shadow-sm` is `0 1px 2px rgb(0 0 0 / 0.05)`. A warm-tinted shadow — `0 1px 2px rgba(28, 24, 20, 0.06)` — aligns the elevation system with the product's chromatic language.

Card borders at `border-stone-200` (a fairly visible mid-grey) against the warm background feel slightly hard. The border is doing visibility work that a very subtle warm shadow could do with less visual weight.

---

### Borders

Three border weights are in use:

- `border-stone-200` — card outlines, input fields, modal backgrounds
- `border-stone-100` — dividers within cards, nav borders, table rows
- `border-stone-50` — time entry table row separators

The inconsistency: the bottom nav uses `border-t border-stone-100` while the sidebar uses `border-r border-stone-200`. These are both navigational chrome — they should use the same border weight.

The table `<th>` uses `border-b border-stone-100`. The rows use `border-b border-stone-50`. The last row has `last:border-0`. The border hierarchy within the table is thoughtful but uses three different values. One divider weight should serve all internal table structure.

---

### Motion

**What's genuinely strong:**

The modal animation system is the best part of the product's motion language. `sheet-up` at 240ms with `cubic-bezier(0.32, 0.72, 0, 1)` is a fast deceleration curve — identical to the iOS sheet presentation curve. This is not an approximation; it's correct. It feels native.

`animate-float-in` for desktop (160ms ease-out with 8px vertical lift) is appropriate for a smaller desktop modal context.

`active:scale-[0.97]` on buttons is correct. The scale depress communicates physicality without exaggeration. `active:scale-[0.93]` on the PIN keypad is appropriately stronger feedback for a more distinct tapping surface.

The PIN dot `scale-110` on fill is a subtle acknowledgment of state that most users won't consciously notice but will feel.

**What's wrong:**

There are no page transitions. Navigation between routes is an immediate hard swap. For a mobile-first product with a strong bottom-nav interaction model, route changes should have an entrance animation — even a 120ms fade-in on the page content would be enough. Currently, the sheet-up modal animation is more sophisticated than the page navigation it exists within.

The `animate-sheet-up` animation is applied in `TemplateManager`'s DayModal but the backdrop `animate-fade-in` is missing from the DayModal — it was added to other modals during the polish pass but this one retains `bg-black/30` without `animate-fade-in`. The backdrop appears without transition.

List items have no entrance animation. On a phone, when the schedule page loads, all seven day rows appear simultaneously as a static block. Even a 20ms stagger per row would give the list a sense of arrival rather than assembly.

The green pulse dot on the clocked-in state (`animate-pulse`) is the only ambient motion in the product. It's doing too much work. The pulse is the sole indicator of "something is happening right now." It's effective but isolated.

---

### Hierarchy & Information Density

**Employee dashboard:** Excellent. "Hi, Marcus" → date → shift card → clock-in. Four elements, clear priority. The greeting establishes context, the date orients, the shift card provides the operational information, the button provides the action. This is the right sequence.

**Admin dashboard stat cards:** Three identical white cards with an uppercase label and a large number. The numbers are `text-3xl font-semibold` — appropriately large. But the semantic difference between "Staff" (a count of people), "Shifts" (today's shift count), and "Active" (currently clocked-in) is not communicated visually. All three look the same. "Active" should feel more alive — it's a real-time count of people working right now, not just a number.

**Admin schedule page:** The content is well-organized (day-grouped shifts, clear edit affordances) but the header toolbar area has too many competing elements. The problem is that schedule management has multiple modes: viewing, creating shifts, applying templates, and navigating weeks. These have been compressed into a two-row header without hierarchy among them.

**Employee schedule:** The week-at-a-glance list is clean and readable. Today's highlight (`bg-white -mx-4 px-4 rounded-xl`) is a smart solution — uses a card-like treatment inline within the divider list to visually anchor the present. Keep this pattern.

**Time entries table:** The desktop table is correctly structured. Column order (Employee → Clock in → Clock out → Duration → Edit) follows reading priority. The mobile card view is functional but the layout is slightly compressed — the arrow separator (`→`) between clock-in and clock-out is stone-300, near-invisible.

---

### Interaction Feedback

**What's missing that costs perceived quality:**

1. **No hover state on Card when used as a clickable container.** The shift list on admin schedule uses `<Card>` with an `Edit` link. The entire card area is conceptually editable but only the "Edit" text responds on hover. The card should have a subtle hover treatment when it contains an edit affordance.

2. **No feedback on list row tap in name selector.** The employee name list uses `active:bg-stone-50` — a very faint state change. For the first and most important interaction in the product (selecting your name), the feedback should be more confident.

3. **No loading skeleton.** When the page loads, content appears immediately (server-rendered). This is good. But on navigation, there's a brief moment between route change and content appearing that shows either a blank space or old content. No skeleton placeholder exists.

4. **Pending states replace text only.** When `isPending` is true, button text changes to "Saving…" or "Creating…" but there's no spinner, progress indicator, or visual change beyond the text. The button just sits there with different text. A subtle spinner or pulse would communicate that something is happening.

5. **Sign out has no confirmation, no feedback.** Tapping sign out in the bottom nav initiates `startTransition(() => signOut())` and the button text goes to "…". For an action that exits the app session, some micro-confirmation (even just a very brief fade) would feel more intentional.

---

### Consistency Issues

**Naming inconsistency between mobile and desktop admin nav:**
- Mobile: "Home", "Schedule", "People", "Time"
- Desktop sidebar: "Dashboard", "Schedule", "Templates", "Employees", "Time entries"

"Templates" doesn't appear in the mobile nav at all. "People" vs "Employees" is the same concept with different names. "Time" vs "Time entries" is truncation vs the full name. These should be consistent, with the full names preferred.

**Button sizing inconsistency:**
The "+ New shift" and "+ New employee" buttons use `size="sm" variant="secondary"`. These are the primary creation actions on their respective pages. They should probably be more visually prominent — currently they compete with the page heading instead of being clearly secondary to it.

**The "Edit" affordance:**
Throughout the admin — schedule shifts, employees list, time entries — the edit action is a small `text-sm text-stone-400` text link. This is appropriately de-emphasized (the content, not the edit, should dominate). But the target area using `px-3 py-3 rounded-xl` is a large touch target wrapped around a small visual. This creates an invisible interaction zone. The visual weight and the touch zone are decoupled.

**Close button pattern in modals:**
Three modals (TimeEntryModal, TemplateManager DayModal) have an explicit close button (X icon). NewShiftButton and NewEmployeeButton don't — they only have a Cancel button. Inconsistent modal chrome.

---

### What Should Be Preserved (Hard Constraints for Any Redesign)

1. `#faf9f7` background — do not change
2. The stone palette — do not introduce any new accent or chromatic color
3. The ShiftCard time hierarchy (3xl → xl) — the best visual moment in the product
4. The modal animation system (sheet-up, float-in, fade-in) — keep the exact curves
5. `active:scale-[0.97]` button feedback — keep
6. The PIN keypad interaction (auto-submit on 4th digit) — keep
7. The bottom-sheet pattern (modal anchored to viewport bottom on mobile) — keep
8. `touch-action: manipulation` global — keep
9. Safe area inset handling — keep
10. The weekly schedule divider list pattern — keep
11. The semantic color usage (green/amber/red) — keep meanings, can refine shades

---

### What Should Evolve

1. **Font:** Load Inter explicitly via `next/font/google`. System fonts are inconsistent across Android — a product with this level of care deserves consistent typography. SF Pro on iOS, Inter everywhere else.
2. **Card surface:** `bg-white` → `bg-[#fffefb]`. Imperceptible individually, coherent systematically.
3. **Wordmark:** Larger, more intentional. Currently the product name competes with page headings. It should read as identity, not content.
4. **Clocked-in state:** Deserves much more visual mass. The most important operational state in the product is currently a pastel box.
5. **Spacing:** Codify into a 4/8/12/16/24/32/48px system. Apply consistently.
6. **Eyebrow labels:** Unified tracking. Pick `tracking-widest` and apply everywhere.
7. **Shadows:** Warm-tinted shadow values.
8. **Stat cards:** More editorial — the three-box admin overview needs character.
9. **Admin schedule header:** Simplify. Move week navigation to a more natural position.
10. **TemplateManager DayModal:** Missing `animate-fade-in` on backdrop.

### What Should Be Removed

1. **Sign out in primary navigation.** Sign out is not a navigation destination. It belongs in a settings area or behind a long-press/secondary gesture. Currently it shares navigation real estate equally with Today and Schedule.
2. **"Admin →" link on employee dashboard.** The mechanism is fine but the styling (`text-xs font-medium text-stone-500`) is too casual. Admins should have a cleaner path between their roles.
3. **`stone-300` for visible UI text.** It's too light on `#faf9f7` for anything that carries meaning. Replace with `stone-400` minimum.
4. **The `text-[11px]` and `text-[15px]` arbitrary pixel sizes.** These bypass the type scale and should be replaced with the nearest defined scale token.
5. **The placeholder `"••••"` in the PIN input.** This will render as literal bullet characters. The input doesn't need a placeholder — the label says "4-digit PIN" and the context is clear.

---

## PHASE 2 — UNIFIED DESIGN LANGUAGE

---

### Typography Stack

**Primary font:** Inter (via `next/font/google`, with `subsets: ['latin']` and `display: 'swap'`)  
**Fallback:** `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`

On iOS, `-apple-system` will take priority over Inter due to browser font matching behavior for system fonts. This is acceptable — SF Pro on Apple, Inter everywhere else. Both are optically similar. The fallback chain means no rendering flash.

**Type scale:**

| Token | Size | Leading | Tracking | Usage |
|-------|------|---------|---------|-------|
| `label-xs` | 10px | — | `tracking-widest` | Eyebrow labels only (TODAY'S SHIFT, Staff, etc.) |
| `label-sm` | 11px | — | `tracking-wide` | Table headers, secondary metadata |
| `body-sm` | 13px | 1.5rem | normal | Secondary text, timestamps, captions |
| `body` | 15px | 1.625rem | normal | Primary list content, form labels |
| `body-md` | 16px | 1.75rem | normal | Modal titles, card primary text |
| `heading-sm` | 20px | 1.75rem | -0.01em | Page subheadings, large card values |
| `heading` | 24px | 1.75rem | -0.02em | Page h1 headings |
| `display-sm` | 30px | 1 | -0.03em | Primary value display (shift start time) |
| `display` | 40px | 1 | -0.04em | Hero state (clocked-in timer) |

**Weight conventions:**
- Regular (400): body copy, secondary text
- Medium (500): list items, form labels
- Semibold (600): page headings, card primary text, stat numbers
- Bold (700): eyebrow labels only when uppercase

---

### Spacing Scale

All spacing in the product should come from this scale. Nothing else.

| Token | Value | Usage |
|-------|-------|-------|
| `sp-1` | 4px | Icon gaps, tight element spacing |
| `sp-2` | 8px | Within-component gaps |
| `sp-3` | 12px | Form field gaps, label-to-input |
| `sp-4` | 16px | Card internal padding, small section gaps |
| `sp-5` | 20px | Default card padding |
| `sp-6` | 24px | Section gaps, header bottom margins |
| `sp-8` | 32px | Major section separations |
| `sp-12` | 48px | Page top padding (below pt-page) |

Page horizontal padding: `px-4` (16px) on mobile, `px-6` (24px) on wider screens. Do not change these — they're already correct.

---

### Radius Philosophy

The product uses two radius values and that's correct. Do not add more.

- **`rounded-xl`** (12px): buttons, inputs, select elements, small interactive elements, nav item backgrounds
- **`rounded-2xl`** (16px): cards, modals, status indicators, larger surfaces

Never use `rounded-full` except for: badge elements, the PIN dots, the drag handle pill, the pulsing status dot.

Never use `rounded-3xl` or larger — it reads as playful, not operational.

---

### Surface Hierarchy

Five surfaces, all within the warm neutral range:

| Level | Value | Token | Usage |
|-------|-------|-------|-------|
| 0 | `#faf9f7` | `bg-base` | Page background |
| 1 | `#fffefb` | `bg-surface` | Card surfaces (replaces `bg-white`) |
| 2 | `#ffffff` | `bg-overlay` | Modal backgrounds (can be pure white — they're elevated) |
| 3 | `#f7f6f3` | `bg-sunken` | Input backgrounds on elevated surfaces, table header backgrounds |
| 4 | `#f0ede8` | `bg-muted` | Disabled states, skeleton placeholders |

The warmth decreases as elevation increases. Cards are slightly warm; modals are pure white. This is intentional — elevated elements feel precise, ambient surfaces feel warm.

---

### Shadow Philosophy

One warm-tinted shadow token per elevation level:

```css
--shadow-sm:  0 1px 2px rgba(28, 24, 20, 0.06);
--shadow-md:  0 2px 8px rgba(28, 24, 20, 0.08), 0 1px 2px rgba(28, 24, 20, 0.04);
--shadow-lg:  0 8px 24px rgba(28, 24, 20, 0.10), 0 2px 6px rgba(28, 24, 20, 0.06);
--shadow-xl:  0 16px 40px rgba(28, 24, 20, 0.14), 0 4px 12px rgba(28, 24, 20, 0.08);
```

The shadow color `rgba(28, 24, 20, ...)` is the product's foreground color (`#1a1917`) with fractional opacity. This keeps shadows chromatic with the overall palette rather than neutral-grey.

Card → `shadow-sm`. Hover card → `shadow-md`. Modal → `shadow-xl`.

---

### Color Tokens

```
Background system:
  --color-bg:          #faf9f7   (page)
  --color-surface:     #fffefb   (card)
  --color-overlay:     #ffffff   (modal)
  --color-sunken:      #f7f6f3   (inputs, table bg)
  --color-muted:       #f0ede8   (disabled)

Text system:
  --color-text-1:      #1a1917   (primary — headings, values)
  --color-text-2:      #44403c   (stone-700 — body, labels)
  --color-text-3:      #78716c   (stone-500 — secondary text)
  --color-text-4:      #a8a29e   (stone-400 — captions, timestamps)
  --color-text-5:      #d6d3d1   (stone-300 — placeholder only)

Border system:
  --color-border:      #e7e5e4   (stone-200 — card outlines)
  --color-border-sub:  #f5f5f4   (stone-100 — dividers)

Interactive:
  --color-action:      #1c1917   (primary button bg = stone-900)
  --color-action-hover: #292524  (stone-800)

Semantic (fixed, never adjusted for identity):
  --color-success:     green-600 / green-50 / green-100
  --color-warning:     amber-600 / amber-50 / amber-100
  --color-danger:      red-600 / red-50 / red-100
```

No accent color. Identity comes from typography, spacing, motion, and surface treatment.

---

### Motion Timing

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast` | 100ms | Button press, tap feedback |
| `duration-base` | 150ms | Color transitions, fade-in |
| `duration-moderate` | 240ms | Modal sheet entrance |
| `duration-slow` | 320ms | Page content entrance |

Easing:
- `ease-out` — elements arriving (modals, page content, tooltips)
- `ease-in` — elements leaving (not currently used but reserve)
- `cubic-bezier(0.32, 0.72, 0, 1)` — sheet-up modal only (keep exact iOS curve)
- `linear` — never. Not once.

Spring physics are not available in CSS without a library. The current cubic-bezier approximation is correct. Do not add a spring physics library.

---

### Interaction Language

**Buttons:**
- Primary: `bg-[#1c1917] text-white` (slightly warm, not pure stone-900)
- On hover: `bg-[#292524]` — 1 step lighter
- On press: `scale-[0.97]` simultaneously — the scale must match the color transition, not lag it

**Clickable list rows:**
- Resting: transparent bg
- Hover: `bg-stone-50/80`
- Press: `bg-stone-100/80`
- Transition: 100ms ease-out

**Navigation items:**
- Inactive: `text-stone-400`
- Active: `text-stone-900`
- Never underline, never border, never background fill on desktop sidebar active state — the text weight change from stone-400 to stone-900 is the signal. Background fill (`bg-stone-100`) on active nav items is acceptable for bottom tab bars where target recognition is harder, not for sidebars.

Wait — current sidebar DOES use `bg-stone-100` on active. This is a judgment call. For a sidebar, a subtle active indicator is acceptable. Keep but reduce: `bg-stone-50` instead of `bg-stone-100`.

**Form inputs:**
- Resting border: `border-stone-200`
- Focus ring: `ring-2 ring-stone-900/20` — a warm, lower-opacity ring rather than the current stone-400 ring
- Background: `bg-[#f7f6f3]` (sunken surface) — inputs should feel set into the form, not floating above it

---

### Hover Behavior

On desktop: all interactive surfaces must respond to hover. Currently some do, some don't.

**Required hover states:**
- All `<button>` elements
- All `<Link>` elements acting as navigation
- Shift cards in admin schedule (the entire card should hint that it's interactive)
- Employee rows in the employees list
- Template day rows (already has this — keep)

**Hover should never:**
- Change border color
- Add a drop shadow to a card
- Increase the card's visual elevation dramatically

Hover should only: change background color by one step toward `stone-50`. That's it.

---

### Animation Principles

1. **Structure appears before content.** Skeletons (if added) are the structure. Data is the content.
2. **Arrivals are eased out.** Elements entering the screen decelerate into place.
3. **Departures are not animated.** Removing things happens immediately. Only appearance is animated.
4. **Page content fades in.** 150ms fade-in on `<main>` content after route navigation. Not a slide — a fade.
5. **List items stagger.** If a list has more than 3 items, each item delays by 20ms × its index. Maximum stagger: 80ms (so items 5+ all arrive together). This should be a CSS class only.
6. **Numbers don't animate.** The stat cards count up. Actually — no. Counting animations are decorative complexity. The numbers should appear immediately. Remove the counting animation impulse.

---

### Density Rules

The product serves operational users on mobile. Density should be moderate — readable at a glance, not compressed.

- Minimum tap target: 44px (already enforced — keep)
- List row height: 56px minimum for primary data rows
- Card padding: 20px (sp-5) default
- Form field height: 44px minimum (already enforced — keep)
- Line-height on body copy: 1.625 (generous, for glanceability)

Do not compress to show more data. The product's scope is small enough that density is not an operational requirement. Clarity is.

---

### Icon Treatment

Currently using Heroicons (outlined) throughout. This is correct — a single icon library creates visual coherence.

**Rules:**
- Always 24×24 for navigation icons
- Always 20×20 for inline icons within text or buttons  
- Always 18×18 for close/dismiss icons in modals
- Always 16×16 for micro-indicators
- Stroke weight: 1.5 for inactive states, 2.0 for active states (already implemented in nav components — keep)
- Never filled icons except semantic indicators (the pulse dot is correct as filled)

---

### Empty State Philosophy

Empty states are part of the product's visual identity, not system placeholders.

Current `EmptyState` component: `py-16` centered container, title, description, optional action. This is a structural placeholder. It communicates "nothing here" without communicating "this is what here is for."

Revised philosophy:
- No illustrations (they date quickly and don't fit the operational aesthetic)
- No icons in empty states (this is a design pattern tic, not earned)
- Large, calm type. One sentence only. The description should name the action, not describe the absence.
- "No shifts this week" → "No shifts scheduled. Add one to get started."
- The action button (if present) should be the primary creation action — same button used elsewhere, not a special empty-state-only button.

---

### Chart / Sparkline Philosophy

No charts. The product doesn't have them, shouldn't add them. If summary data visualization is ever needed, use a simple horizontal bar or a number comparison — never a line chart or pie chart.

---

## PHASE 3 — VISUAL REFERENCES

These are references for principle extraction, not copying.

---

**Linear (linear.app)**

What to extract: Typography hierarchy at density. Linear uses Inter at fine-grained weight differentials to communicate hierarchy without size changes. A project name at semibold and an issue status at regular, same size, creates clear hierarchy through weight alone. Also: how Linear uses subtle background fills on hover (their hover is barely detectable, 2-3% lighter/darker, but it registers). Their sidebar nav active state is instructive — it uses a muted fill rather than a highlight color.

What NOT to copy: Linear's extreme density (it's a project management tool, TimeKeep is not). Linear's monochrome dark surface on the sidebar (TimeKeep is warm all the way through).

---

**Stripe Dashboard**

What to extract: The stat card treatment. Stripe's metric cards have a clear figure-ground relationship — the number dominates absolutely, the label is secondary in both size and weight. The number should read before the label. TimeKeep's stat cards approach this but the `text-xs uppercase tracking-wide` labels are visually heavy relative to the numbers.

Also: Stripe's table column headers. Muted, small-caps, low weight. Not competing with the data they label.

What NOT to copy: Stripe's information density (too high for this product). Their color use (TimeKeep has no chromatic accent).

---

**Notion Calendar / Fantastical**

What to extract: How calendar products handle "today" as a visual anchor. The best implementations make today legible at a glance without relying on color alone — they use a combination of text weight, background, and position. TimeKeep's employee schedule already does this (`bg-white -mx-4 px-4 rounded-xl` for today's row) and it's a good instinct. The principle: today is visually anchored, not just highlighted.

---

**Apple Clock / Weather (iOS system apps)**

What to extract: The relationship between a number and its context. In iOS Clock, the time is displayed at a scale that makes everything else feel like support material. The clock IS the screen. In TimeKeep, the shift time should have the same dominance on the employee dashboard. The shift start time is the answer to the employee's question. It should be the biggest thing they see.

Also from Apple system apps: how status is communicated through physical metaphor — the pulse animation on the active clock-in indicator is already doing this correctly.

---

**Read.cv**

What to extract: Restraint in surface treatment. Read.cv uses almost no borders — spatial separation through margin and padding alone. The product feels editorial rather than like a web application. TimeKeep doesn't need to go that far (it's an operational tool, not a portfolio), but the principle of reducing border dependence is relevant. Some of TimeKeep's borders are doing work that spacing could do.

What NOT to copy: Read.cv's very low information density. TimeKeep's schedule view needs to show a week's worth of shifts on one screen — density is required there.

---

**Loom / Campsite (modern operational/creative tools)**

What to extract: How these products handle the active state. When something is actively recording or in progress, the interface communicates it with deliberate visual prominence. Not an alert — a state. The clocked-in indicator in TimeKeep needs more from this category. The `animate-pulse` dot is correct as a metaphor but the surrounding surface needs more weight.

---

## PHASE 4 — IMPLEMENTATION ROADMAP

Ordered by: highest perceived quality increase first. Lowest-effort highest-impact changes before involved work.

---

### Priority 1 — Typography (Highest leverage, ~1 hour)

**Load Inter via `next/font/google` in `app/layout.tsx`.**

```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
```

Apply to `<html>` as `className={inter.variable}`.

Update `globals.css` body font to:
```css
font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

**Establish the type scale as Tailwind config tokens** so all sizes are explicit and named, not raw pixel values.

**Fix `tracking-widest` vs `tracking-wide` inconsistency.** Pick one — `tracking-widest` — and apply to all eyebrow labels.

**Remove `text-[11px]` and `text-[15px]` arbitrary values.**

**Enlarge the wordmark** on both the login page (`text-2xl font-semibold tracking-tight`) and the admin sidebar (`text-sm font-semibold` → same `text-base font-semibold tracking-tight`).

---

### Priority 2 — Clocked-In State Redesign (Highest operational impact, ~1 hour)

The `bg-green-50 border-green-200 rounded-2xl p-4` status card is too quiet for what it represents.

Replace with a stronger visual treatment:
- `bg-green-500/10` (richer green tint than green-50)
- `border-green-500/25` (a green with presence, not pastel)
- Add the employee's clock-in time in large display type (`text-2xl font-semibold`)
- Keep the elapsed timer but make it `text-sm text-green-700`
- The pulse dot stays — correct metaphor

This is the screen the employee sees every time they open the app during a shift. It should feel like the shift is real.

---

### Priority 3 — Surface Warmth (Zero user-facing visible change, 15 minutes)

Change all `bg-white` card surfaces to `bg-[#fffefb]`.

Change all shadow values to the warm-tinted tokens.

This is invisible to users as an explicit perception but registers in aggregate as "something about this feels more considered."

---

### Priority 4 — Sign-Out Relocation (~30 minutes)

Remove sign-out from the primary bottom nav. It currently occupies one-third of the employee nav rail.

Move to: a long-tap on the current user's greeting (`Hi, Marcus`) revealing a small action menu with "Sign out". Or simpler: a small sign-out button in the page header area, visually separated, smaller than the primary content.

The nav should be: Today | Schedule. Two items. Clean.

---

### Priority 5 — Admin Schedule Header Simplification (~45 minutes)

Compress the admin schedule header into a single row where possible. The week navigation (prev/next arrows) should feel adjacent to the date display, not separated from it. The "+ New shift" button and "Apply template" button should have a clear visual hierarchy between them (creation is primary, template application is secondary).

---

### Priority 6 — Component Audit & Spacing Consistency (~2 hours)

Go through every component and enforce the spacing scale. Remove all `p-4`/`p-5` inconsistency — pick one default card padding (`p-5`, 20px) and apply it everywhere unless there's an explicit reason to deviate.

Enforce `border-stone-100` (not 200 or 50) for all internal dividers.
Enforce `border-stone-200` for all card outlines.
Enforce `border-stone-100` for all nav borders.

---

### Priority 7 — Input Focus Ring Refinement (~20 minutes)

Change `focus:ring-stone-400` to `focus:ring-stone-900/20`.

The current focus ring is mid-grey and assertive. A warm dark ring at low opacity is visually sophisticated and still accessible.

---

### Priority 8 — Empty State Redesign (~30 minutes)

Rewrite `EmptyState` component to follow the editorial philosophy: large calm type, minimal, no icon, no decorative element. The title should name the missing content, not describe the absence.

---

### Priority 9 — TemplateManager Backdrop Animation Fix (~5 minutes)

The DayModal backdrop is missing `animate-fade-in`. This is a regression from the polish pass. Add it.

---

### Priority 10 — Page Content Entrance (~30 minutes)

Add `animate-fade-in` (150ms) to the `<main>` content wrapper in both employee and admin layouts.

This gives route navigation the same quality signal as the modal system.

---

### Priority 11 — Stat Card Editorial Treatment (~45 minutes)

The three admin dashboard stat cards are generic. Redesign: remove the `p-4` padding uniformity, make the numbers `text-4xl font-semibold` (up from 3xl), let the label sit below at `text-[10px] uppercase tracking-widest text-stone-400`. The number should dominate the card completely.

Optionally: give the "Active" card a very subtle green tint when the count is > 0. Not green-50 — more like `bg-[#f4faf6]`. A barely-there hint that this number is live.

---

### Final Polish — Reserved for Last

**Stagger animation for list items.** Add `animation-delay: calc(var(--index) * 20ms)` via CSS custom properties on list items. Apply only to the weekly schedule rows and the shift list.

**Hover states on interactive cards.** Add `hover:bg-stone-50/60 transition-colors duration-100` to any `<Card>` that contains an edit affordance.

**Table row hover.** Desktop time entries table rows should have `hover:bg-stone-50/40` to make the edit affordance more discoverable.

---

## Synthesis

The product is well-engineered and visually coherent. The foundation — warm background, stone palette, operational type hierarchy, correct motion system — is sound. What the product lacks is not structural; it lacks finish.

The gap between "functional" and "premium" is almost entirely in the details: a slightly warmer card surface, a better-weighted wordmark, a clocked-in state that commands attention proportional to its importance, a sign-out that doesn't occupy primary navigation, consistent tracking on eyebrow labels.

None of these changes touch the architecture, the animation system, or the operational clarity that already exists. They refine the surface.

The product's best moments — the ShiftCard hierarchy, the modal entrance animation, the PIN auto-submit — are already at the quality level the rest of the product needs to reach. The implementation plan above brings everything else up to that standard.

---

*This audit was conducted by reading every page, component, and style file in the codebase. No assumptions were made from screenshots or descriptions.*

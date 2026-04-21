# Design system — Markets Client Portal

Reference for iterating on this frontend offline (Copilot + Claude Sonnet 4.6). Read this first before touching any UI file.

The goal is a **Linear-ish enterprise look**: calm neutrals, one indigo-violet accent, subtle tinted status pills, no consumer-feel emojis, and a single coherent token system that flips between light and dark.

---

## 1. Architecture at a glance

```
src/
├── index.css                    CSS variables (tokens) — light + dark
├── main.tsx                     Wraps App in <ThemeProvider>
├── lib/
│   └── utils.ts                 cn() — clsx + tailwind-merge
├── components/
│   ├── ui/                      shadcn-style primitives
│   │   ├── button.tsx           CVA: default | destructive | outline | secondary | ghost | link
│   │   ├── card.tsx             Card + CardHeader/Title/Description/Content/Footer
│   │   ├── input.tsx            <input> with focus ring
│   │   ├── alert.tsx            CVA: default | destructive | warning | success | info
│   │   ├── badge.tsx            CVA: default | secondary | destructive | success | warning | outline
│   │   │                        + subtle-default | subtle-primary | subtle-success | subtle-warning | subtle-destructive
│   │   ├── separator.tsx
│   │   ├── theme-provider.tsx   Context + localStorage('icrp-ui-theme') + matchMedia
│   │   └── theme-toggle.tsx     Segmented Sun / Moon / Monitor
│   ├── dashboard/
│   │   └── StatusBadge.tsx      Maps domain status strings to subtle-* Badge variants
│   └── layout/
│       └── MainLayout.tsx       Fixed 240px sidebar + sticky backdrop header
└── pages/
    ├── Dashboard.tsx            Reference page — copy this pattern for new pages
    └── ClientDetail.tsx         Reference multi-tab page
```

**Keep the layering strict.**
- Tokens → primitives → features. Never skip a layer.
- A page should import from `components/ui/*`, not re-implement a button with raw Tailwind.
- If a style appears 3+ times, promote it to a primitive or a utility — don't copy.

---

## 2. Tokens

Defined in `src/index.css` as HSL tuples on `:root` (light) and `.dark` (dark).
Exposed to Tailwind via `hsl(var(--x) / <alpha-value>)` in `tailwind.config.js` — this is what lets `bg-primary/10` produce a tinted variant.

### Neutrals
- `background`, `foreground` — page shell
- `card`, `card-foreground` — content surfaces
- `popover`, `popover-foreground`
- `muted`, `muted-foreground` — hover tints, secondary text
- `accent`, `accent-foreground` — hover emphasis
- `border`, `input`, `ring`

### Accent — indigo-violet (Linear-ish)
- Light: `--primary: 236 65% 62%`
- Dark: `--primary: 236 70% 68%`
- Use `bg-primary`, `text-primary`, `bg-primary/10` for tints, `ring-primary` for focus.

### Status palette
- `success` — green 145° (validated, compliant, completed)
- `warning` — amber 32° (pending, expired, overdue-soft)
- `destructive` — red 358° (rejected, missing, blocked)
- `info` — reuses primary (informational alerts)

Each has a `-foreground` pair for text on solid fills.

### Sidebar (separate namespace)
- `sidebar`, `sidebar-foreground`, `sidebar-border`, `sidebar-accent`, `sidebar-accent-foreground`
- Kept separate so the shell chrome can deviate from the main surface without fighting the rest of the system.

### Radius
- `--radius: 0.5rem` — use `rounded-md` (default), `rounded-lg` for cards.

### Typography
- Inter (system fallback) via `body` font-family in `index.css`
- Size scale: `text-[10px]` eyebrow caps, `text-xs` meta, `text-sm` body, `text-base` card titles, `text-xl` page titles
- Eyebrow caps pattern: `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`

---

## 3. Theming

- `ThemeProvider` (`src/components/ui/theme-provider.tsx`) wraps the app in `main.tsx`.
- Theme state: `'light' | 'dark' | 'system'`, persisted to `localStorage['icrp-ui-theme']`.
- It toggles `class="light"` / `class="dark"` on `documentElement` and listens to `matchMedia('(prefers-color-scheme: dark)')` for live system changes.
- `useTheme()` returns `{ theme, setTheme, resolvedTheme }`. Only `ThemeToggle` should consume it directly — pages read tokens, not the theme value.
- The `ThemeToggle` segmented control lives in the sidebar footer (`MainLayout.tsx`).

**Every color must be a token, not a hardcoded hex.** If you catch yourself typing `#fff` or `bg-blue-500`, stop — use a token or add one.

---

## 4. Component patterns

### Pages
- Wrap content in: `<div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8">`.
- Page title: `text-xl font-semibold tracking-tight text-foreground`.
- Use `<header className="pb-6">…</header>` for the page header block.
- Put primary content in `<Card>` panels, not raw divs.

### Buttons
- Always use `<Button>` from `components/ui/button.tsx`. Default size is `default`; use `size="sm"` for dense toolbars.
- Variants: `default` (primary), `outline` (secondary), `ghost` (tertiary, nav-like), `destructive` (dangerous), `link`, `secondary`.
- Icons: drop a lucide icon inside — the CVA rule `[&_svg]:h-4 [&_svg]:w-4` sizes it automatically.

### Badges and status
- Status pills always use **subtle** variants (`subtle-success`, `subtle-destructive`, etc.) — not solid fills. Solid badges draw too much attention for repeating row elements.
- For domain statuses, route through `StatusBadge` (`components/dashboard/StatusBadge.tsx`) so the mapping is in one place. If you add a new domain state, extend `resolveVariant` there.

### Alerts
- Use `<Alert variant="warning|success|destructive|info">` for inline banners. Each variant has a tinted background + border + left-positioned icon slot.
- Always pair with `<AlertTitle>` and usually `<AlertDescription>`.
- **Never build an alert out of raw divs** — if you need a banner, use this primitive.

### Cards
- `<Card className="p-6">` is the standard panel.
- For dense lists, prefer a single Card with internal `divide-y divide-border` over many small cards.
- Section pattern inside a card:
  ```tsx
  <Card className="p-6">
    <div className="mb-6">
      <h2 className="text-base font-semibold">Title</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Subtitle.</p>
    </div>
    …
  </Card>
  ```

### Tables
- `<table className="w-full text-sm">`.
- Head: `<tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">`.
- Rows: `border-b border-border transition-colors hover:bg-muted/40`. No row striping.
- Expanded rows: use `Fragment` to emit a second `<tr>` per row.

### Inputs
- `<Input className="pl-9" />` with an absolutely-positioned `<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />` for search bars.

### Segmented controls
- Wrap in `inline-flex rounded-md border border-border bg-muted/40 p-0.5`.
- Active button: `bg-background text-foreground shadow-sm`. Inactive: `text-muted-foreground hover:text-foreground`.

### Tabs (page-level)
- Plain `<button>`s over a `border-b border-border` rail.
- Active: `border-primary text-foreground`. Inactive: `border-transparent text-muted-foreground hover:text-foreground`. Applied to `border-b-2`.
- Pair with lucide icons and an optional subtle badge for counts.

### Icons
- `lucide-react` only. No emoji, no SVG assets checked in.
- Default size: `h-4 w-4` (16px). Use `h-3.5 w-3.5` for inline text-adjacent icons.
- Wrap spinners: `<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />`.

### Modals
- Fixed overlay: `fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm`.
- Dialog body: `<Card className="w-[min(92vw,480px)] p-6 shadow-lg">`.
- No trapping-focus library yet; keep modals minimal and dismissable.

---

## 5. Migration rules

When porting legacy pages (anything still using inline `style={{}}`, hex literals, or emojis):

1. **Strip hex literals.** Every `#rrggbb` must map to a token. Common translations:
   - `#d1fae5` / `#f0fdf4` → `bg-success/10`
   - `#065f46` / `#059669` → `text-success`
   - `#fee2e2` / `#fef2f2` → `bg-destructive/10`
   - `#991b1b` / `#dc2626` / `#ef4444` → `text-destructive`
   - `#fef3c7` / `#fffbeb` → `bg-warning/10`
   - `#92400e` / `#f59e0b` → `text-warning`
   - `#dbeafe` / `#eff6ff` → `bg-primary/10`
   - `#1e40af` / `#3b82f6` / `#2563eb` → `text-primary`
   - `#f9fafb` / `#f3f4f6` → `bg-muted/30` or `bg-muted/40`
   - `#6b7280` / `#9ca3af` → `text-muted-foreground`
   - `#374151` / `#111827` → `text-foreground`
   - `#e5e7eb` / `#d1d5db` → `border-border`
   - `white` → `bg-card`
2. **Strip inline styles.** `style={{ padding: 16 }}` → `className="p-4"`. Never pass a `style` object unless the value is runtime-dynamic (progress bar width, risk color from backend).
3. **Strip emojis.** Every emoji becomes a lucide icon. `⚠️` → `<AlertTriangle>`, `✅` → `<CheckCircle2>`, `❌` → `<XCircle>`, `🎯` → `<Target>`, `🔗` → `<Network>`, `📋` → `<ClipboardList>`, `📄`/`📊`/`📚` → `<FileText>`, `⚖️` → `<Scale>`, `💡` → `<Sparkles>` or `<Lightbulb>`, `🏢` → `<Building2>`.
4. **Replace mouse-enter/leave handlers** with Tailwind `hover:` classes.
5. **Replace inline `alert`/`keyframes spin`** with `animate-spin` utility.
6. **Replace bespoke badges** with `<Badge variant="subtle-*">` or `<StatusBadge>`.
7. **Replace bespoke panels** with `<Card>` + internal padding.
8. **Verbatim module syntax** is on — import types with `import type { … }` or `import { type Foo }`.

Reference migrations:
- `src/pages/Dashboard.tsx` — list page with metric tiles, search, segmented filter, expandable table rows, stage timeline.
- `src/pages/ClientDetail.tsx` — multi-tab page with a timeline, alerts, rule-evaluation cards, accordion, and publication panel.

---

## 6. What to avoid

- **Hardcoded colors** — always a token.
- **Inline styles** — only for runtime-dynamic numeric values.
- **Emojis in UI chrome** — lucide icons only.
- **Bubbly gradients, drop shadows, large border-radii** — Linear-style means flat + subtle.
- **Solid success/destructive badges for repeating row status** — use `subtle-*`.
- **One-off CSS files per component** — use Tailwind utilities.
- **`border: 2px solid` or `3px solid`** — default to 1px borders from `--border`.
- **Custom fonts beyond Inter** — the system uses Inter only.
- **New primitives** before checking if an existing one can be extended.
- **Re-introducing the old consumer-feel look** (big colored icon squares, emoji bullets, `rgba(0,0,0,0.1)` shadows).

---

## 7. Accessibility

- Focus states are provided by Button/Input primitives via `focus-visible:ring-2 ring-ring`. Don't strip them.
- Theme toggle uses `role="radiogroup"` and `aria-checked`. Follow that pattern for any other segmented control that changes app state.
- Every interactive `<button>` must have a visible label or `aria-label`.
- Color is never the only signal — always pair a status color with an icon or text.

---

## 8. Copilot / Sonnet 4.6 prompt template

Paste this as the preamble when asking Copilot (or Sonnet 4.6 in a separate session) to modify UI code:

```
You are modifying a React 19 + Vite + Tailwind 3 project with a shadcn-style design system.
Read ./DESIGN_SYSTEM.md before proposing changes. Hard rules:

1. No hardcoded hex colors. Use Tailwind classes that resolve to CSS variables
   defined in src/index.css (bg-primary, text-muted-foreground, bg-success/10, …).
2. No inline style={{}} except for runtime-dynamic numeric values (progress %, etc.).
3. No emojis. Use lucide-react icons.
4. Import UI primitives from src/components/ui/* — Button, Card, Badge, Alert,
   Input, Separator, StatusBadge. Do not re-implement them with raw Tailwind.
5. verbatimModuleSyntax is enabled — use `import type` or inline `type` modifiers
   for type-only imports.
6. For status pills, use Badge with subtle-* variants or the StatusBadge wrapper.
7. Match the spacing / typography patterns in src/pages/Dashboard.tsx and
   src/pages/ClientDetail.tsx. These are the reference pages.
8. Light and dark must both look correct — prefer token-based classes that adapt
   automatically, and sanity-check in both modes.

Before returning code, scan your diff for: hex literals, inline styles, emojis,
raw `<button>` styled with Tailwind instead of <Button>, and `any` where a type
from src/types/index.ts would fit. Fix before responding.
```

---

## 9. When in doubt

- Read `Dashboard.tsx` and copy its structure.
- Grep `src/components/ui/` — the primitive probably exists.
- Grep `index.css` — the token probably exists.
- If you genuinely need a new token or primitive, add it in the appropriate file *and* document it here in the same PR. The doc and the code stay in sync or the system drifts.

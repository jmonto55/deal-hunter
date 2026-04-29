---
name: tailwindcss-v4
description: Tailwind CSS v4 reference for deal-hunter — CSS-first config, the @theme directive, design tokens, custom variants, container queries, and v3→v4 migration tripwires. Use whenever writing Tailwind utilities, defining tokens, or troubleshooting why a v3-style example doesn't work.
---

# Tailwind CSS v4 in deal-hunter

Tailwind v4 is **CSS-first**. There is no `tailwind.config.{ts,js}`, no `content` array, no `tailwindcss` PostCSS plugin, and no `autoprefixer`. All theme configuration lives in CSS via the `@theme` directive, and the engine (Oxide, built on Lightning CSS) does its own content detection and vendor prefixing. The project is already wired up at [apps/web/src/app/globals.css](../../../apps/web/src/app/globals.css) (`@import "tailwindcss";`) with the [@tailwindcss/postcss](../../../apps/web/postcss.config.mjs) plugin and `tailwindcss` ^4.0.0 (resolved 4.2.4) in [apps/web/package.json](../../../apps/web/package.json). **Do not add a `tailwind.config.*` file** — if one appears, delete it.

## When to use this skill

- Defining or extending design tokens (colors, fonts, spacing, radii, shadows, breakpoints, animations).
- Debugging "this utility class doesn't exist" or "this v3 utility doesn't compile."
- Migrating any v3 snippet you found in a tutorial, blog post, or older project.
- Setting up a custom variant (dark mode, theme toggle, data-attribute, custom media).
- Adding container queries.
- Anything where the AI's first instinct is to edit `tailwind.config.ts` — stop and read this skill instead.
- Composing tokens with shadcn/ui's CSS variables.

## v4 mental model

- One CSS file imports Tailwind: `@import "tailwindcss";` (replaces v3's `@tailwind base; @tailwind components; @tailwind utilities;`).
- PostCSS plugin is `@tailwindcss/postcss`. **Not** `tailwindcss`. **Not** `autoprefixer` (v4 prefixes internally). **Not** `postcss-import` (v4 handles `@import` natively).
- The Vite plugin is `@tailwindcss/vite` and the CLI is `@tailwindcss/cli` — but this project is on Next.js, so PostCSS is what matters.
- All theme configuration lives in `@theme { ... }` blocks inside CSS. There is no JS config.
- Content detection is automatic: Tailwind walks the project respecting `.gitignore` and skipping binary extensions. Add explicit sources with `@source "../path/to/lib";` only when something lives outside the workspace (e.g., a sibling npm package's `dist/`).
- Browser support floor: **Safari 16.4+, Chrome 111+, Firefox 128+**. v4 depends on `@property` and `color-mix()`. If you need older browsers, stay on v3.4 (we won't).
- Node ≥ 20 is required (already enforced at the repo root).
- Tailwind v4 does **not** work with Sass/Less/Stylus. Treat Tailwind as the preprocessor.

## The `@theme` directive

`@theme` is the heart of v4. It defines *theme variables* — special CSS custom properties that simultaneously (a) emit `:root` CSS variables and (b) generate matching utility classes.

```css
@import "tailwindcss";

@theme {
  --color-brand: #2D6EF5;
  --color-brand-fg: oklch(0.98 0 0);
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;
  --text-xl: 1.5rem;
  --radius-lg: 0.75rem;
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.08);
  --breakpoint-3xl: 120rem;
}
```

That declaration alone generates: `bg-brand`, `text-brand`, `border-brand`, `ring-brand`, `fill-brand`, `stroke-brand`, `bg-brand-fg`, `font-sans`, `text-xl`, `rounded-lg`, `shadow-card`, the `3xl:` responsive variant, and a corresponding `:root { --color-brand: #2D6EF5; ... }` block usable in custom CSS or inline styles.

### Naming convention → utility mapping

The variable name's namespace prefix determines which utilities are generated. The full list of recognized namespaces:

| Namespace | Utilities/variants generated |
|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*`, `decoration-*`, `outline-*`, `accent-*`, `caret-*`, etc. |
| `--font-*` | `font-sans`, `font-serif`, `font-mono`, `font-<custom>` (font-family) |
| `--text-*` | `text-xs`, `text-base`, `text-xl`, … (font-size) |
| `--font-weight-*` | `font-thin`, `font-bold`, `font-<name>` |
| `--tracking-*` | `tracking-tight`, `tracking-wide`, … (letter-spacing) |
| `--leading-*` | `leading-tight`, `leading-relaxed`, … (line-height) |
| `--breakpoint-*` | Responsive variants (`sm:`, `md:`, `3xl:`, …) |
| `--container-*` | Container-query variants (`@sm:`, `@md:`, …) and `max-w-*` sizes |
| `--spacing-*` | `p-*`, `m-*`, `w-*`, `h-*`, `gap-*`, `top-*`, … (single `--spacing` base also drives the dynamic scale) |
| `--radius-*` | `rounded-*` |
| `--shadow-*` | `shadow-*` |
| `--inset-shadow-*` | `inset-shadow-*` |
| `--drop-shadow-*` | `drop-shadow-*` |
| `--blur-*` | `blur-*`, `backdrop-blur-*` |
| `--perspective-*` | `perspective-*` |
| `--aspect-*` | `aspect-*` |
| `--ease-*` | `ease-*` (transition timing) |
| `--animate-*` | `animate-*` (paired with `@keyframes`, see below) |

When in doubt, check the official docs page — namespaces are stable, but new ones are added.

### Reset / opt-out: `--*: initial`

To strip a namespace and define only your own values (useful for brand-strict projects):

```css
@theme {
  --color-*: initial;        /* drop every default color */
  --color-bg: #0B0F19;
  --color-fg: #F8FAFC;
  --color-brand: #2D6EF5;
}
```

Now `bg-red-500` no longer compiles — only `bg-bg`, `bg-fg`, `bg-brand` exist. Use `--*: initial` (the bare `--*`) inside `@theme` to nuke *every* default at once if you want to start from scratch.

### `@theme` vs `@theme inline`

This is the v4 distinction that trips people up — and it's the one we already rely on in `globals.css`.

- **`@theme { --color-x: <literal> }`** — emits `--color-x` as a `:root` variable and uses `var(--color-x)` inside generated utilities. The variable's *value* is stamped at definition time; if you later swap the variable on `:root` vs `.dark`, the utility still resolves through `var(--color-x)` so it works fine for static literals.
- **`@theme inline { --color-x: var(--something-else) }`** — *inlines* the right-hand value into the generated utility CSS instead of going through a `var()` indirection. Use `inline` whenever the right-hand side is itself a `var(...)` reference that needs to switch based on a class/attribute (e.g., light vs dark theme). Without `inline`, the variable is captured at the `@theme` declaration and won't track later changes to the referenced variable.

Rule of thumb: **literal value → `@theme`; `var(--…)` reference that should change per theme → `@theme inline`.**

### Animations inside `@theme`

`@keyframes` defined inside `@theme` are scoped to the corresponding `--animate-*` variable:

```css
@theme {
  --animate-fade-in: fade-in 0.2s ease-out;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
}
```

Now `animate-fade-in` works in your markup.

### `@theme static`

By default Tailwind only emits CSS variables for theme tokens that are actually referenced by a utility. Use `@theme static { ... }` if you need every variable in the bundle regardless (rare; usually for runtime-driven styles).

## Custom CSS, layers, and utilities

### `@layer base | components | utilities`

```css
@layer base {
  h1 { font-size: var(--text-2xl); }
  body { font-family: var(--font-sans); }
}

@layer components {
  .card {
    background: var(--color-background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    padding: --spacing(6);
  }
}
```

Components can be overridden by utilities (`<div class="card rounded-none">`).

### `@utility` — the v4 way to add a custom utility

In v3 you'd put it inside `@layer utilities`. In v4 use `@utility`:

```css
@utility tab-4 {
  tab-size: 4;
}

@utility scrollbar-hidden {
  &::-webkit-scrollbar { display: none; }
}
```

Functional utilities accept arguments via `--value(...)`:

```css
@utility tab-* {
  tab-size: --value(integer);          /* tab-1, tab-76 */
}

@utility tab-* {
  tab-size: --value([integer]);        /* tab-[12] (arbitrary) */
}

@utility tab-* {
  tab-size: --value(--tab-size-*);     /* reads from @theme tokens */
}
```

Stack multiple `--value` lines to support theme + bare + arbitrary forms simultaneously.

### `@variant` and `@custom-variant`

Apply a Tailwind variant inside custom CSS with `@variant`:

```css
.banner {
  background: var(--color-background);
  @variant dark {
    background: var(--color-foreground);
  }
}
```

Define your own variant with `@custom-variant`:

```css
/* shorthand */
@custom-variant pointer-fine (@media (pointer: fine));
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));

/* longhand with @slot */
@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover { @slot; }
  }
}
```

Note: older docs sometimes write `@variant` for the definition form — in v4 the canonical name is `@custom-variant`. Both forms exist; prefer `@custom-variant` for new code.

### `@apply` and `@reference`

`@apply` still works but is discouraged for utility-only re-aliasing. Use it inside `@layer components` for genuine component classes. In **scoped** stylesheets (Vue `<style scoped>`, Svelte, CSS Modules) you must add `@reference "../path/to/globals.css";` at the top of the scoped block before `@apply` will see your tokens. In Next.js + plain `globals.css` this rarely comes up, but if a CSS Module starts complaining about an unknown utility, this is why.

## Container queries (built-in)

No plugin required in v4 — container queries are first-class.

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4">…</div>
</div>
```

- Mobile-first: `@sm:` applies at the container size and above.
- Max-width form: `@max-md:` applies *below* the size.
- Range: stack them — `@sm:@max-lg:flex-col`.
- Named containers: `<div class="@container/sidebar">` then `@sm/sidebar:hidden` on a descendant.
- Arbitrary sizes: `@min-[475px]:flex-row`, `@max-[960px]:p-2`.
- Add custom sizes with `--container-*` in `@theme` (e.g., `--container-8xl: 96rem`).
- `cqw`/`cqh` units work in arbitrary values: `w-[50cqw]`.

## Dark mode in v4

Default: `prefers-color-scheme`. The `dark:` variant fires when the OS reports dark mode — that's already what `globals.css` is doing today.

To switch to a class-based toggle (required for shadcn/ui or any user-driven theme switcher), add this exact line to `globals.css` once, near the top:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

Now `<html class="dark">` (or `<body class="dark">`) activates every `dark:` utility under that subtree. The `:where()` keeps specificity at zero so utilities still override component styles cleanly.

Data-attribute alternative (some teams prefer this with `next-themes`):

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

To avoid FOUC, run the class toggle synchronously in `<head>` before React hydrates (or use `next-themes`, which handles this).

## v3 → v4 migration tripwires

This is the section that prevents the most damage. A v3 snippet pasted blindly will break in any of these ways:

1. **`tailwind.config.{ts,js}` is gone.** v4 does not auto-detect it. If you genuinely need to load a legacy config, use `@config "../../tailwind.config.js";` in CSS — but for this project, **don't**. There's a one-time migration tool (`npx @tailwindcss/upgrade`) for converting v3 projects; new projects skip it.
2. **PostCSS plugin renamed.** `tailwindcss` → `@tailwindcss/postcss`. Drop `autoprefixer` and `postcss-import` from `postcss.config.*` — v4 handles both internally.
3. **`@tailwind` directives removed.** Replace `@tailwind base; @tailwind components; @tailwind utilities;` with the single line `@import "tailwindcss";`.
4. **Opacity utilities removed.** No more `bg-opacity-50`, `text-opacity-*`, `border-opacity-*`, `ring-opacity-*`, `divide-opacity-*`, `placeholder-opacity-*`. Use the slash modifier: `bg-black/50`, `text-white/75`, `border-zinc-200/40`.
5. **Renamed flex utilities.** `flex-shrink-*` → `shrink-*`, `flex-grow-*` → `grow-*`.
6. **Renamed text utilities.** `overflow-ellipsis` → `text-ellipsis`. `decoration-slice` → `box-decoration-slice`. `decoration-clone` → `box-decoration-clone`.
7. **Shadow / blur / radius scale shifted down one step.** `shadow` → `shadow-sm`, `shadow-sm` → `shadow-xs`. Same shift for `drop-shadow`, `blur`, `backdrop-blur`, `rounded`. If you copy a v3 snippet using `shadow-sm`, what you'll *see* in v4 is `shadow-xs`.
8. **Default ring width changed from 3px to 1px.** v3 `ring` is now `ring-3`. Default ring color is `currentColor`, not `blue-500`.
9. **Default border color is `currentColor`, not `gray-200`.** Always specify a border color (`border border-zinc-200`) or set `--default-border-color` in `@theme`.
10. **`outline-none` renamed to `outline-hidden`.** The new behavior preserves accessibility in forced-colors mode. Standalone `outline-2` now works without also writing `outline`.
11. **`hover:` only applies on devices with `pointer: fine`.** It's wrapped in `@media (hover: hover)`. Touch devices skip hover styles. Override with `@custom-variant hover (&:hover);` only if you really need the old behavior.
12. **`space-x-*` / `space-y-*` / `divide-*` selectors changed.** v3 used `:not([hidden]) ~ :not([hidden])`; v4 uses `:not(:last-child)` for performance. If your layout had inline children or custom child margins, switch to `flex` / `grid` + `gap-*`.
13. **Important modifier moved to the end.** `!flex` → `flex!`. `!hover:bg-red-500` → `hover:bg-red-500!`.
14. **Arbitrary CSS variable syntax changed.** `bg-[--brand]` → `bg-(--brand)`. Square brackets are still used for *values* (`bg-[#bada55]`); parentheses for *variable references*.
15. **Commas in arbitrary grid/object values must become underscores.** `grid-cols-[max-content,auto]` → `grid-cols-[max-content_auto]`.
16. **Variant stacking order reversed.** v3 read right-to-left; v4 reads left-to-right. `first:*:pt-0` → `*:first:pt-0`. `dark:hover:bg-x` already meant the same thing, but selector-style variants like `*:`, `[&_li]:`, `not-`, `group-` need a re-read.
17. **Transform reset.** `transform-none` no longer resets every transform; reset individually (`scale-none`, `rotate-none`, `translate-none`). Transition utilities now interpolate the individual properties (`scale`, `rotate`, `translate`) rather than the legacy `transform` shorthand.
18. **Gradient variants no longer reset other stops.** `dark:from-blue-500 dark:to-teal-400` keeps the inherited `via-*`. To clear the via stop in a variant, write `dark:via-none`.
19. **Default colors are OKLCH internally.** Hex values you write in `@theme` are accepted as-is, but the default palette is OKLCH and uses the wider P3 gamut on capable displays.
20. **Built-in plugins.** Container queries, `@tailwindcss/forms`-style form resets, typography utilities, and 3D transforms are all built into v4. Verify against the docs before adding a v3 plugin — most are now native.
21. **Preflight tweaks.** Default `<button>` cursor is `default`, not `pointer`. Default placeholder color is current text @ 50% opacity, not `gray-400`. `<dialog>` margin is reset (no auto-centering). `display` utilities no longer override the `hidden` HTML attribute.
22. **`theme()` function discouraged.** Inside CSS, prefer `var(--color-red-500)` over `theme(colors.red.500)`. In media queries (where `var()` doesn't work), use `theme(--breakpoint-md)` with the v4 variable name.
23. **JavaScript `resolveConfig` is gone.** To read theme values from JS: `getComputedStyle(document.documentElement).getPropertyValue("--color-brand")`.
24. **Sass/Less/Stylus are unsupported.** Tailwind v4 *is* the preprocessor.

## Composing with shadcn/ui

shadcn ships components that reference `--background`, `--foreground`, `--primary`, `--card`, `--border`, etc. defined on `:root` and `.dark`. To make `bg-background`, `text-foreground`, `border-border`, etc. resolve correctly per theme, **map those variables into `@theme inline`** — exactly the pattern already used in `globals.css` for `--background` / `--foreground`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
  /* …rest of shadcn tokens */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* …rest */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

`inline` is mandatory here — without it the utility would lock onto whatever `--background` was at definition time and stop reacting to the `.dark` swap.

The sibling [dealhunter-design-system](../dealhunter-design-system/SKILL.md) skill defines the brand token *values* (palette, type scale, spacing). This skill explains the *mechanism* — `@theme`, `@theme inline`, `@custom-variant`, `@utility` — those values plug into.

## Quick reference: v3 → v4

| v3 | v4 |
|---|---|
| `tailwind.config.ts` `theme.extend.colors` | `@theme { --color-* }` in CSS |
| `darkMode: "class"` config | `@custom-variant dark (&:where(.dark, .dark *));` |
| `tailwindcss` PostCSS plugin | `@tailwindcss/postcss` |
| `autoprefixer` / `postcss-import` | (built in, remove) |
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| `bg-opacity-50` | `bg-black/50` |
| `flex-shrink-0` / `flex-grow-0` | `shrink-0` / `grow-0` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `outline-none` | `outline-hidden` |
| `shadow-sm` | `shadow-xs` (and `shadow` → `shadow-sm`) |
| `ring` (3px default) | `ring-3` |
| `!flex` | `flex!` |
| `bg-[--brand]` | `bg-(--brand)` |
| `grid-cols-[max-content,auto]` | `grid-cols-[max-content_auto]` |
| `first:*:pt-0` | `*:first:pt-0` |
| Plugin: `@tailwindcss/container-queries` | built-in (`@container`, `@sm:`, `@max-md:`) |
| Plugin: `@tailwindcss/typography` / `forms` / `aspect-ratio` | built-in |
| `theme(colors.red.500)` | `var(--color-red-500)` |
| `resolveConfig` in JS | `getComputedStyle(...).getPropertyValue("--color-…")` |
| `@layer utilities { .x { … } }` | `@utility x { … }` |

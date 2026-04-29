---
name: shadcn-ui
description: How to install, add, customize, and theme shadcn/ui components in the deal-hunter Next.js 15 + Tailwind v4 + Turborepo monorepo. Use any time you need a UI primitive (button, dialog, sheet, dropdown, etc.) or are wiring up theming.
---

# shadcn/ui in deal-hunter

shadcn/ui is **not an npm package** — it is a CLI that copies component source code into your repo, and you own the result. There is no `import { Button } from "shadcn-ui"`. Instead, the CLI scaffolds files like `src/components/ui/button.tsx` that you can read, edit, and version-control like any other code in the project. Components are built on Radix primitives, styled with Tailwind, and parameterized with `class-variance-authority` (CVA). Updates come via the CLI's `diff` command, not via `npm update`.

## When to use this skill

- Adding a new UI primitive (button, dialog, sheet, dropdown, input, command palette, etc.)
- Customizing the styles, variants, or behavior of an existing primitive
- Debugging a theming issue (CSS variables not resolving, dark mode not flipping, brand color not applying)
- Setting up a fresh checkout that doesn't yet have `components.json`
- Wiring up `next-themes` for the first time

## Initial setup (one-time)

shadcn lives at the **`apps/web` workspace**, not at the repo root. The CLI writes `components.json`, `src/lib/utils.ts`, and `src/components/ui/*` into that workspace, and reads `src/app/globals.css` and `tsconfig.json` from there.

### Run init

From the repo root:

```bash
npx shadcn@latest init --cwd apps/web
```

Or equivalently:

```bash
cd apps/web && npx shadcn@latest init
```

The CLI will prompt for:
- **Style** — pick `new-york`. The old `default` style is deprecated as of the Tailwind v4 / React 19 update.
- **Base color** — pick `neutral`. (Brand colors are layered on top via CSS variables — see Theming below.)
- **CSS variables** — `yes`. This is what makes theming via `--primary`, `--background`, etc. work.

It will detect Next.js 15, App Router, and Tailwind v4 automatically.

### Expected `components.json`

After init, `apps/web/components.json` should look like this:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Notes:
- `tailwind.config` is intentionally `""` — Tailwind v4 is CSS-first and the project has no `tailwind.config.ts`. Old shadcn docs that reference a config path are pre-v4; ignore them.
- `tailwind.css` points to `src/app/globals.css` (the Tailwind v4 entry point already in use).
- `rsc: true` makes the CLI add `"use client"` to client-only primitives automatically.

### Path alias check

`apps/web/tsconfig.json` already has the `@/*` alias mapping to `src/*`:

```json
"paths": { "@/*": ["./src/*"] }
```

If that's missing or different, the CLI's `aliases` block won't resolve and imports will break.

### What gets created

After init:
- `apps/web/components.json` — CLI config.
- `apps/web/src/lib/utils.ts` — the `cn()` helper (see below).
- `apps/web/src/app/globals.css` — updated with `:root` / `.dark` CSS variable blocks and an `@theme inline` block that maps them to Tailwind utility classes.
- `apps/web/src/components/ui/` — empty until you `add` something.

The CLI also installs runtime peer deps into `apps/web`'s `package.json`: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, and `@radix-ui/*` packages on demand.

## Adding a component

From the repo root:

```bash
npx shadcn@latest add button --cwd apps/web
```

Or from `apps/web`:

```bash
cd apps/web && npx shadcn@latest add button
```

Add multiple at once:

```bash
npx shadcn@latest add button card dialog sheet --cwd apps/web
```

What `add` does:
1. Writes the component source into `apps/web/src/components/ui/<name>.tsx`.
2. Installs any Radix peer deps (e.g. `@radix-ui/react-dialog` for `dialog`) into `apps/web`.
3. Adds icon imports from `lucide-react` where needed.
4. For client primitives (Dialog, Dropdown, Sheet, Popover, Tabs, Tooltip, Command, Select, Toast/Sonner), inserts `"use client"` automatically.

Components likely to come up in this project: `button`, `card`, `dialog`, `sheet`, `dropdown-menu`, `input`, `label`, `badge`, `tooltip`, `tabs`, `select`, `command`, `popover`, `sonner` (the modern toast), `skeleton`, `separator`, `avatar`, `form` (pulls in `react-hook-form` + `zod`), `table`.

## Customizing components

The shadcn philosophy: **edit the file in `components/ui/` directly**. Don't wrap it. Don't fork it. The component is yours. If you want a new variant, add it to the CVA config in place.

### CVA recipe — adding a new variant

In `apps/web/src/components/ui/button.tsx`, the variants are defined like this:

```ts
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

To add a deal-hunter-specific `urgency` variant for hot deal CTAs:

```ts
variant: {
  // ... existing
  urgency:
    "bg-[oklch(0.62_0.22_25)] text-white shadow-[0_0_0_1px_oklch(0.62_0.22_25/0.5)] " +
    "hover:bg-[oklch(0.58_0.22_25)] focus-visible:ring-[oklch(0.62_0.22_25)]",
},
```

Use it: `<Button variant="urgency">Snipe deal</Button>`. The TypeScript `VariantProps<typeof buttonVariants>` type updates automatically.

Prefer wiring new variants to **CSS variables** (`bg-primary`, `bg-destructive`) so they re-theme correctly in dark mode rather than hardcoding OKLCH values inline. The hardcoded form above is shown for cases where the value is genuinely a one-off.

## The `cn()` helper

`apps/web/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Import it as `import { cn } from "@/lib/utils"`. Always.

`clsx` handles conditional className composition (`cn("base", isActive && "ring-2")`). `tailwind-merge` resolves conflicting utilities — `cn("p-2", "p-4")` returns `"p-4"`, not `"p-2 p-4"`. This is the reason callers can override defaults safely:

```tsx
<Button className={cn("uppercase tracking-wide", className)} />
```

If a consumer passes `className="px-8"`, it wins over the default `px-4` from `buttonVariants`. Without `tailwind-merge`, both classes would land on the element and CSS specificity / source order would decide — usually wrong.

## Theming with Tailwind v4

This is the section most likely to be miscoded by AI assistants drawing on stale docs. The Tailwind v3 pattern (`hsl(var(--background))` inside `tailwind.config.ts` `theme.extend.colors`) does **not** apply here. Read carefully.

### Two-block pattern in `globals.css`

shadcn (current, v4-aware) uses two distinct sections in the same CSS file:

**Block 1 — semantic CSS variables on `:root` and `.dark`** (raw color values, OKLCH in the current default theme):

```css
:root {
  --radius: 0.625rem;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);

  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);

  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);

  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);

  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);

  --destructive: oklch(0.704 0.191 22.216);
  /* ... etc ... */
}
```

**Block 2 — `@theme inline` mapping vars to Tailwind utility names**:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

The `inline` keyword on `@theme` matters: it tells Tailwind to substitute the `var(...)` reference into generated utilities so `bg-primary` becomes `background-color: var(--primary)`. That's how `.dark` flipping a single `--primary` re-themes the whole app without rebuilding.

Why OKLCH instead of HSL: shadcn's current default theme moved from `hsl(...)` channels to `oklch(...)` for better perceptual uniformity. You no longer wrap the var with `hsl(var(--primary))` inside `@theme inline` — the var holds the full color value, not just channels. Old shadcn docs that show `--color-primary: hsl(var(--primary))` are pre-update; don't copy them.

### Existing project state

The current `apps/web/src/app/globals.css` only declares `--background` and `--foreground` and uses a `prefers-color-scheme: dark` media query for dark mode. Running `shadcn init` will replace that with the full `:root` / `.dark` blocks above and switch dark mode from media-query to `.dark`-class-based (which is what `next-themes` flips).

### Plugging in DealHunter brand colors

DealHunter is dark-mode-first: the brand sets the base canvas to `#0D0D0D` and the primary action to `#2D6EF5` (azul eléctrico). To override shadcn's defaults, change the values in the `.dark` block of `globals.css` (and optionally `:root` if light mode also ships):

```css
.dark {
  --background: oklch(0.145 0 0);          /* keep near-black canvas */
  --foreground: oklch(0.985 0 0);

  /* DealHunter brand primary — convert #2D6EF5 to OKLCH */
  --primary: oklch(0.58 0.21 258);
  --primary-foreground: oklch(0.985 0 0);

  --ring: oklch(0.58 0.21 258);            /* focus ring matches primary */
  /* ... rest stays as shadcn defaults until the design system specifies otherwise */
}
```

These OKLCH values are illustrative. The **dealhunter-design-system skill** is the source of truth for exact color tokens — consult it before committing brand color CSS.

## Dark mode setup

shadcn's dark mode is class-based (`.dark` on `<html>`), driven by `next-themes`.

### Install

```bash
npm i -w @deal-hunter/web next-themes
```

### Provider

`apps/web/src/components/theme-provider.tsx`:

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Wire into the root layout

`apps/web/src/app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`defaultTheme="dark"` and `enableSystem={false}` reflect that DealHunter is dark-mode-first per the brand guidelines. If you eventually ship a light theme, switch `enableSystem` back to `true`. `suppressHydrationWarning` is required because `next-themes` rewrites the `<html>` class on the client before React hydrates.

## Server vs client components

shadcn primitives split into two camps:

- **Pure visual** (`button`, `card`, `badge`, `skeleton`, `separator`) — render fine in Server Components.
- **Radix-driven interactive** (`dialog`, `sheet`, `dropdown-menu`, `popover`, `tabs`, `tooltip`, `command`, `select`, `sonner`) — must be Client Components. The CLI inserts `"use client"` at the top automatically when `rsc: true` in `components.json`.

Importing a client primitive from inside a Server Component is fine. The `"use client"` boundary lives at the primitive file itself, so the parent can stay server-rendered and Next will serialize the props across the boundary as usual. Only escalate the parent to a Client Component if the parent itself needs hooks or browser APIs.

## Common gotchas

- **`cn()` lives at `@/lib/utils`**, not `@/utils` or `@/lib`. If `components.json` `aliases.utils` drifts from where the file actually is, every component import breaks. Re-run `init` or hand-edit the file rather than fighting the alias.
- **No `tailwind.config.ts` in this project.** Tailwind v4 is CSS-first; the v4 update to shadcn supports this. If you find docs or AI suggestions saying to edit `tailwind.config.ts`, they are stale (pre-v4) and don't apply here.
- **Workspace-aware peer dep installs.** This repo uses npm workspaces, and shadcn's CLI installs peers into the cwd. If something complains about a missing dep, install from the repo root with `npm i -w @deal-hunter/web <pkg>`, e.g. `npm i -w @deal-hunter/web @radix-ui/react-dialog`.
- **`transpilePackages` in `next.config.ts` already lists `@deal-hunter/db`.** If shadcn ever needs an addition there (rare — it usually doesn't), append, don't replace: `transpilePackages: ["@deal-hunter/db", "<new-pkg>"]`.
- **Icons.** shadcn defaults to `lucide-react`. Other libraries work but require swapping imports manually in each component file.
- **OKLCH, not HSL.** The current shadcn default theme uses `oklch(...)` directly in CSS variables. Don't wrap with `hsl(var(--primary))` in `@theme inline` — that's the old v3 pattern.
- **Init replaces `globals.css`.** The current `globals.css` only has two CSS variables. After `shadcn init`, expect a much larger file with `:root` and `.dark` blocks. Reconcile any custom declarations (e.g. the existing `body` font-family rule) by re-adding them after init.

## Useful CLI flags

| Flag | Use |
|---|---|
| `--cwd apps/web` | Run from repo root and target the `apps/web` workspace. |
| `--yes` | Skip all confirmation prompts. |
| `--overwrite` | Replace existing component files (use when you want to reset a customized component to upstream). |
| `--all` | `add --all` installs every available component. Don't do this in deal-hunter; pull only what you use. |
| `--path <dir>` | Override the `aliases.ui` install location for one command. |
| `--dry-run` | Preview file changes without writing. Useful for checking what `add` would touch. |
| `diff [component]` | Show the delta between your local copy and the upstream version — run this before pulling updates. |

Examples:

```bash
# Add several components in one shot, no prompts
npx shadcn@latest add button card dialog input --yes --cwd apps/web

# Reset a customized button back to upstream
npx shadcn@latest add button --overwrite --cwd apps/web

# See what changed upstream for an existing component
npx shadcn@latest diff button --cwd apps/web
```

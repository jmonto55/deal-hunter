---
name: dealhunter-design-system
description: DealHunter brand guidelines — logo variants, 6-color palette with strict role assignments, Poppins typography hierarchy, voice & tone rules, and ready-to-paste Tailwind v4 @theme tokens. Use whenever building UI for the deal-hunter project.
---

# DealHunter Design System

DealHunter is a dark-mode-first product that surfaces real-estate deals to qualified investors before they hit the open market. The brand reads as analyst-grade, not marketing: concrete numbers, tech aesthetic, no exclamations, no emojis, no fluff. Every UI decision should reinforce "datos verificados, sin ruido."

## When to use this skill

- Generating any React/Next component for `apps/web`.
- Picking a color, font size, or font weight.
- Writing copy for headings, body, badges, or CTAs.
- Naming or styling a button (CTAs are always UPPERCASE Bold).
- Adding tokens to `apps/web/src/app/globals.css`.
- Reviewing a component before merging — run the anti-patterns checklist at the bottom.

## Logo

Three valid variants. Nothing else ships.

| Variant | Treatment | Use for |
|---|---|---|
| **Principal** | Black logo on white background | Documents, presentations, light backgrounds |
| **Invertida** | White logo on black background | Platform header, dark mode (default surface) |
| **Acento** | Blue (`#2D6EF5`) logo on black background | Welcome screens, highlighted moments |

### Prohibited

- **No deformar el logo.** Never stretch or compress horizontally or vertically. Always preserve original proportions.
- **No cambiar los colores.** Only black, white, or `#2D6EF5`. Never apply colors outside the official palette.
- **No agregar efectos.** No shadows, gradients, glows, or outlines on the icon or wordmark.
- **No usar sobre fondos incorrectos.** Only over black, white, or very dark blue. Never over vivid colors or unoverlayed photography.

## Color palette

Six colors. Each has a role. Do not improvise.

| HEX | Name | Role | Use for | Tailwind class |
|---|---|---|---|---|
| `#0D0D0D` | Negro Profundo | Base | Main backgrounds | `bg-bg-base` / `text-bg-base` |
| `#1A1A1A` | Gris Carbón | Surface | Cards, panels | `bg-bg-card` |
| `#2D6EF5` | Azul Eléctrico | Action | CTAs, links, active states | `bg-action` / `text-action` |
| `#F5A623` | Dorado Ámbar | Urgency | Alerts, time-sensitive badges | `bg-urgent` / `text-urgent` |
| `#FFFFFF` | Blanco | Foreground | Text on dark surfaces | `text-fg` |
| `#A0A0A0` | Gris Claro | Muted foreground | Subtitles, metadata | `text-fg-muted` |

> **Hard rule: max 3 colors per component.** Amber `#F5A623` is RESERVED for urgency/alerts only — never decorative, never a default badge color, never a hover accent. Orange in any shade is out of palette and will break brand identity.

## Typography

Font family: **Poppins** (Google Fonts, free). No serif fallbacks (Georgia, Times New Roman, etc. break the tech feel). Minimum on-screen size is **12px**. CTAs are **always UPPERCASE Bold**.

| Role | Weight | Size | Casing | Example | Tailwind class |
|---|---|---|---|---|---|
| H1 | Bold 700 | 48px | Sentence | "Encuentra el deal antes que nadie" | `text-h1 font-bold` |
| H2 | SemiBold 600 | 32px | Sentence | "Oportunidades activas" | `text-h2 font-semibold` |
| H3 | SemiBold 600 | 24px | Sentence | "Cesión — El Poblado" | `text-h3 font-semibold` |
| Body | Regular 400 | 16px | Sentence | "Precio 23% por debajo del mercado." | `text-body font-normal` |
| Label | Medium 500 | 12px | Sentence/UPPERCASE | "NUEVO · hace 2h" | `text-label font-medium` |
| CTA | Bold 700 | 16px | **UPPERCASE** | "VER OPORTUNIDAD" | `text-cta font-bold uppercase` |

Line-heights are not specified in the brand deck; use **1.2 for headings (H1–H3)** and **1.5 for body/label** as inferred sensible defaults.

## Voice & tone

DealHunter speaks like a buy-side analyst, not a marketer.

| ✓ DealHunter SÍ dice | ✗ DealHunter NO dice |
|---|---|
| "Cesión en El Poblado — 18% ROI proyectado" | "¡Gran oportunidad! No te la pierdas 🏠" |
| "Precio 23% por debajo del mercado. Cierre en 30 días." | "Tenemos las mejores propiedades para ti" |
| "Acceso anticipado para inversionistas calificados" | "¡Regístrate gratis y empieza a ganar!" |
| "Datos verificados. Sin ruido." | "Somos tu mejor opción en el mercado" |

### Voice principles

1. **Data-first.** Lead with the number, not the adjective.
2. **Concrete over abstract.** "23% por debajo del mercado" beats "gran descuento."
3. **Analyst tone.** Sound like research, not a sales pitch.
4. **No exclamations.** Periods only. Urgency is shown by the data, not punctuation.
5. **No emojis.** Anywhere. Ever.
6. **No superlatives.** Avoid "la mejor," "el más," "increíble," "único."
7. **No second-person hype.** No "¡no te la pierdas!", no "empieza a ganar."

## Six golden rules

1. **Logo solo en versiones oficiales** (Logo only in official versions) — Principal, Invertida, Acento, and Icon-only. No modifications.
2. **Paleta de 6 colores — respetar roles** (6-color palette — respect the roles) — Blue = action. Gold = urgency. Black/gray = base.
3. **Poppins en toda la plataforma** (Poppins across the entire platform) — No serifs. Minimum 12px. CTAs always UPPERCASE Bold.
4. **Tono directo y preciso** (Direct and precise tone) — Concrete data, no exclamations or emojis. Like an analyst.
5. **Modo oscuro como base** (Dark mode as the default) — Black `#0D0D0D`. Logo in white or blue over dark backgrounds.
6. **Máximo 3 colores por componente** (Max 3 colors per component) — Less is more — whitespace also communicates.

## Tailwind v4 design tokens

Paste this into [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css) right after `@import "tailwindcss";`. Tailwind v4 reads `@theme` blocks directly — no `tailwind.config` needed.

```css
@theme {
  /* Colors — role-based names, do not rename */
  --color-bg-base: #0D0D0D;
  --color-bg-card: #1A1A1A;
  --color-action: #2D6EF5;
  --color-urgent: #F5A623;
  --color-fg: #FFFFFF;
  --color-fg-muted: #A0A0A0;

  /* Font family — load Poppins via next/font/google in app/layout.tsx */
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;

  /* Type scale — size / line-height. Line-heights inferred (1.2 headings, 1.5 body). */
  --text-h1: 48px;
  --text-h1--line-height: 1.2;
  --text-h2: 32px;
  --text-h2--line-height: 1.2;
  --text-h3: 24px;
  --text-h3--line-height: 1.2;
  --text-body: 16px;
  --text-body--line-height: 1.5;
  --text-label: 12px;
  --text-label--line-height: 1.5;
  --text-cta: 16px;
  --text-cta--line-height: 1.2;

  /* Font weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

Usage:

```html
<button class="bg-action text-fg font-bold uppercase text-cta">VER OPORTUNIDAD</button>
```

## Component recipes

Three reference patterns. Each obeys the 3-colors-max rule.

### Deal card

Dark surface, three colors total: `bg-bg-card` + `text-fg` + `text-action` (plus `text-urgent` only when fresh).

```tsx
<article class="bg-bg-card rounded-lg p-6">
  <span class="text-urgent text-label font-medium uppercase">NUEVO · hace 2h</span>
  <h3 class="text-fg text-h3 font-semibold mt-2">Cesión — El Poblado</h3>
  <p class="text-fg-muted text-body font-normal mt-1">
    Precio 23% por debajo del mercado. Cierre en 30 días.
  </p>
  <button class="bg-action text-fg text-cta font-bold uppercase mt-4 px-4 py-2 rounded">
    VER OPORTUNIDAD
  </button>
</article>
```

### Alert badge

Amber appears only when conveying urgency or a time-sensitive deadline. Never as decoration.

```tsx
<span class="bg-urgent text-bg-base text-label font-medium uppercase px-2 py-1 rounded">
  CIERRA EN 24H
</span>
```

### Empty state

Black background, white H2, muted-gray body, single blue CTA. Three colors max.

```tsx
<div class="bg-bg-base text-center py-16">
  <h2 class="text-fg text-h2 font-semibold">Aún no hay oportunidades activas</h2>
  <p class="text-fg-muted text-body font-normal mt-2">
    Las próximas cesiones aparecerán aquí en cuanto pasen verificación.
  </p>
  <button class="bg-action text-fg text-cta font-bold uppercase mt-6 px-6 py-3 rounded">
    CONFIGURAR ALERTAS
  </button>
</div>
```

## Anti-patterns checklist

Run this before shipping any component. Any "yes" is a brand violation — fix before merge.

- [ ] Orange anywhere on screen (background, border, accent)?
- [ ] More than 3 colors visible in a single component?
- [ ] Amber/gold used for anything other than urgency?
- [ ] CTA in sentence case or Title Case instead of UPPERCASE?
- [ ] CTA in any weight other than Bold 700?
- [ ] Any text rendered below 12px?
- [ ] Exclamation point in copy?
- [ ] Emoji in copy?
- [ ] Serif font (Georgia, Times, etc.) anywhere?
- [ ] Logo stretched, recolored, shadowed, or placed on a non-approved background?
- [ ] Marketing-voice phrases ("la mejor", "no te la pierdas", "empieza a ganar")?

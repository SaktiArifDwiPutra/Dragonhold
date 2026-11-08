# Dragonhold — Design System: "The Living Kingdom Archive"

> **Version**: 1.1 (Refined Stage 1 Content Launch Ready)  
> **Status**: Verified Specifications & Alignment  
> **Aesthetic Philosophy**: Modern Editorial Web Design × Medieval Royal Archive × Controlled Fantasy Tactility

---

## 1. Aesthetic Concept & Brand Truth

Dragonhold is the official digital presence and civic registry of a newly founded kingdom in the post-war world of **Aetherial**. Humanity is rebuilding in the aftermath of a devastating war against dragons; the High Throne is vacant, and the realm's history is yet to be written.

### Core Principles & Truth Anchors
- **Ground in Backend Reality**:
  - **Citizen ID**: Sealed strictly in the authentic format `DH-000001` (6 digits padded, matching `@dragonhold/db`). No random alphanumeric hashes or fabricated ID formats.
  - **Kingdom Status**: Fixed to the database value `NEWLY_ESTABLISHED`.
  - **Throne**: `VACANT` (Authentic lore-driven interregnum).
  - **Chronicles**: `BLANK` (Narrative indicator that the first chapter is unwritten; does not imply a governance chronicles engine yet).
  - **Zero Fabricated Metrics**: No fake population numbers ("4,812 Souls"), false vote counts, or unverified ledger stats.
- **Controlled Ornamentation**:
  - **Parchment**: Strictly reserved for authentic royal artifacts—official proclamations (`/announcements`) and the Citizen Pass (`/dashboard`). Standard cards remain dark stone.
  - **Wax Seals**: Exclusive visual accents on royal decrees and the citizen identity badge.
  - **Corner Brackets**: Applied selectively to the hero shield and featured proclamations, never sprayed indiscriminately over every container.
  - **Restrained Density**: Generous editorial whitespace, clean 1px dividers, and no visual clutter.

---

## 2. Color Palette & Verified WCAG Contrast Ratios

```css
@theme {
  /* Archival Nocturnal Canvas (Dark Stone Foundation) */
  --color-canvas-base: #0a0e18;          /* Midnight stone background */
  --color-canvas-surface: #0f131d;       /* Base card & panel ground */
  --color-canvas-subtle: #171b26;        /* Recessed ledger containers */
  --color-canvas-elevated: #1c1f2a;      /* Interactive hover & active layers */
  --color-canvas-border: #262a35;        /* Subtle architectural dividers */

  /* Sovereign Metallics (Antique Gold & Bronze) */
  --color-gold-sovereign: #c8a253;      /* Primary royal CTA, active accents, borders */
  --color-gold-aura: #eac16e;           /* Bright highlight & hover lift */
  --color-gold-relic: #997a32;          /* Restrained border & inactive marker */
  --color-bronze-hardware: #8c6239;     /* Corner brackets, physical rules */

  /* Imperial Seals & Proclamations (Burgundy / Crimson) */
  --color-seal-crimson: #8a2525;        /* Royal wax seals, urgent notices, alert badges */
  --color-seal-deep: #611717;           /* Seal hover & pressed states */

  /* Aged Parchment & Iron Gall (Tactile Document Layer) */
  --color-parchment-sheet: #f4ebd0;      /* Physical parchment proclamation background */
  --color-parchment-border: #d4c49e;     /* Double-line parchment border */
  --color-ink-irongall: #1f1d1a;         /* High-contrast dark ink on parchment */
  --color-ink-muted: #4a453e;            /* Secondary script on parchment */

  /* Text & Typography on Dark Canvas */
  --color-text-primary: #dfe2f1;         /* Crisp parchment-white primary text */
  --color-text-secondary: #9a8f7f;       /* Muted stone secondary text */
  --color-text-tertiary: #6b6356;        /* Subtle metadata & timestamps */
}
```

### Verified WCAG Accessibility Contrast Table
All color pairs have been mathematically verified using relative luminance calculations:

| Visual Element | Foreground | Background | Measured Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Text on Dark Base** | `#dfe2f1` | `#0a0e18` | **14.96 : 1** | **Passes AAA** (Exceeds 7.0:1) |
| **Secondary Text on Dark Base** | `#9a8f7f` | `#0a0e18` | **6.07 : 1** | **Passes AA** (Exceeds 4.5:1) |
| **Gold Highlight on Dark Base** | `#eac16e` | `#0a0e18` | **11.34 : 1** | **Passes AAA** |
| **Gold Sovereign on Card Surface** | `#c8a253` | `#0f131d` | **7.73 : 1** | **Passes AAA** |
| **Iron Gall Ink on Parchment** | `#1f1d1a` | `#f4ebd0` | **14.12 : 1** | **Passes AAA** |
| **Muted Script on Parchment** | `#4a453e` | `#f4ebd0` | **7.98 : 1** | **Passes AAA** |
| **Wax Seal White Text on Crimson** | `#ffffff` | `#8a2525` | **8.85 : 1** | **Passes AAA** |
| **Visible Keyboard Focus Ring** | `#eac16e` | `#0a0e18` | **11.34 : 1** | **Passes AAA** |

---

## 3. Typographic System (Strictly 3 Next/Font Families)

To eliminate external render-blocking font requests and maintain clean bundle hygiene:

```typescript
// apps/web/src/app/layout.tsx
import { Lora, Inter, JetBrains_Mono } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```

| Token / Role | Font Family | Weight | Purpose |
| :--- | :--- | :--- | :--- |
| `--font-serif` | `Lora` | 600, 700 | Monumental headings, section titles, proclamation headlines |
| `--font-sans` | `Inter` | 400, 500, 600 | Body prose, UI navigation, buttons, form inputs, labels |
| `--font-mono` | `JetBrains_Mono` | 500, 700 | Citizen IDs (`DH-000001`), status indicators, system timestamps |

---

## 4. Mobile Ergonomics & Safe-Area Insets (80% Mobile Traffic Priority)

1. **Selective Mobile Sticky Dock**:
   - Rendered **strictly on public-facing pages** (`/`).
   - **Never displayed** on `/login`, `/register`, or `/dashboard`.
   - Built with safe-area insets: `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`.
   - The landing page includes explicit bottom clearance (`pb-28 sm:pb-0`) preventing any overlap with content, forms, or footer.
2. **Strict 48px Interactive Hitboxes**:
   - All buttons, inputs, navigation links, and mobile drawer toggles adhere to `min-h-[48px]`.
3. **Responsive Breakpoint Verification**:
   - **375px (Compact Mobile)**: Single-column linear layout, 32px display heading, full-width thumb actions.
   - **768px (Tablet)**: 2-column grid for overview cards, centered hero container.
   - **1024px (Desktop)**: Full horizontal navigation bar, 44px display typography, 3-column realm status.
   - **1440px (Wide Screen)**: Constrained container width (`max-w-5xl` / `1024px`) preventing uncomfortably long line lengths (< 75 characters per line).

---

## 5. Realm State HUD (The 3 Canonical Entries)

No decorative filler cards. Strictly 3 factual kingdom indicators:

```text
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│         THRONE          │         STATUS          │       CHRONICLES        │
│         VACANT          │    NEWLY ESTABLISHED    │          BLANK          │
│   Interregnum Presiding │    Era I · Post-War     │  Awaiting First Record  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 6. Component Specifications

### A. Buttons (`apps/web/src/components/ui/button.tsx`)
- **Primary Sovereign Gold**:
  - Background: `bg-gradient-to-b from-[#eac16e] via-[#c8a253] to-[#997a32]`.
  - Border: `border-2 border-[#eac16e]`.
  - Text: `text-[#0a0e18] font-bold tracking-wider uppercase`.
  - Tactile Depth: `shadow-[0_3px_0_0_#6b4e18] active:translate-y-0.5 active:shadow-none`.
  - Hitbox: `min-h-[48px] px-5 py-2.5`.
- **Secondary Dark Stone**:
  - Background: `bg-[#0f131d] border-2 border-[#8c6239] text-[#eac16e]`.
  - Hover: `hover:bg-[#171b26] hover:border-[#c8a253]`.
  - Tactile Depth: `shadow-[0_2px_0_0_#0a0e18] active:translate-y-0.5 active:shadow-none`.
- **Ghost**:
  - Background: `bg-transparent text-[#dfe2f1] hover:text-[#eac16e] hover:bg-white/5`.

### B. Panels (`apps/web/src/components/ui/panel.tsx`)
- **Dark Stone (Default)**: `#0f131d` background, `#262a35` border, clean and unembellished.
- **Parchment Relic (Reserved)**: `#f4ebd0` background, `#1f1d1a` text, double-line border `#d4c49e`, warm amber ambient drop shadow.
- **Selective Brackets**: Enabled only on the hero status panel and featured decrees via crisp 2px gold corner notches.

### C. Citizen Pass Card (`apps/web/src/app/dashboard/page.tsx`)
- Styled as a physical vellum/parchment credential pass.
- Features the authentic Citizen ID (`DH-000001`), character name, and sovereign role.
- Embossed with an authentic wax seal signet in deep crimson (`#8a2525`).

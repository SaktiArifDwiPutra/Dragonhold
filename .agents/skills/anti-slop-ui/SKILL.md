---
name: anti-slop-ui
description: Anti-slop gaming-first UI design system for Dragonhold. Enforces tactile, immersive dark fantasy aesthetic, eliminates generic AI SaaS clichés, and mandates 80% mobile-first ergonomic layouts.
---

# Anti-Slop Gaming & Mobile-First Design System

This skill guides the visual styling, component architecture, and responsive ergonomics of Dragonhold. It ensures the application feels like an authentic dark-fantasy gaming codex / RPG interface rather than generic AI slop.

---

## 1. Anti-Slop Directives (What to AVOID vs What to BUILD)

### AVOID (Generic AI Slop)
- ❌ **Purple-to-Blue Gradients**: Never use the generic AI SaaS purple/indigo/cyan neon glow.
- ❌ **Floaty Pill Buttons**: Avoid squishy, oversized round pills with generic blur drop shadows.
- ❌ **Empty Floating Cards**: Avoid sterile white/grey boxes with 1px border and massive empty padding.
- ❌ **Desktop-First Downscaling**: Never design for 1440px and then just hide things on mobile.
- ❌ **Low-Contrast Micro-Text**: Avoid faint gray 11px text that is unreadable outdoors on mobile screens.

### BUILD (Tactile Dark Fantasy RPG Interface)
- ✔ **Chiseled Borders & Corner Brackets**: Tactical gaming frames with gold/bronze hairline accents, subtle corner notches, and beveled depths.
- ✔ **Tactile Game Buttons**: Physical button depths (`border-2`, bevel highlights, `active:translate-y-0.5 active:shadow-none`, minimum 48px height for thumb taps).
- ✔ **Atmospheric Obsidian & Parchment**: Deep stone/obsidian backgrounds (`#0a0e17`, `#111827`) paired with weathered parchment cards (`#f5ede0`, `#e8dbc5`) for royal decrees and citizen identity.
- ✔ **RPG Quest & Proclamation Typography**: Bold serif display headings (`Cinzel` / `Lora`), high-legibility sans body (`Inter` / system), and monospace/pixel accents for Citizen IDs (`DH-XXXXXX`).

---

## 2. 80% Mobile-First Ergonomics Standards

Since 80%+ of Dragonhold viewers arrive via mobile devices:
1. **Thumb Zone Priority**:
   - Primary calls to action ("Become a Citizen", "Enter Realm") must be comfortably reachable in the natural bottom-half thumb arc.
   - Use a sleek, non-intrusive **Floating Bottom Action Bar** on mobile viewports (`fixed bottom-0 left-0 right-0`).
2. **Minimum Tap Targets**:
   - All interactive elements, buttons, and form inputs must have a touch target of at least **44x44px** (preferably 48px height).
3. **Form Input Ergonomics**:
   - Inputs must use font size >= 16px (`text-base sm:text-sm`) to prevent iOS Safari auto-zoom on focus.
   - Clear visual feedback on focus with gold hairline glow (`ring-2 ring-gold-500/50 border-gold-500`).
4. **Mobile Gaming HUD**:
   - Sticky top bar with Realm Status indicator (pulsing gold/emerald beacon "REALM: NEWLY ESTABLISHED").
   - Full-width mobile navigation drawer with large tap items.

---

## 3. Gaming Visual Components

### The "RPG HUD Panel"
```tsx
// Chiseled gaming frame with ornamental corner brackets
<div className="relative border border-navy-700 bg-navy-900/90 p-5 shadow-xl backdrop-blur-sm">
  <div className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-gold-400" />
  <div className="absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 border-gold-400" />
  <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-gold-400" />
  <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-gold-400" />
  {children}
</div>
```

### The "Tactile Guild Button"
```tsx
// Physical mechanical button with tactile press state
<button className="h-12 px-6 font-display font-bold uppercase tracking-wider text-navy-950 bg-gradient-to-b from-gold-400 to-gold-500 border-2 border-gold-300 shadow-[0_4px_0_0_#92400e] active:translate-y-1 active:shadow-none transition-all">
  {label}
</button>
```

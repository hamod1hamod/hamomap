# Design System: MindForge AI

## 1. Visual Theme & Atmosphere
A restrained, gallery-airy interface with confident asymmetric spatial architecture and fluid tactile physics. The atmosphere is quiet, clinical, and cerebral — reminiscent of a high-end architectural research studio or a bespoke cognitive laboratory. 

- **Density:** 5 (Balanced Studio Air)
- **Variance:** 7 (Offset Asymmetric, intentional structural pauses)
- **Motion:** 6 (Weighted spring feedback, tactile push depth)

Every panel, node, and inspector card respects strict spatial boundaries without faux AI neon gradients, floating glow orbs, or cluttering decorations.

## 2. Color Palette & Roles
- **Canvas Base (Light)** (`#F8FAFC` / Slate-50) — Primary background workspace
- **Canvas Base (Dark)** (`#090D16` / Deep Zinc-Obsidian) — Deep cognitive canvas, avoiding pure `#000000`
- **Pure Surface (Light)** (`#FFFFFF`) — Cards, inspector sidebars, and elevated nodes
- **Pure Surface (Dark)** (`#0F1523`) — Dark theme card and node surface
- **Charcoal Ink** (`#090D16` / Zinc-950) — Primary headlines and dominant glyphs
- **Muted Slate** (`#64748B` / Zinc-500) — Descriptions, secondary metadata, and diagram hints
- **Whisper Border** (`rgba(226, 232, 240, 0.7)` / Dark: `rgba(30, 41, 59, 0.8)`) — 1px structural boundaries
- **Single Singular Accent: Electric Cobalt** (`#2563EB` / 68% Saturation) — Sole focal accent for primary actions, active node selections, and spaced repetition triggers.
- **Supportive Amber** (`#D97706` / Amber-600) — Used exclusively for the Whiteboard/Feynman studio mode.

*(AI Neon Purple, Violet Glows, and saturated gradients are strictly prohibited).*

## 3. Typography Rules
- **Display & Headlines:** `Plus Jakarta Sans` / `Geist` — Track-tight (`tracking-tight`), weight-driven hierarchy (`font-bold`, `font-extrabold`), strictly avoiding screaming sizes.
- **Arabic Script:** `IBM Plex Sans Arabic` — High-clarity geometric baseline for RTL layouts.
- **Body:** `Plus Jakarta Sans` — Relaxed leading (`leading-relaxed`), max 65 characters per line.
- **Mono:** `JetBrains Mono` / Font-Mono — Applied to SRS intervals, node coordinates, timestamps, and flashcard counts.
- **Banned:** `Inter` (as generic default), Times New Roman, Georgia, and generic serifs.

## 4. Component Stylings
- **Buttons:** Flat, tactile push physics (`active:translate-y-[1px]` or `active:scale-[0.98]`). No neon drop-shadows. Solid single accent or whisper-border ghost.
- **Cards & Nodes:** Subtle corner radiuses (`rounded-2xl`), hairline whisper borders (`border border-border/80`), diffused shadows matching canvas tone.
- **Inputs & Search:** Clean inset container, label above, clear focus ring with 1px accent boundary.
- **Hero & Landing:** Asymmetric split. No 3-equal card horizontal rows. Inline typography badges. Real descriptive value over buzzwords.
- **Whiteboard Studio:** Clean drafting table aesthetic, wood/slate tactile palette, discrete floating tool pill.

## 5. Layout Principles
- **Grid Architecture:** Asymmetric structural zoning (65/35 or 70/30) rather than equal thirds.
- **Containment:** Max width container `max-w-7xl` with generous horizontal and vertical gutters.
- **Mobile First:** Strict collapse to single column under 768px. Zero horizontal overflow.
- **Full Viewport:** `min-h-[100dvh]` to prevent viewport jumps on mobile browsers.

## 6. Motion & Interaction
- **Tactile Spring Physics:** `stiffness: 120, damping: 20` feel for active selections and sheet reveals.
- **Micro-Interactions:** Subtle state changes on hover without flashy glow effects.
- **Performance:** Hardware-accelerated transitions via `transform` and `opacity` only.

## 7. Anti-Patterns (Banned)
- ❌ NO AI neon purple/blue drop shadows or glowing border animations.
- ❌ NO emojis in headlines or titles.
- ❌ NO generic 3-equal-card horizontal grid rows.
- ❌ NO pure black (`#000000`).
- ❌ NO fake statistics (`99.9% Uptime`, `100,000+ Students`, `10x Faster`).
- ❌ NO AI copywriting clichés ("Elevate your mind", "Unleash power", "Seamless magic").
- ❌ NO filler text ("Scroll to explore", bouncing down chevrons).
- ❌ NO `Inter` font.

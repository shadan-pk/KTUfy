# KTUfy Theme Reference

> Official color palette and typography guide for consistent UI across all screens.

## Color Palette

### Primary Brand Colors (Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-900` | `#050816` | Deepest background (base) |
| `brand-850` | `#070B1E` | Secondary background |
| `brand-800` | `#0A1128` | Card/surface dark |
| `brand-700` | `#0F1A3E` | Card/surface light |
| `brand-600` | `#152154` | Elevated surfaces |
| `brand-500` | `#1E3A8A` | Strong blue accent |
| `brand-400` | `#2563EB` | Primary action (buttons, links) |
| `brand-300` | `#3B82F6` | Hover / active states |
| `brand-200` | `#60A5FA` | Light accent text |
| `brand-100` | `#93C5FD` | Badges, subtle highlights |
| `brand-50`  | `#DBEAFE` | Very light accents |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#E6EDF3` | Main body text |
| `text-secondary` | `#8B949E` | Descriptions, labels |
| `text-muted` | `#484F58` | Placeholder, hints |
| `text-white` | `#FFFFFF` | On colored buttons |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#34D399` | Positive states |
| `warning` | `#FBBF24` | Caution/streak |
| `error` | `#F87171` | Errors, destructive |
| `info` | `#3B82F6` | Informational |

### Border / Divider
| Token | Hex | Usage |
|-------|-----|-------|
| `border-subtle` | `rgba(71, 85, 105, 0.25)` | Card borders |
| `border-accent` | `rgba(37, 99, 235, 0.3)` | Accent borders |
| `divider` | `rgba(71, 85, 105, 0.15)` | Section dividers |

## Typography — Golden Ratio Scale

Base size: **15px**, ratio: **1.618** (φ)

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| `display` | 39px | 800 | Logo text |
| `h1` | 24px | 700 | Screen titles |
| `h2` | 20px | 700 | Section titles |
| `h3` | 15px | 600 | Card titles, labels |
| `body` | 15px | 400 | Body text |
| `caption` | 12px | 500 | Meta, timestamps |
| `micro` | 10px | 500 | Badges, tiny labels |

> Computed from golden ratio: 15 × 1.618 ≈ 24, 24 × 1.618 ≈ 39, 15 / 1.618 ≈ 9 (→ rounded to 10 and 12)

## Gradient Background
```
Colors: ['#050816', '#0A1128', '#0F1A3E', '#050816']
Animation: 6s cycle, continuous loop
Orb glow: rgba(37, 99, 235, 0.08)
```

## Nav Bar
- Background: `rgba(5, 8, 22, 0.95)`
- Border: `rgba(71, 85, 105, 0.3)`
- Active icon: `#2563EB`, inactive: `#484F58`
- No emoji icons — use text symbols or leave text-only

## Apply This Theme
Import these as constants from a shared file or use inline in StyleSheet.
All screens must use dark backgrounds (`brand-900` or `brand-850`), never white.

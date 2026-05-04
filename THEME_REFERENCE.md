# KTUfy Theme Reference

> Official color palette and typography guide for consistent UI across all screens.

## Color Palette

### Primary Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-900` | `#050507` | Deepest background (base dark mode) |
| `brand-800` | `#121218` | Card/surface dark |
| `brand-700` | `#1A1A24` | Elevated surfaces |
| `accent-blue` | `#3B82F6` | Primary accent (Blue) |
| `accent-green`| `#10B981` | Secondary accent (Green) |

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
| `success` | `#10B981` | Positive states |
| `warning` | `#FBBF24` | Caution/streak |
| `error` | `#EF4444` | Errors, destructive |
| `info` | `#3B82F6` | Informational |

### Border / Divider
| Token | Hex | Usage |
|-------|-----|-------|
| `border-subtle` | `rgba(71, 85, 105, 0.25)` | Card borders |
| `border-accent` | `rgba(59, 130, 246, 0.3)` | Accent borders |
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
Colors: ['#050507', '#121218', '#050507']
Accent Gradient: Blue (#3B82F6) to Green (#10B981)
Orb glow: soft blue top + green bottom gradients for premium depth
```

## Apply This Theme
Import these as constants from a shared file or use inline in StyleSheet.
All screens must use dark backgrounds (`brand-900` or `brand-800`), never white.

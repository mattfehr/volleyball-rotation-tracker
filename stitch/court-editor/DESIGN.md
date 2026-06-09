---
name: Athletic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#42493e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#964900'
  on-secondary: '#ffffff'
  secondary-container: '#fc820c'
  on-secondary-container: '#5e2c00'
  tertiary: '#60233e'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c3a55'
  on-tertiary-container: '#ffaac8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb786'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#723600'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#ffb0cc'
  on-tertiary-fixed: '#3b0520'
  on-tertiary-fixed-variant: '#71314c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  court-green: '#2D5A27'
  athletic-orange: '#F57C00'
  surface-base: '#F8FAFC'
  surface-card: '#FFFFFF'
  text-main: '#0F172A'
  error-red: '#EF4444'
  success-green: '#22C55E'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width-content: 1440px
---

## Brand & Style

The design system is engineered for the high-stakes, fast-paced environment of athletic coaching. It embodies a **Corporate/Modern** aesthetic with a specific focus on **utility and high-contrast legibility**, ensuring that data remains readable even under bright gym lights or on tablet screens at the sideline.

The brand personality is professional, authoritative, and reliable. It avoids unnecessary decoration in favor of structural clarity and functional depth. By combining deep court greens with vibrant athletic oranges, the system creates a visual metaphor for the sport itself—grounded strategy meeting explosive action. The target audience includes coaches, statisticians, and players who require immediate, error-free interaction with complex spatial data.

## Colors

This design system utilizes a high-contrast palette to differentiate between the environment (court) and the interface (controls). 

- **Primary (Court Green):** Used for the main court surface and primary brand elements. It provides a calming, professional foundation.
- **Secondary (Athletic Orange):** Reserved for high-priority interactive states, call-to-action buttons, and the active playing zone of the court.
- **Neutrals (Slate 50-900):** Used for the application shell, typography, and card backgrounds to ensure the interface feels clean and sophisticated.
- **Functional Colors:** Red is strictly used for legality errors (rotation violations), while success green is used for confirmation of saved states and valid rotations.

## Typography

The typography strategy prioritizes speed of recognition. **Hanken Grotesk** is used for headlines to provide a modern, sharp athletic feel. **Inter** is the workhorse for all UI controls, labels, and data entry, chosen for its exceptional legibility at small sizes.

On mobile devices, headlines scale down significantly to preserve screen real estate for the court visualization. Labels use uppercase styling with slight letter spacing to differentiate them from editable data fields.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the dashboard controls while the court itself acts as a **fluid canvas** within its container.

- **Desktop:** A side-bar or multi-pane layout with a 12-column grid. Controls are grouped into cards (spanners of 3-4 columns) while the court occupies the central 8 columns.
- **Tablet/Mobile:** The layout reflows into a single column. The court is pinned to the top of the viewport for constant reference, while player lists and rotation controls sit in a scrollable area below.
- **Rhythm:** A 4px baseline grid ensures tight, disciplined alignment of form elements and player badges.

## Elevation & Depth

To maintain high visibility, the design system uses **Tonal Layers** combined with **Ambient Shadows**. 

1. **Level 0 (Floor):** `surface-base` (#F8FAFC).
2. **Level 1 (Cards/Controls):** White background with a soft, 4px blur shadow (Slate 900 at 5% opacity).
3. **Level 2 (Draggable Players/Modals):** A more pronounced shadow (8px blur, 10% opacity) to indicate the element is lifted and interactive.
4. **Court Depth:** The court uses a slight inner shadow to appear recessed into the interface, focusing the user's attention on the "arena."

## Shapes

The shape language uses a "Rounded" (0.5rem) standard to balance the professional tone with approachable usability. 

- **Player Tokens:** Perfectly circular to represent the player's physical footprint on the court.
- **Buttons & Inputs:** 8px (0.5rem) corner radius.
- **Cards & Court Border:** 16px (1rem) corner radius to create a distinct container for major functional blocks.

## Components

### Buttons
- **Primary:** Athletic Orange with white text. High-contrast, bold weight.
- **Secondary:** Court Green with white text for main navigational actions (Save, Export).
- **Ghost:** Slate 600 text with no background, used for secondary actions like "Remove Player."

### Player Tokens
- Circular badges with a 2px white border to pop against the green/orange court.
- Active player selection is indicated by an Orange outer glow/ring.

### Cards
- White containers with 16px padding. Used for the player list, legality checks, and annotation toolboxes.
- Every card must have a `label-bold` header to categorize its function.

### Input Fields
- Slate 100 background with a 1px Slate 200 border. Focus state uses a 2px Court Green border.
- Condensed vertical padding (8px) to allow for more players to be visible in the list simultaneously.

### Rotation Switcher
- A segmented control (button group) style. The active rotation (R1-R6) uses the Primary color, while inactive ones use a light Slate tint.
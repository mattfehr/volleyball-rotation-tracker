# VolleyTactics Pro - Tactical Library Design Specification

## 🏐 Overview
The Tactical Library serves as the central management hub for coaches to organize, search, and access their saved volleyball rotations and game strategies.

---

## 🎨 Visual Identity (Design System: Athletic Precision)
- **Primary Colors**: 
  - `Athletic Orange` (#f97316): Primary CTAs and active pagination states.
  - `Court Green` (#2d5a27): Header background and brand presence.
- **Typography**: Hanken Grotesk. Large, bold headings for section titles; clear, legible labels for metadata.
- **Shape Language**: `ROUND_EIGHT` (8px corner radius) applied to all cards, buttons, and input fields.
- **Elevation**: Subtle shadows on library cards to provide depth against the light surface background.

---

## 🏗️ Layout Structure

### 1. Header (Global Navigation)
- **Brand Mark**: "VolleyTactics Pro" in Athletic Orange.
- **Nav Links**: Dashboard, Teams, History (Active).
- **Utility Actions**: PDF Export, Settings, Save, and Exit buttons.

### 2. Action Bar
- **Primary CTA**: "New Rotation" button in Athletic Orange with a plus icon.
- **Search & Filter Row**:
  - **Search Bar**: Wide input for searching sessions, teams, or dates.
  - **Filter Dropdowns**: "Date" and "Team" selectors for narrowing results.
  - **View Toggle/Filter Icon**: Secondary action for advanced filtering.

### 3. Library Grid
- **Strategy Cards**:
  - **Thumbnail**: A simplified top-down view of the volleyball court showing player positions (circles).
  - **Title**: Bold name of the strategy (e.g., "Lions vs Spikers").
  - **Metadata**: Timestamp (Date/Time) and Rotation count (e.g., "6 Rotations").
  - **Tag**: Category label (e.g., "V-League Finals", "Practice Sessions").
  - **Actions**: Edit (Pencil) and Delete (Trash) icons at the bottom right.
- **"Create New Strategy" Placeholder**: A dashed-border card with a large plus icon to encourage creation.

### 4. Pagination
- Centered navigation at the bottom.
- Previous/Next arrows and numbered page buttons.
- Active page is highlighted with a `Court Green` or `Athletic Orange` background.

---

## 🧪 Interaction Logic
- **Hover States**: Cards should slightly lift or highlight borders on hover.
- **Action Priority**: "New Rotation" is the most prominent element to drive the primary user flow.
- **Search Filtering**: Real-time filtering of the card grid based on text input or dropdown selection.
- **Empty State**: If no rotations exist, the "Create New Strategy" card should be the primary focus.

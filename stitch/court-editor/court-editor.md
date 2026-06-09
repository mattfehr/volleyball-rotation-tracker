# VolleyTactics Pro - Design Specification & System Reference

## 🏐 Project Overview
VolleyTactics Pro is a high-fidelity volleyball rotation and tactical management platform. It features a vertical dual-team court editor with real-time roster management, rotation legality checking, and annotation tools.

---

## 🎨 Visual Identity (Design System: Athletic Precision)
- **Primary Palette**: 
  - `Athletic Orange` (#FF8C00 / #f97316): Primary actions, active states, and tactical highlights.
  - `Court Green` (#2d5a27): Header backgrounds and secondary branding.
  - `Surface`: Light grey/blue tints (#f8f9ff) for UI panels.
- **Typography**: Hanken Grotesk (Sans-serif). High contrast, bold weights for labels and headlines.
- **Shape Language**: `ROUND_EIGHT` (8px corner radius). Softened edges for buttons, cards, and modals.
- **Shadows**: Soft, medium elevation (shadow-md) for floating panels and modals.

---

## 🏗️ Core Layout Architecture
The application uses a 3-column layout:
1.  **Left Sidebar (Home Team)**: Roster management, Rotation controls (R1-R6, Serve/Receive), and tactical utility buttons.
2.  **Center Canvas (The Court)**: The primary interaction zone. A vertical court with draggable players and annotation overlays.
3.  **Right Sidebar (Away Team)**: Roster management for the opposing team, mirroring the Home Team structure.

---

## 🔘 Key Components & Button Logic

### 1. Navigation & Visibility (Header)
- **Home/Away Toggles**: Located in the center-top. These buttons feature an "eye" icon and text. 
  - *Logic*: Clicking toggles the visibility of the respective half of the court. Hidden sides are dimmed or collapsed.
- **Global Actions**: Top right "Save" (Primary) and "Exit" buttons.
- **Icon Actions**: PDF Export and Settings access.

### 2. Team Roster Sidebars
- **Rotation Selector**: A grid of buttons (R1 to R6). 
  - *Serve/Receive Toggle*: Segmented control to switch the current phase.
- **Legality Checker**: "Check Rotation Legality" button.
- **Roster List**: List of active players with jersey #, name, and position (S, OH, MB, etc.).
- **Player Actions (Three Dots)**: Opens the **Player Edit Modal**.
- **Tactical Utilities**:
  - `Rotate From Previous Row`: Automatically updates positions based on the previous rotation.
  - `Copy From Serve`: Syncs the Receive phase layout with the Serve layout.
- **Add Player**: CTA at the bottom of the roster to append new team members.
- **Active Bench**: A secondary list for players not currently on the court.

### 3. Court Interaction
- **Players**: Draggable circular tokens with initials (e.g., "OH1") and sub-labels for names.
- **Annotation Toolbar**: Floating vertical bar (usually near the court center-right).
  - Tools: Pen, Highlight, Erase, Clear, Undo, Layers.
- **Ten-Foot Line**: Positioned accurately at 1/3 distance from the net.

### 4. Player Edit Modal (Popup)
- **Trigger**: Click on any player's "Three Dots" menu.
- **Fields**: Name (Text), Jersey Number (Number), Position (Dropdown: S, OH, OP, MB, L, DS), and Zone (Dropdown: 1-6).
- **Actions**: "Save" (Success green/orange) and "Cancel" (Ghost/Outline).

---

## 🧪 Tactical Logic for AI Generation
When generating or modifying this design:
- **Vertical Symmetry**: Ensure the Home side (Bottom) and Away side (Top) are functionally symmetrical but visually distinct (different player colors or branding).
- **Active State**: The currently selected Rotation (e.g., R1) must have a high-contrast background (Athletic Orange).
- **Responsive Layout**: On desktop, sidebars are fixed. On mobile, these should collapse into drawers or bottom sheets.
- **Court Zones**: Maintain the standard 1-6 volleyball zones for legality checking logic.

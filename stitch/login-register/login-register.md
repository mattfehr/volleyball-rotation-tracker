# VolleyTactics Pro - Authentication Flow Design Specification

## 🏐 Overview
The Authentication Flow provides a professional, "Elite Coaching" entry point into the VolleyTactics Pro ecosystem. It utilizes a split-screen layout to balance high-impact visual branding with functional clarity.

---

## 🎨 Visual Identity (Design System: Athletic Precision)
- **Primary Colors**:
  - `Athletic Orange` (#f97316): Primary action buttons and focus states.
  - `Court Green` (#2d5a27): Brand highlights and success indicators.
  - `Surface`: Clean white (#ffffff) or light grey/blue (#f8f9ff) for the form container.
- **Typography**: Hanken Grotesk.
  - Headings: Bold, high-contrast (e.g., `text-2xl font-bold`).
  - Labels: Uppercase, bold, slightly smaller (e.g., `text-xs font-bold uppercase tracking-wider`).
- **Shape Language**: `ROUND_EIGHT` (8px corner radius) applied to all buttons and input fields.
- **Imagery**: High-fidelity, cinematic view of a professional volleyball arena under dramatic lighting.

---

## 🏗️ Layout Architecture (Split View)
The authentication screens use a 50/50 split-screen layout on desktop:

### 1. Left Side (Branding & Identity)
- **Visual**: Full-bleed background image of a volleyball stadium ({{DATA:IMAGE:IMAGE_12}}).
- **Overlays**:
  - **Logo**: "VolleyTactics Pro" wordmark in the top left.
  - **Tagline**: "Precision Strategy, Championship Results." in bold white/orange text.
  - **Social Proof**: "500+ Pro Teams" and "12k+ Tactical Drills" counters at the bottom left.

### 2. Right Side (Form Container)
- **Alignment**: Vertically centered form within the white surface area.
- **Header**: Clear title (e.g., "Coach Login" or "Create Coach Account") with a brief instructional subtext.
- **Input Fields**:
  - Styled with icons (Username/Email/Password).
  - Placeholder text follows a "e.g. coach_smith" format.
- **Primary Action**: Full-width button in `Athletic Orange` with a trailing arrow icon.
- **Secondary Actions (The Toggles)**:
  - "Return to Login" (on Register page) or "Register New Account" (on Login page).
  - These are styled as outlined or ghost buttons to maintain hierarchy.
- **Third-Party Auth**: "Sign in with Google" and "Apple" buttons located below a horizontal "OR" divider.
- **Footer Links**: Small, subtle links for Terms, Privacy, and Support.

---

## 🧪 Interaction Logic
- **Seamless Toggling**: Clicking the "Register" or "Login" toggle buttons should switch the right-side form content without reloading the left-side visual or causing layout shifts.
- **Form States**:
  - `Hover`: Input fields should have a subtle border color shift.
  - `Active/Focus`: Athletic Orange border for active inputs.
  - `Button Hover`: Slight scale-up or brightness increase for the primary CTA.
- **Error Handling**: Inline red text for validation errors, maintaining the clean 8px rounded styling.

---

## 💾 Asset Reference
- **Hero Image**: {{DATA:IMAGE:IMAGE_12}}
- **Design System ID**: {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}
- **Core Screens**: {{DATA:SCREEN:SCREEN_25}} (Login), {{DATA:SCREEN:SCREEN_11}} (Register)

# Volleyball Rotation Tracker

An interactive web app for creating, visualizing, and managing 6-player volleyball rotations — complete with draggable players, legality checks, court annotations, cloud storage, and PDF export.

Built with **React (Vite)** and **Firebase** for authentication and per-user rotation storage. The live UI is branded **VolleyTactics Pro**.

**Live demo:** [volleyball-rotations-f1f4d.web.app](https://volleyball-rotations-f1f4d.web.app) · [Video walkthrough](https://youtu.be/YApuQVzlr2E)

---

## Features

- **Dual-team rotation editor** — Home and away teams with independent serve/receive views (R1–R6, S1–S6)
- **Draggable court players** — Position players with zone snapping and custom labels
- **Roster management** — Add, edit, and drag players between roster and court
- **Rotation legality checker** — Validates overlapping zone rules before save
- **Court annotation tools** — Pen, highlight, eraser, and undo on a canvas overlay
- **Cloud library** — Save, load, rename, delete, search, filter, and sort rotations per user
- **PDF export** — Download all six receive rotations in a single document
- **Username-based auth** — Sign up with a username (stored as `username@vbrt.com` internally); optional "Keep me logged in" for session persistence

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4, React Router 7 |
| Auth & database | Firebase Authentication + Firestore (direct client SDK) |
| Drag & drop | `@dnd-kit/core` |
| PDF generation | `html-to-image` + `jsPDF` |
| Hosting | Firebase Hosting (static SPA) |

There is no custom backend server today — all application logic runs in the browser and talks directly to Firebase.

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/mattfehr/volleyball-rotation-tracker.git
cd volleyball-rotation-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These map to the config in `src/firebase.ts`. The `.env` file is gitignored.

### 4. Start the dev server

```bash
npm run dev
```

### Other scripts

```bash
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

---

## Deployment

The app is deployed to **Firebase Hosting**:

```bash
npm run build
firebase deploy
```

Hosting config lives in `firebase.json` (serves `dist/` with SPA rewrites). The Firebase project is configured in `.firebaserc`.

---

## Project Structure

```
src/
├── App.tsx                    # Routes and auth guards
├── firebase.ts                # Firebase init and auth persistence defaults
├── contexts/
│   └── AuthContext.tsx        # Auth state via onAuthStateChanged
├── components/
│   ├── AuthForm.tsx           # Login and registration
│   ├── CourtEditor.tsx        # Main rotation editor
│   ├── Court.tsx              # Draggable court layout
│   ├── CanvasOverlay.tsx      # Annotation canvas
│   ├── Library.tsx            # Saved rotations library
│   ├── CourtThumbnail.tsx     # Library card previews
│   ├── library/
│   │   └── LibraryFilterBar.tsx
│   └── editor/
│       ├── TopNavBar.tsx
│       ├── TeamSidebar.tsx
│       ├── RosterList.tsx
│       ├── RotationControls.tsx
│       ├── ToolPalette.tsx
│       ├── PlayerEditModal.tsx
│       ├── PdfExportDialog.tsx
│       ├── ConfirmDialog.tsx
│       └── Toast.tsx
├── lib/
│   ├── firestore.ts           # Firestore reads/writes and legacy migration
│   ├── courtZones.ts          # Zone snapping and validation
│   ├── rotationViews.ts       # Serve/receive view keys
│   └── libraryFilters.ts      # Search, filter, and sort logic
└── models/
    ├── Player.ts
    └── Team.ts
```

Design mockups (not used by the app) are in `stitch/`.

### Routes

| Path | Purpose |
|------|---------|
| `/auth` | Login and registration |
| `/library` | Saved rotations (default landing page after login) |
| `/` | Court editor |

### Firestore data model

```
users/{uid}                          → { username }
users/{uid}/rotations/{rotationId}   → { title, home, away, annotations, createdAt, updatedAt }
```

---

## Current State: Friends & Small Group Use

Today the app works well as a personal or small-group tool:

- Firebase Hosting serves the SPA globally with no server to maintain
- Per-user cloud storage keeps each coach's rotations isolated by account
- The court editor, library, annotations, and PDF export are fully functional on desktop
- Auth is simple — username + password, no real email required

That simplicity is a tradeoff. Several things are acceptable for a trusted circle but would need hardening before opening the app to the general public.

---

## Future Improvements: Path to Public Production

The items below are gaps between "works for me and my friends" and "safe, reliable, and maintainable for many users on the open web." Grouped by priority area.

### Security & data protection (blockers)

| Gap | Why it matters |
|-----|----------------|
| **Firestore security rules in repo** | Rules are not version-controlled here. Production needs explicit rules enforcing `request.auth.uid == userId` on all reads/writes, field validation, and document size limits. |
| **Firebase App Check** | Prevents scripted abuse of Auth and Firestore from non-app clients. |
| **Auth rate limiting & account lockout** | No protection against credential stuffing or registration spam. |
| **Security headers on hosting** | `firebase.json` has no CSP, HSTS, `X-Frame-Options`, or similar headers. |
| **Input validation & schema enforcement** | Titles, player names, and annotation payloads have minimal length/format checks. A schema layer (e.g. Zod) on writes would prevent corrupt or oversized documents. |
| **Error message sanitization** | Raw Firebase error strings are shown to users in the auth form. |

### Authentication & accounts

| Gap | Why it matters |
|-----|----------------|
| **Password recovery** | Users register with fake emails (`username@vbrt.com`), so there is no way to reset a forgotten password — a permanent lockout for public users. |
| **Real email or admin recovery flow** | Needed for account recovery, notifications, and abuse response. |
| **Username uniqueness** | Two users can register the same display username; only UID is unique. |
| **Stronger password policy** | Only Firebase's default minimum (6 characters) is enforced. |
| **Account deletion & data export** | No self-service delete or GDPR/CCPA-style data export. |

### Legal & compliance

| Gap | Why it matters |
|-----|----------------|
| **Terms of Service page** | Footer links are placeholders (`href="#"`). Public deployment requires real, accessible ToS. |
| **Privacy Policy page** | Required to explain what coaching data is collected, how Firebase stores it, and retention practices. |
| **Cookie / analytics consent** | No consent flow if analytics or third-party scripts are added. |
| **Youth sports context (COPPA)** | If used by school or youth programs, age-appropriate data handling may be required. |

### Mobile & responsive design

| Gap | Why it matters |
|-----|----------------|
| **Court editor mobile layout** | Editor uses fixed sidebars (`w-72`) and fixed court pixel dimensions — unusable on phones in portrait. Auth and library pages are partially responsive; the editor is not. |
| **Annotation scrolling on touch** | Known issue: drawing on mobile can conflict with page scroll. |
| **Collapsible sidebars / mobile nav** | Editor chrome needs a hamburger or bottom-sheet pattern for small screens. |
| **Touch-optimized controls** | Toolbar buttons and drag targets may need larger hit areas on touch devices. |

### Backend, infrastructure & scaling

| Gap | Why it matters |
|-----|----------------|
| **Dedicated backend API** | Today the browser calls Firestore directly. A hosted API (Cloud Functions, Cloud Run, or similar) enables server-side validation, business logic, webhooks, and secrets that never ship to the client. |
| **Firestore query pagination** | Library loads all rotations into memory, then paginates in the UI. Users with large libraries will hit latency and cost limits. |
| **Firestore composite indexes** | No `firestore.indexes.json` in repo; advanced server-side filtering will need indexed queries. |
| **Caching layer (e.g. Redis)** | Not needed at current scale with direct Firestore reads, but becomes relevant with a backend API serving aggregated data, sessions, or rate-limit counters at higher traffic. |
| **CDN & asset optimization** | Static hosting uses Firebase CDN, but fonts load from Google Fonts CDN, there is no code splitting, and the main bundle is large. |
| **Load balancing & multi-region** | Single Firebase project; fine for moderate traffic, but high availability would need deliberate architecture (multi-region Firestore, redundant hosting, health checks). |
| **Staging / preview environments** | Deploys are manual to production with no CI preview channels or staging project. |

### Operations, reliability & observability

| Gap | Why it matters |
|-----|----------------|
| **Automated tests** | No unit, integration, or E2E tests. Regressions in rotation legality, save/load, or auth are caught only by manual testing. |
| **CI/CD pipeline** | No GitHub Actions (or similar) running lint, build, and deploy on merge. |
| **Error monitoring** | Errors go to `console.error` only. Production needs Sentry, Firebase Crashlytics, or equivalent. |
| **Analytics** | No usage analytics (feature adoption, save failures, PDF export success rate) to guide product decisions. |
| **Uptime monitoring** | No external health checks on the live site. |
| **React Error Boundary** | An unhandled render error can white-screen the entire app. |

### Performance & data limits

| Gap | Why it matters |
|-----|----------------|
| **Annotation document size** | Annotations are stored inline in rotation documents. Heavy drawing approaches Firestore's 1 MiB document limit. |
| **Client-side PDF export** | Renders six court views via `html-to-image` on the main thread — slow and memory-heavy on low-end devices. Server-side or Web Worker PDF generation would scale better. |
| **Offline / PWA support** | No service worker or installable PWA for courtside use without connectivity. |
| **Firestore offline persistence** | Not enabled; coaches lose read access when offline. |

### Product & collaboration features

| Gap | Why it matters |
|-----|----------------|
| **Team / shared editing** | Rotations are single-user only. Real programs need shared team libraries or coach-to-coach sharing. |
| **Real-time collaboration** | No live co-editing (Firestore listeners or WebSockets). |
| **Role-based access** | No head coach vs. assistant vs. player roles. |
| **Public or shareable rotation links** | No read-only link to share a rotation without an account. |

### Developer experience & repo hygiene

| Gap | Why it matters |
|-----|----------------|
| **`.env.example`** | New contributors must read `firebase.ts` to discover required variables. |
| **Firestore rules & indexes in repo** | Infrastructure-as-code for Firebase security and queries. |
| **Unused dependencies** | `react-draggable` is listed but unused. |
| **README / branding alignment** | Repo name differs from in-app "VolleyTactics Pro" branding. |

---

## Suggested rollout order

If moving toward public deployment, a practical sequence:

1. **Firestore security rules** — non-negotiable before inviting strangers
2. **Mobile-responsive court editor** — largest UX gap for real-world use
3. **Password recovery or real email auth** — prevents permanent account lockout
4. **Privacy Policy & Terms of Service** — legal baseline for public users
5. **CI/CD + automated tests** — catch regressions as the codebase grows
6. **Error monitoring & analytics** — understand failures and usage in production
7. **Server-side pagination & validation** — via Cloud Functions or a dedicated API as user count grows
8. **App Check, security headers, account deletion** — harden against abuse and meet compliance expectations

---

## Author

**Matthew Fehr**  
CS @ CSULB · [GitHub](https://github.com/mattfehr)

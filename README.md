# 🏐 Volleyball Rotation Tracker

An interactive web app for creating, visualizing, and managing 6-player volleyball rotations — complete with draggable players, legality checks, annotation tools, and PDF export.

Built with **React (Vite)** and powered by **Firebase** for user authentication and cloud-synced rotation storage.

---

## ✨ Features

- 🔄 **Six Rotation Editor** – Easily navigate between 6 saved rotations
- 🖱️ **Draggable Players** – Set and customize positions and labels
- 🚦 **Rotation Legality Checker** – Validate player positioning rules
- 🧽 **Court Annotation Tools** – Draw, highlight, erase directly on the court
- 💾 **Save to Cloud** – Securely store rotations per user via Firebase
- 📄 **Export to PDF** – Download all six rotations in a single document
- 🧑‍💻 **Username-based Auth** – Simple, no-real-email sign-up experience

---

## 🚀 Live Demo

- 👉 [Website](https://volleyball-rotations-f1f4d.web.app)
- 👉 [Video Demonstration](https://youtu.be/YApuQVzlr2E)

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Auth & Database**: Firebase Authentication + Firestore
- **PDF Generation**: [html-to-image](https://github.com/bubkoo/html-to-image) + [jsPDF](https://github.com/parallax/jsPDF)
- **Canvas Drawing**: Custom HTML5 canvas overlay per rotation

---

## 🔧 Local Development

### 1. Clone the repo
```bash
git clone https://github.com/your-username/volleyball-rotation-tracker.git
cd volleyball-rotation-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file (if needed)
You’ll need Firebase project credentials. Add them to `.env` or hardcode into your `firebase.ts` for dev.

### 4. Start the app
```bash
npm run dev
```

---

## 🧪 Deployment (Firebase Hosting)

To deploy:

```bash
npm run build
firebase deploy
```

Make sure you've run `firebase init hosting` and selected the correct Firebase project.

---

## 📁 Project Structure

```
src/
  ├─ components/
  │   ├─ Court.tsx
  │   ├─ CanvasOverlay.tsx
  │   └─ AuthForm.tsx
  ├─ pages/
  │   └─ CourtEditor.tsx
  ├─ contexts/
  │   └─ AuthContext.tsx
  ├─ lib/
  │   └─ firestore.ts
  ├─ models/
  │   ├─ Player.ts
  │   └─ Tool.ts (optional)
```

---

## 🧠 Future Improvements

- Mobile layout / responsive design
- Team mode or shared editing
- Advanced filtering/search in the library
- Custom player colors or jersey numbers
- Real-time collaboration (via Firestore or WebSockets)

## 🙋‍♂️ Author

**Matthew Fehr**  
CS @ CSULB · [GitHub](https://github.com/mattfehr)

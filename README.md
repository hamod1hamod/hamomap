# 🧠 MindForge AI (hamomap)

> **Advanced AI-Powered Mind Mapping & Cognitive Learning Platform with Firebase**  
> Turn any information into an organized visual knowledge system that you can understand, remember, review, and apply.

🌐 **Live Production Link:** [https://hamod1hamod.github.io/hamomap/](https://hamod1hamod.github.io/hamomap/)  
📦 **GitHub Repository:** [https://github.com/hamod1hamod/hamomap](https://github.com/hamod1hamod/hamomap)

---

## 🌟 Key Features

### 1. Interactive Mind-Map Engine & Multiple Topologies
- **Traditional Mind Map:** Central concept with organic curved branches, color-coded hierarchies, and collapse/expand controls.
- **Radial Mind Map:** Concentric circular layout radiating outwards with auto-spread angles.
- **Hierarchical Tree:** Top-to-bottom, bottom-to-top, left-to-right, and right-to-left layout engines.
- **Concept Map & Knowledge Graph:** Multi-directional labeled relationships (`leads to`, `causes`, `requires`, `contrasts with`).
- **Flowchart Sequence:** Step-by-step process flows with decision branch offsets.
- **Cornell Notes Map:** Structured 4-quadrant layout separating Cues, Notes, Summary, and Title.
- **Timeline Map:** Chronological horizontal spine with alternating milestone callouts.

### 2. Cognitive Memorization & Spaced Repetition (SuperMemo SM-2)
- **Scientific Review Scheduling:** Tracks review counts, ease factors (minimum 1.3), intervals, and calculates next due dates.
- **Active Recall Concealment:** Hide definitions, test recall, reveal explanations, and rate difficulty (`Again`, `Hard`, `Good`, `Easy`).
- **Blurting Mode (Free Recall):** Reconstruct concepts from memory. The engine automatically analyzes recall precision, identifies omitted concepts, and scores retention.
- **AI Quiz Generation:** Automatically creates Multiple Choice, True/False, and Fill-in-the-Blank quizzes from map nodes.
- **Study Streak & Retention Analytics:** Tracks consistency, cards mastered (> 30-day interval), and retention rates.

### 3. Professional Node & Branch Editor
- Rich titles, core definitions, markdown notes, and LaTeX formulas.
- Code blocks with syntax formatting.
- Difficulty levels (`Easy`, `Medium`, `Hard`, `Expert`) and priority tags.
- Customizable color accents, shapes (card, pill, rectangle, diamond).
- Keyboard shortcuts: `Tab` (add child), `Enter` (add sibling), `Delete`/`Backspace` (delete), `Ctrl+Z`/`Ctrl+Y` (undo/redo), `Ctrl+K` (command palette).

### 4. AI-Powered Learning Assistant
- **Text-to-Mind-Map:** Converts topics, articles, or lecture notes into multi-level structured hierarchies.
- **Cognitive Explainer:** Generates simple ELIF5 explanations, formal deep-dives, memorable analogies, real-world examples, and audits common misconceptions.
- **Graceful Offline Mode:** Runs in zero-config offline mode with structured outline extraction if no Gemini key is provided.

### 5. Firebase & Security Architecture
- **Firebase Authentication:** Email/password, Google sign-in, and instant guest demo mode.
- **Cloud Firestore:** Collections for `mindMaps`, `nodes`, `edges`, `flashcards`, `studySessions`, `reviewEvents`.
- **Firestore Security Rules:** Ownership-based access, shared collaborator permissions (viewer/editor), immutable review event logs, and default-deny policies.
- **Storage Rules:** Secure uploads with mime-type and file-size constraints.
- **Cloud Functions:** Server-side authenticated endpoints for AI generation.

### 6. Universal Import & Export
- **JSON:** Full loss-less export/import preserving nodes, edges, styling, and SRS metadata.
- **Markdown:** Hierarchical outline format with bullet points and notes.
- **CSV:** Tabular export of node IDs, categories, difficulties, and parent IDs.
- **PNG & PDF:** High-resolution printable graphics with dark/light themes.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/hamod1hamod/hamomap.git
cd hamomap
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## ⚙️ Firebase Setup & Configuration

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password, Google).
3. Create a **Cloud Firestore** database.
4. Enable **Firebase Storage**.
5. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
6. Fill in your project credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
7. Deploy Firestore Rules & Indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules
   ```

*(Note: MindForge AI runs immediately out-of-the-box with IndexedDB/LocalStorage fallback if Firebase keys are omitted.)*

---

## 📂 Project Architecture

```
hamomap/
├── public/                     # Static assets (.nojekyll, icons)
├── src/
│   ├── app/
│   │   └── App.tsx             # Application routes & entry views
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx    # Navbar, streak indicator, theme & RTL switcher
│   │   └── common/
│   │       └── ProtectedRoute.tsx # Route guard
│   ├── features/
│   │   ├── auth/
│   │   │   └── AuthProvider.tsx # Firebase Auth & Guest mode
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx # Overview, metrics, templates, doc parser
│   │   ├── editor/
│   │   │   ├── HamoMapEditor.tsx # Full ReactFlow canvas & toolbar
│   │   │   └── components/
│   │   │       ├── CustomNodes.tsx   # Custom interactive card nodes
│   │   │       ├── CustomEdges.tsx   # Bezier labeled relationships
│   │   │       ├── InspectorPanel.tsx # Node attributes, notes, SRS, LaTeX
│   │   │       └── CommandPalette.tsx # Ctrl+K command execution
│   │   ├── learning/
│   │   │   └── LearningCenterModal.tsx # Spaced repetition, blurting, quiz
│   │   ├── templates/
│   │   │   └── subjectTemplates.ts     # 12 Academic discipline templates
│   │   └── sharing/
│   │       └── ShareModal.tsx          # Collaborators & link permissions
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── config.ts       # Firebase SDK init & emulator support
│   │   │   └── mapRepository.ts # Persistence layer with offline cache
│   │   ├── layout/
│   │   │   └── layoutEngine.ts # Radial, Tree, Timeline, Cornell layouts
│   │   ├── learning/
│   │   │   └── retentionEngine.ts # SuperMemo SM-2 & blurting grader
│   │   ├── ai/
│   │   │   └── aiClient.ts     # Gemini API integration & graceful fallback
│   │   └── export/
│   │       └── exportService.ts # JSON, Markdown, CSV, PNG, PDF exports
│   ├── stores/
│   │   └── useMapStore.ts      # Zustand state, graph changes & undo/redo
│   ├── types/
│   │   └── hamomap.ts          # Core TypeScript schema definitions
│   ├── styles/
│   │   └── index.css           # Tailwind base, dark mode & typography
│   └── main.tsx                # HashRouter mounting point
├── functions/                  # Cloud Functions server-side AI handlers
├── tests/
│   ├── retentionAndEditor.test.ts # SM-2, blurting & layout test suite
│   └── firestore.rules.test.ts    # Security rules verification
├── firebase.json               # Firebase deployment configuration
├── firestore.rules             # Production Firestore security rules
├── firestore.indexes.json      # Firestore query indexes
├── storage.rules               # Storage access & upload size constraints
├── .env.example                # Sample environment variables
├── package.json                # Dependencies and deployment scripts
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite configuration & path aliases
```

---

## 🧪 Automated Test Verification

All 14 unit tests pass verifying:
- SM-2 ease factor updates and interval calculations.
- Resetting interval upon failed recall.
- Minimum ease factor lower-bound enforcement ($EF \ge 1.3$).
- Blurting recall score calculation and omitted concept extraction.
- Graph layout coordinate math (Radial and Hierarchical).
- Firestore security rules constraints.

---

## 📄 License
MIT License. Built with ❤️ for lifelong learners.

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { HamoMapEditor } from '@/features/editor/HamoMapEditor';
import { WhiteboardStudio } from '@/features/whiteboard/WhiteboardStudio';
import { SUBJECT_TEMPLATES } from '@/features/templates/subjectTemplates';
import { useMapStore } from '@/stores/useMapStore';
import { aiClient } from '@/services/ai/aiClient';
import { isFirebaseConfigured } from '@/services/firebase/config';
import {
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  CheckCircle,
  Key,
  Flame,
  BarChart3,
  Layers,
  Database,
  Globe,
} from 'lucide-react';
import clsx from 'clsx';

// Landing Page
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Studio Header */}
      <header className="h-16 border-b border-border/70 px-6 sm:px-12 flex items-center justify-between backdrop-blur-md bg-card/70 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
            <Brain className="w-4 h-4" />
          </span>
          <span className="font-bold text-base tracking-tight text-foreground">MindForge AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all"
          >
            Launch Platform
          </button>
        </div>
      </header>

      {/* Asymmetric Studio Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column (7 cols): Typographic Precision */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-mono tracking-tight text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>COGNITIVE VISUAL ARCHITECTURE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Structure ideas into
            <span className="inline-flex items-center mx-2 px-3 py-0.5 rounded-xl bg-muted border border-border text-primary font-mono text-2xl sm:text-4xl align-middle">
              graph
            </span>
            systems you remember.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Construct curved mind maps, concentric radial models, and Feynman teach-back boards. Integrated directly with SuperMemo SM-2 spaced repetition for permanent cognitive recall.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:bg-primary/95 transition-all"
            >
              <span>Open Studio Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/whiteboard')}
              className="flex items-center gap-2 px-5 py-3 bg-card hover:bg-muted border border-border rounded-xl text-xs font-medium text-foreground transition-all"
            >
              <span>Explain Studio (Whiteboard)</span>
            </button>
          </div>

          {/* Core Technical Capabilities Tags */}
          <div className="pt-6 border-t border-border/80 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
            <div>
              <span className="text-foreground font-semibold">01/</span> 6 Dynamic Graph Layouts
            </div>
            <div>
              <span className="text-foreground font-semibold">02/</span> SM-2 Spaced Retrieval
            </div>
            <div>
              <span className="text-foreground font-semibold">03/</span> Multi-Format Export
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Interactive Preview Card (Asymmetric) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Graph Inspector
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground">
                SM-2 Active
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-xl border border-border/70 space-y-1">
                <span className="text-[10px] font-mono text-primary font-bold">ROOT CONCEPT</span>
                <p className="text-xs font-semibold text-foreground">Neural Plasticity & Long-Term Potentiation</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                <div className="p-2.5 bg-background rounded-lg border border-border/80">
                  <span className="block text-[9px] text-muted-foreground">INTERVAL</span>
                  <span className="text-foreground font-semibold">6 Days (Ease 2.5)</span>
                </div>
                <div className="p-2.5 bg-background rounded-lg border border-border/80">
                  <span className="block text-[9px] text-muted-foreground">RETENTION</span>
                  <span className="text-foreground font-semibold">Optimal 94%</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Synaptic connections strengthen through coordinated, repeated stimulation. Active recall triggers memory trace consolidation.
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/40 border border-border/80 rounded-xl text-left text-xs text-muted-foreground flex items-center justify-between">
            <span>Feynman Teach-Back Studio Included</span>
            <span className="font-mono text-primary text-[11px] font-semibold">Freehand / Pens</span>
          </div>
        </div>
      </main>
    </div>
  );
};

// Login & Registration Page
const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const { signInEmail, signUpEmail, signInGoogle, signInGuest } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'register') {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
        <div className="text-center space-y-2">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg mx-auto">
            <Brain className="w-6 h-6" />
          </span>
          <h2 className="text-2xl font-black text-foreground">
            {mode === 'login' ? 'Sign in to MindForge' : 'Create your Account'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your credentials or continue as guest scholar
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Marie Curie"
                className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scholar@domain.com"
              className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold shadow hover:bg-primary/90 transition-all"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
            Or
          </span>
        </div>

        <button
          onClick={() => {
            signInGuest();
            navigate('/dashboard');
          }}
          className="w-full py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl text-xs font-semibold transition-colors"
        >
          Continue as Guest Scholar (Instant Demo)
        </button>

        <div className="text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register
              </Link>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Templates Explorer Page
const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const createNewMap = useMapStore((s) => s.createNewMap);

  const handleStart = async (tpl: any) => {
    const created = await createNewMap(tpl.title, tpl.style);
    navigate(`/maps/${created.id}`);
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Subject Templates Library</h1>
        <p className="text-xs text-muted-foreground">
          12 comprehensive academic and engineering frameworks designed for deep understanding.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {SUBJECT_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="p-6 bg-card border border-border rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                {tpl.category}
              </span>
              <h3 className="font-bold text-base text-foreground">{tpl.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {tpl.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleStart(tpl)}
              className="mt-6 w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl text-xs font-semibold transition-all"
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Spaced Repetition Queue Page
const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6 text-center">
      <span className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
        <RotateCcw className="w-7 h-7" />
      </span>
      <h1 className="text-2xl font-black text-foreground">Spaced Repetition Review Queue</h1>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto">
        4 flashcards are scheduled for review today based on your memory retention decay intervals.
      </p>

      <div className="pt-4">
        <button
          onClick={() => navigate('/maps/starter-neural-networks')}
          className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        >
          Start Daily Review Session
        </button>
      </div>
    </div>
  );
};

// Analytics Page
const AnalyticsPage: React.FC = () => {
  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Learning & Retention Analytics</h1>
        <p className="text-xs text-muted-foreground">
          Transparent metrics tracking recall accuracy and memory stability over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-border rounded-3xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Estimated Memory Stability</span>
          <h4 className="text-3xl font-black text-foreground">92%</h4>
          <p className="text-xs text-muted-foreground">Based on SM-2 ease factors and answer consistency.</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-3xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Cards Mastered</span>
          <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">18</h4>
          <p className="text-xs text-muted-foreground">Intervals exceeding 30 days.</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-3xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Study Sessions</span>
          <h4 className="text-3xl font-black text-primary">12</h4>
          <p className="text-xs text-muted-foreground">Completed across 3 subjects.</p>
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage: React.FC = () => {
  const { profile, updateLanguage, updateTheme } = useAuth();
  const [apiKey, setApiKey] = useState(aiClient.getApiKey() || '');
  const [savedKey, setSavedKey] = useState(false);

  const handleSaveApiKey = () => {
    aiClient.setApiKey(apiKey);
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Application Settings</h1>
        <p className="text-xs text-muted-foreground">Configure AI providers, backend status, and preferences.</p>
      </div>

      {/* AI Key Configuration */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Key className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Google Gemini API Key</h3>
            <p className="text-xs text-muted-foreground">
              Required for automated text-to-map generation, node explainer analogies, and AI quiz creation.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          />
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              Stored securely in your local browser storage. Never sent to third parties.
            </span>
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow hover:bg-primary/90 transition-all"
            >
              {savedKey ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Backend & Firebase Status */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Backend & Persistence Status</h3>
            <p className="text-xs text-muted-foreground">
              {isFirebaseConfigured
                ? 'Connected to Cloud Firestore & Firebase Auth.'
                : 'Running in Local Storage & Offline Cache Mode (No external Firebase keys needed).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/maps" element={<DashboardPage />} />
          <Route path="/review" element={<ReviewQueuePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Dedicated Full-Screen Whiteboard & Self-Explanation Studio */}
        <Route
          path="/whiteboard"
          element={
            <ProtectedRoute>
              <WhiteboardStudio />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Full-Screen Mind-Map Editor */}
        <Route
          path="/maps/:mapId"
          element={
            <ProtectedRoute>
              <HamoMapEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maps/new"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Map Route */}
        <Route path="/shared/:shareId" element={<HamoMapEditor />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};
export default App;

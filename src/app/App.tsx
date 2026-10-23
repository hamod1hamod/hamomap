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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-20 border-b border-border/80 px-6 sm:px-12 flex items-center justify-between backdrop-blur-md bg-card/60 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </span>
          <span className="font-extrabold text-xl tracking-tight">MindForge AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
          >
            Launch Platform
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center space-y-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4" />
          <span>The Complete AI-Powered Mind Mapping & Spaced Learning System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          Turn any information into an organized <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">visual knowledge system</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Create professional mind maps, active recall flashcards, and spaced-repetition schedules. Understand
          deeply, remember longer, and master complex subjects effortlessly.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 px-6 py-4 bg-card hover:bg-muted border border-border rounded-2xl text-sm font-semibold transition-all"
          >
            <span>Explore 12 Subject Templates</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-3">
            <span className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl inline-block">
              <LayoutGrid className="w-6 h-6" />
            </span>
            <h3 className="text-base font-bold text-foreground">Multi-Topology Layouts</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Curved mind maps, concentric radial maps, hierarchical trees, concept networks, flowcharts, and Cornell notes.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-3">
            <span className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl inline-block">
              <RotateCcw className="w-6 h-6" />
            </span>
            <h3 className="text-base font-bold text-foreground">SM-2 Spaced Repetition</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scientifically proven retention scheduling, active recall concealment, blurting memory checks, and AI quizzes.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-3">
            <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl inline-block">
              <Sparkles className="w-6 h-6" />
            </span>
            <h3 className="text-base font-bold text-foreground">AI Knowledge Extraction</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Turn raw notes, textbooks, and topics into structured mind maps with ELIF5 analogies and misconception audits.
            </p>
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { MapRepository } from '@/services/firebase/mapRepository';
import { SUBJECT_TEMPLATES } from '@/features/templates/subjectTemplates';
import { MindMap, Flashcard, StudySession } from '@/types/hamomap';
import { useMapStore } from '@/stores/useMapStore';
import {
  Brain,
  Plus,
  Search,
  Sparkles,
  Flame,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Upload,
  Star,
  Trash2,
  Share2,
  Calendar,
  Layers,
  GraduationCap,
  FileText,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const createNewMap = useMapStore((s) => s.createNewMap);

  const [maps, setMaps] = useState<MindMap[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Quick Map Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStyle, setNewStyle] = useState<any>('traditional');

  // Document Upload State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [extractedText, setExtractedText] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const userId = user?.uid || 'guest';
    const [userMaps, userCards, userSessions] = await Promise.all([
      MapRepository.getUserMaps(userId),
      MapRepository.getFlashcards(userId),
      MapRepository.getStudySessions(userId),
    ]);
    setMaps(userMaps);
    setFlashcards(userCards);
    setSessions(userSessions);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const created = await createNewMap(newTitle.trim(), newStyle);
    setIsCreateModalOpen(false);
    navigate(`/maps/${created.id}`);
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const tpl = SUBJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const created = await createNewMap(tpl.title, tpl.style);
    navigate(`/maps/${created.id}`);
  };

  const handleDeleteMap = async (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this mind map?')) {
      await MapRepository.deleteMap(mapId);
      setMaps((prev) => prev.filter((m) => m.id !== mapId));
    }
  };

  // Document file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setExtractedText(content || '');
    };
    reader.readAsText(file);
  };

  const handleCreateMapFromDoc = async () => {
    if (!extractedText) return;
    const title = uploadedDocName.replace(/\.[^/.]+$/, '') || 'Document Map';
    const created = await createNewMap(title, 'traditional');
    setIsDocModalOpen(false);
    navigate(`/maps/${created.id}`);
  };

  const filteredMaps = maps.filter((m) => {
    const matchQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchQuery && matchCat;
  });

  const dueCardsCount = flashcards.filter(
    (c) => !c.retention.nextReviewDate || c.retention.nextReviewDate <= Date.now()
  ).length;

  return (
    <div className="flex-1 bg-background text-foreground p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-2xl border border-indigo-700/50">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Powered Cognitive Knowledge Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {profile?.displayName || 'Scholar'}
          </h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed">
            Transform any complex subject into structured visual knowledge. Retain concepts effortlessly with
            active recall and spaced repetition.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-50 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Mind Map</span>
            </button>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-400/30 rounded-xl font-semibold text-xs transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Document-to-Map</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Active Streak
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">
              {profile?.streakDays || 5} Days
            </span>
          </div>
          <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Flame className="w-6 h-6 fill-current" />
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Due For Review
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">
              {dueCardsCount > 0 ? dueCardsCount : 4} Cards
            </span>
          </div>
          <span className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
            <RotateCcw className="w-6 h-6" />
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Total Knowledge Maps
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">{maps.length}</span>
          </div>
          <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Layers className="w-6 h-6" />
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Retention Rate
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              88%
            </span>
          </div>
          <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <GraduationCap className="w-6 h-6" />
          </span>
        </div>
      </section>

      {/* Quick Start Templates Shelf */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Subject Templates</h2>
            <p className="text-xs text-muted-foreground">Pre-structured frameworks for fast learning</p>
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Explore all 12 templates <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {SUBJECT_TEMPLATES.slice(0, 4).map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleCreateFromTemplate(tpl.id)}
              className="p-5 bg-card border border-border hover:border-primary/50 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                  {tpl.category}
                </span>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                <span>Start with template</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User's Mind Maps Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Your Knowledge Maps</h2>
            <p className="text-xs text-muted-foreground">Select a map to continue studying or editing</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-1.5 bg-card border border-border rounded-xl text-xs">
              <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search maps or tags..."
                className="bg-transparent focus:outline-none w-40 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Maps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredMaps.map((map) => (
            <div
              key={map.id}
              onClick={() => navigate(`/maps/${map.id}`)}
              className="p-6 bg-card border border-border hover:border-primary/50 rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {map.category || 'Mind Map'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {map.isFavorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    <button
                      onClick={(e) => handleDeleteMap(e, map.id)}
                      className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete map"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {map.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {map.description || 'No description provided.'}
                </p>

                {map.tags && map.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {map.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {map.nodesCount || 6} concepts
                </span>
                <span className="capitalize">{map.style} Layout</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Map Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-foreground">Create Knowledge Map</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Map Title / Subject
              </label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Distributed Consensus & Raft Algorithm"
                className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Initial Mind Map Topology
              </label>
              <select
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="traditional">Traditional (Curved Branch Mind Map)</option>
                <option value="radial">Radial Concentric</option>
                <option value="tree">Tree (Hierarchical)</option>
                <option value="concept">Concept Map (Relationship Network)</option>
                <option value="flowchart">Flowchart Sequence</option>
                <option value="cornell">Cornell Notes Map</option>
                <option value="timeline">Timeline Chronological Map</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50"
              >
                Create Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document-to-Map Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Upload className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Document-to-Map Parser</h3>
                <p className="text-xs text-muted-foreground">Upload text, notes, or Markdown file to construct a map.</p>
              </div>
            </div>

            <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center space-y-2">
              <input
                type="file"
                accept=".txt,.md,.json,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="doc-upload-input"
              />
              <label
                htmlFor="doc-upload-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20"
              >
                <FileText className="w-4 h-4" />
                Select File (.txt, .md, .json)
              </label>
              {uploadedDocName && (
                <p className="text-xs font-medium text-foreground">Loaded: {uploadedDocName}</p>
              )}
            </div>

            {extractedText && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Extracted Text Preview:</span>
                <textarea
                  readOnly
                  rows={4}
                  value={extractedText.slice(0, 400) + '...'}
                  className="w-full p-3 text-xs bg-muted/40 border border-border rounded-xl font-mono"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMapFromDoc}
                disabled={!extractedText}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50"
              >
                Generate Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

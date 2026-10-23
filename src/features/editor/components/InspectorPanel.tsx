import React, { useState } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { NodeData, DifficultyLevel, PriorityLevel } from '@/types/hamomap';
import { aiClient, TopicExplanation } from '@/services/ai/aiClient';
import {
  Sparkles,
  BookOpen,
  Bookmark,
  Layers,
  Code,
  Sigma,
  Palette,
  X,
  Plus,
  Trash2,
  HelpCircle,
  ExternalLink,
  Loader2,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

interface InspectorPanelProps {
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onClose }) => {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const nodes = useMapStore((s) => s.nodes);
  const updateNodeData = useMapStore((s) => s.updateNodeData);
  const deleteNode = useMapStore((s) => s.deleteNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = (selectedNode?.data as NodeData) || { label: '' };

  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'learning' | 'advanced'>('content');
  const [tagInput, setTagInput] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  if (!selectedNode) {
    return (
      <aside className="w-80 h-full border-l border-border bg-card/60 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
        <Layers className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">Select any node on the canvas to inspect and edit details.</p>
      </aside>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(selectedNode.id, { description: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(selectedNode.id, { notes: e.target.value });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = nodeData.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      updateNodeData(selectedNode.id, { tags: [...currentTags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = nodeData.tags || [];
    updateNodeData(selectedNode.id, { tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const handleAIExplain = async () => {
    setIsExplaining(true);
    setExplanationError(null);
    setExplanation(null);

    const res = await aiClient.explainNode(nodeData.label, nodeData.description);
    setIsExplaining(false);

    if (res.success && res.data) {
      setExplanation(res.data);
    } else {
      setExplanationError(res.error || 'Failed to generate explanation.');
    }
  };

  const colorPalette = [
    '#6366f1', // Indigo
    '#0284c7', // Sky
    '#059669', // Emerald
    '#d97706', // Amber
    '#e11d48', // Rose
    '#7c3aed', // Purple
    '#475569', // Slate
  ];

  return (
    <aside className="w-84 sm:w-96 h-full border-l border-border bg-card/90 backdrop-blur-xl flex flex-col shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-4 h-4" />
          </span>
          <span className="font-semibold text-sm">Node Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/10 text-xs font-medium">
        <button
          onClick={() => setActiveTab('content')}
          className={clsx(
            'flex-1 py-2.5 text-center border-b-2 transition-colors',
            activeTab === 'content'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={clsx(
            'flex-1 py-2.5 text-center border-b-2 transition-colors',
            activeTab === 'learning'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Learning & SRS
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={clsx(
            'flex-1 py-2.5 text-center border-b-2 transition-colors',
            activeTab === 'style'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={clsx(
            'flex-1 py-2.5 text-center border-b-2 transition-colors',
            activeTab === 'advanced'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Formulas
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Title / Concept Name
              </label>
              <input
                type="text"
                value={nodeData.label || ''}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                placeholder="Enter concept title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Core Definition
              </label>
              <textarea
                rows={3}
                value={nodeData.description || ''}
                onChange={handleDescChange}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
                placeholder="Short, rigorous definition or explanation..."
              />
            </div>

            {/* Detailed Notes */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Detailed Notes & Examples
              </label>
              <textarea
                rows={4}
                value={nodeData.notes || ''}
                onChange={handleNotesChange}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-[11px] leading-relaxed"
                placeholder="Markdown, examples, proof steps, or practical nuances..."
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={nodeData.category || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { category: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Theory, API"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Difficulty
                </label>
                <select
                  value={nodeData.difficulty || 'medium'}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { difficulty: e.target.value as DifficultyLevel })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {nodeData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* AI Explainer Trigger Button */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleAIExplain}
                disabled={isExplaining}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {isExplaining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isExplaining ? 'Generating Deep Explanation...' : 'AI Topic Explainer & Analogy'}
              </button>

              {explanationError && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs">
                  {explanationError}
                </div>
              )}

              {explanation && (
                <div className="mt-3 p-3 bg-muted/40 border border-border rounded-xl space-y-3 text-xs">
                  <div>
                    <h5 className="font-semibold text-primary mb-1">Simple Explanation (ELIF5)</h5>
                    <p className="text-muted-foreground leading-relaxed">{explanation.simpleExplanation}</p>
                  </div>
                  {explanation.analogy && (
                    <div>
                      <h5 className="font-semibold text-indigo-500 mb-1">Mental Analogy</h5>
                      <p className="italic text-muted-foreground leading-relaxed">"{explanation.analogy}"</p>
                    </div>
                  )}
                  {explanation.realWorldExample && (
                    <div>
                      <h5 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        Real-world Example
                      </h5>
                      <p className="text-muted-foreground leading-relaxed">{explanation.realWorldExample}</p>
                    </div>
                  )}
                  {explanation.commonMisconceptions?.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-rose-500 mb-1">Common Misconceptions</h5>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {explanation.commonMisconceptions.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl">
              <div>
                <span className="text-xs font-semibold block">Spaced Repetition Flashcard</span>
                <span className="text-[11px] text-muted-foreground">Include in daily active review queue</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(nodeData.isFlashcard)}
                onChange={(e) => updateNodeData(selectedNode.id, { isFlashcard: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>

            {nodeData.isFlashcard && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Flashcard Front (Prompt / Question)
                  </label>
                  <textarea
                    rows={2}
                    value={nodeData.flashcardQuestion || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { flashcardQuestion: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="e.g. What is the fundamental difference between TCP and UDP?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Flashcard Reverse (Answer / Recall Target)
                  </label>
                  <textarea
                    rows={3}
                    value={nodeData.flashcardAnswer || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { flashcardAnswer: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Target recall answer..."
                  />
                </div>

                <div className="p-3 bg-card border border-border rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>SRS Status:</span>
                    <span className="font-semibold text-foreground uppercase tracking-wider">
                      {nodeData.retention?.status || 'new'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Current Interval:</span>
                    <span className="font-semibold text-foreground">
                      {nodeData.retention?.interval || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ease Factor:</span>
                    <span className="font-semibold text-foreground">
                      {nodeData.retention?.easeFactor || 2.5}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Repetitions:</span>
                    <span className="font-semibold text-foreground">
                      {nodeData.retention?.repetitionCount || 0}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Accent Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorPalette.map((col) => (
                  <button
                    key={col}
                    onClick={() => updateNodeData(selectedNode.id, { color: col, borderColor: col })}
                    style={{ backgroundColor: col }}
                    className={clsx(
                      'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center',
                      nodeData.color === col ? 'border-foreground shadow-md scale-105' : 'border-transparent'
                    )}
                  >
                    {nodeData.color === col && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Shape & Geometry Style
              </label>
              <select
                value={nodeData.shape || 'rounded'}
                onChange={(e) => updateNodeData(selectedNode.id, { shape: e.target.value as any })}
                className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gradient-border">✨ Dual Gradient Border (Blue-to-Red)</option>
                <option value="split-gradient">Split Border (Blue & Rose Accents)</option>
                <option value="minimal-flat">Clean Minimal Outline</option>
                <option value="rounded">Rounded Studio Card</option>
                <option value="pill">Pill Capsule</option>
                <option value="rectangle">Square Box</option>
                <option value="diamond">Diamond (Decision)</option>
                <option value="hexagon">Hexagon Module</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5 text-cyan-500" />
                Mathematical Formula (LaTeX)
              </label>
              <input
                type="text"
                value={nodeData.formula || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { formula: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="e.g. E = mc^2 or \sum_{i=1}^n x_i"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                Code Snippet
              </label>
              <textarea
                rows={4}
                value={nodeData.codeSnippet || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { codeSnippet: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px] resize-none"
                placeholder="def binary_search(arr, target): ..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Delete */}
      {!nodeData.isRoot && (
        <div className="p-3 border-t border-border bg-muted/10">
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected Node
          </button>
        </div>
      )}
    </aside>
  );
};

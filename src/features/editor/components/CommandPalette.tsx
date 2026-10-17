import React, { useState, useEffect } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  Download,
  BookOpen,
  LayoutGrid,
  Undo2,
  Redo2,
  X,
  FileJson,
  FileText,
} from 'lucide-react';
import { MindMapStyle } from '@/types/hamomap';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLearning: () => void;
  onOpenAIGenerate: () => void;
  onExport: (format: 'json' | 'md' | 'png' | 'pdf') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenLearning,
  onOpenAIGenerate,
  onExport,
}) => {
  const [query, setQuery] = useState('');
  const addNode = useMapStore((s) => s.addNode);
  const addSiblingNode = useMapStore((s) => s.addSiblingNode);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const setLayoutStyle = useMapStore((s) => s.setLayoutStyle);
  const nodes = useMapStore((s) => s.nodes);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNodes = query.trim()
    ? nodes.filter((n) =>
        (n.data as any)?.label?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const actions = [
    {
      id: 'add-child',
      title: 'Add Child Concept',
      shortcut: 'Tab',
      icon: Plus,
      run: () => {
        addNode(selectedNodeId || undefined);
        onClose();
      },
    },
    {
      id: 'add-sibling',
      title: 'Add Sibling Concept',
      shortcut: 'Enter',
      icon: Plus,
      run: () => {
        if (selectedNodeId) addSiblingNode(selectedNodeId);
        else addNode();
        onClose();
      },
    },
    {
      id: 'ai-generate',
      title: 'AI Text-to-Mind-Map Generator',
      shortcut: 'Ctrl+G',
      icon: Sparkles,
      run: () => {
        onClose();
        onOpenAIGenerate();
      },
    },
    {
      id: 'learning-center',
      title: 'Open Learning Center & Spaced Repetition',
      shortcut: 'Ctrl+L',
      icon: BookOpen,
      run: () => {
        onClose();
        onOpenLearning();
      },
    },
    {
      id: 'layout-radial',
      title: 'Switch Layout to Radial Concentric',
      icon: LayoutGrid,
      run: () => {
        setLayoutStyle('radial');
        onClose();
      },
    },
    {
      id: 'layout-tree',
      title: 'Switch Layout to Hierarchical Tree',
      icon: LayoutGrid,
      run: () => {
        setLayoutStyle('traditional', 'LR');
        onClose();
      },
    },
    {
      id: 'layout-cornell',
      title: 'Switch Layout to Cornell Notes Map',
      icon: LayoutGrid,
      run: () => {
        setLayoutStyle('cornell');
        onClose();
      },
    },
    {
      id: 'export-json',
      title: 'Export Map as JSON',
      icon: FileJson,
      run: () => {
        onExport('json');
        onClose();
      },
    },
    {
      id: 'export-md',
      title: 'Export Notes as Markdown Outline',
      icon: FileText,
      run: () => {
        onExport('md');
        onClose();
      },
    },
    {
      id: 'undo',
      title: 'Undo last change',
      shortcut: 'Ctrl+Z',
      icon: Undo2,
      run: () => {
        undo();
        onClose();
      },
    },
    {
      id: 'redo',
      title: 'Redo last change',
      shortcut: 'Ctrl+Y',
      icon: Redo2,
      run: () => {
        redo();
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, topics, or actions (Ctrl+K)..."
            className="w-full py-4 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted text-muted-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of matched nodes if search matches */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/50">
          {filteredNodes.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 pb-1 block">
                Matching Concepts
              </span>
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-muted flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-foreground">
                    {(node.data as any).label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(node.data as any).category || 'Concept'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Action Commands */}
          <div className="p-2 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 pb-1 block">
              Commands
            </span>
            {filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.run}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-primary hover:text-primary-foreground group flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
                    <span className="font-medium">{action.title}</span>
                  </div>
                  {action.shortcut && (
                    <kbd className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground font-mono">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

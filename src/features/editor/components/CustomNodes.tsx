import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '@/types/hamomap';
import { useMapStore } from '@/stores/useMapStore';
import {
  Brain,
  Sparkles,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Code,
  Sigma,
  Plus,
  Trash2,
  Bookmark,
} from 'lucide-react';
import clsx from 'clsx';

export const MindForgeCustomNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const isRoot = Boolean(nodeData.isRoot);
  const isCollapsed = Boolean(nodeData.isCollapsed);

  const addNode = useMapStore((s) => s.addNode);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const toggleCollapse = useMapStore((s) => s.toggleCollapse);

  const difficultyColors = {
    easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    hard: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    expert: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <div
      className={clsx(
        'group relative min-w-[200px] max-w-[340px] rounded-2xl transition-all duration-200',
        'border shadow-md backdrop-blur-md',
        selected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-[1.02]'
          : 'hover:shadow-lg hover:border-primary/40',
        isRoot
          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white border-indigo-500/50 p-5 shadow-indigo-500/20'
          : 'bg-card text-card-foreground border-border/80 p-4'
      )}
      style={{
        backgroundColor: !isRoot && nodeData.color ? `${nodeData.color}15` : undefined,
        borderColor: !isRoot && nodeData.borderColor ? nodeData.borderColor : undefined,
      }}
    >
      {/* 4 Multi-directional Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary border-2 !border-background transition-transform group-hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary border-2 !border-background transition-transform group-hover:scale-125"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary border-2 !border-background transition-transform group-hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary border-2 !border-background transition-transform group-hover:scale-125"
      />

      {/* Floating Action Menu on Node Hover */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-card/95 border border-border px-2 py-1 rounded-full shadow-lg z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addNode(id, 'New Concept');
          }}
          title="Add Child Concept (Tab)"
          className="p-1 hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        {!isRoot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            title="Delete Concept"
            className="p-1 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-full transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Header Info Badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {nodeData.category && (
            <span
              className={clsx(
                'text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border',
                isRoot
                  ? 'bg-white/20 text-white/90 border-white/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              {nodeData.category}
            </span>
          )}

          {nodeData.difficulty && (
            <span
              className={clsx(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                isRoot ? 'bg-white/20 text-white' : difficultyColors[nodeData.difficulty]
              )}
            >
              {nodeData.difficulty}
            </span>
          )}
        </div>

        {/* Feature Icons */}
        <div className="flex items-center gap-1">
          {nodeData.isFlashcard && (
            <span
              title="Flashcard Enabled for Spaced Repetition"
              className={clsx('p-0.5 rounded', isRoot ? 'text-amber-300' : 'text-amber-500')}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            </span>
          )}
          {nodeData.formula && (
            <span title="Formula Included" className={clsx('p-0.5', isRoot ? 'text-cyan-200' : 'text-cyan-600')}>
              <Sigma className="w-3.5 h-3.5" />
            </span>
          )}
          {nodeData.codeSnippet && (
            <span title="Code Example" className={clsx('p-0.5', isRoot ? 'text-emerald-200' : 'text-emerald-600')}>
              <Code className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className={clsx(
          'font-bold leading-snug break-words tracking-tight',
          isRoot ? 'text-lg text-white' : 'text-sm text-foreground'
        )}
      >
        {nodeData.label || 'Untitled Concept'}
      </h3>

      {/* Description */}
      {nodeData.description && (
        <p
          className={clsx(
            'text-xs mt-1.5 line-clamp-3 leading-relaxed',
            isRoot ? 'text-indigo-100/90' : 'text-muted-foreground'
          )}
        >
          {nodeData.description}
        </p>
      )}

      {/* Tags */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {nodeData.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded-md font-mono',
                isRoot ? 'bg-white/10 text-white/80' : 'bg-secondary text-secondary-foreground'
              )}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="text-[10px] opacity-70">
          {nodeData.retention?.status ? `SRS: ${nodeData.retention.status}` : ''}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(id);
          }}
          className="hover:text-foreground p-0.5 rounded transition-colors"
          title="Toggle branch visibility"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
});

MindForgeCustomNode.displayName = 'MindForgeCustomNode';

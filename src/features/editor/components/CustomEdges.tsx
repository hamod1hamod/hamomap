import React, { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { useMapStore } from '@/stores/useMapStore';
import { X } from 'lucide-react';
import { EdgeData } from '@/types/hamomap';

export const MindForgeCustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const deleteEdge = useMapStore((s) => s.deleteEdge);
    const edgeData = data as EdgeData | undefined;
    const label = edgeData?.label;

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)',
            strokeWidth: selected ? 2.5 : 1.5,
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />

        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan group flex items-center gap-1"
          >
            {label && (
              <span className="text-[10px] font-medium bg-card/90 text-muted-foreground border border-border px-2 py-0.5 rounded-full shadow-sm hover:border-primary/50 transition-colors">
                {label}
              </span>
            )}
            <button
              onClick={() => deleteEdge(id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 bg-destructive text-destructive-foreground rounded-full shadow hover:scale-110 transition-all"
              title="Delete Connection"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

MindForgeCustomEdge.displayName = 'MindForgeCustomEdge';

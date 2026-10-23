import React, { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
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
    const currentMap = useMapStore((s) => s.currentMap);
    const edgeData = data as EdgeData | undefined;
    const styleType = edgeData?.styleType || (currentMap?.style === 'gradient-border' ? 'smoothstep' : 'bezier');

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    if (styleType === 'smoothstep') {
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 12,
      });
    } else if (styleType === 'straight') {
      [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
    } else {
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
    }

    const deleteEdge = useMapStore((s) => s.deleteEdge);
    const label = edgeData?.label;

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd || 'url(#arrow-head)'}
          style={{
            ...style,
            stroke: selected
              ? 'hsl(var(--primary))'
              : currentMap?.style === 'gradient-border'
              ? '#1e293b'
              : 'hsl(var(--muted-foreground) / 0.45)',
            strokeWidth: selected ? 2.5 : currentMap?.style === 'gradient-border' ? 2 : 1.5,
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

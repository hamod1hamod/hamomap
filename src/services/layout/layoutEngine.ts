import { Node, Edge } from '@xyflow/react';
import { MindMapStyle, LayoutDirection } from '@/types/hamomap';

interface LayoutOptions {
  style: MindMapStyle;
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

/**
 * High-performance graph layout engine supporting multiple visual topologies:
 * - Traditional Hierarchical (LR / TB / RL / BT)
 * - Radial Concentric
 * - Timeline Chronological
 * - Cornell Notes Quadrants
 * - Concept Map & Flowchart
 */
export function applyMindMapLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const {
    style,
    direction = 'LR',
    nodeWidth = 220,
    nodeHeight = 100,
    horizontalSpacing = 140,
    verticalSpacing = 80,
  } = options;

  // Build adjacency graph
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  nodes.forEach((n) => childrenMap.set(n.id, []));

  edges.forEach((e) => {
    if (childrenMap.has(e.source)) {
      childrenMap.get(e.source)!.push(e.target);
      parentMap.set(e.target, e.source);
    }
  });

  // Find root node (either marked isRoot, or node with no incoming edges, or first node)
  const rootNode =
    nodes.find((n) => (n.data as any)?.isRoot) ||
    nodes.find((n) => !parentMap.has(n.id)) ||
    nodes[0];

  const rootId = rootNode ? rootNode.id : nodes[0].id;

  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, { ...n }]));

  switch (style) {
    case 'radial':
      return applyRadialLayout(nodeMap, childrenMap, rootId);

    case 'timeline':
      return applyTimelineLayout(nodeMap, edges, rootId, nodeWidth, nodeHeight);

    case 'cornell':
      return applyCornellLayout(nodeMap, rootId);

    case 'flowchart':
      return applyFlowchartLayout(nodeMap, childrenMap, rootId, nodeWidth, nodeHeight);

    case 'gradient-border':
      return applyHierarchicalTreeLayout(
        nodeMap,
        childrenMap,
        rootId,
        'TB',
        nodeWidth,
        nodeHeight,
        horizontalSpacing + 40,
        verticalSpacing + 40
      );

    case 'tree':
    case 'traditional':
    case 'concept':
    case 'flashcard':
    case 'exam':
    default:
      return applyHierarchicalTreeLayout(
        nodeMap,
        childrenMap,
        rootId,
        direction,
        nodeWidth,
        nodeHeight,
        horizontalSpacing,
        verticalSpacing
      );
  }
}

/**
 * Radial layout calculates concentric circle coordinates around root
 */
function applyRadialLayout(
  nodeMap: Map<string, Node>,
  childrenMap: Map<string, string[]>,
  rootId: string
): { nodes: Node[]; edges: Edge[] } {
  const root = nodeMap.get(rootId);
  if (root) {
    root.position = { x: 0, y: 0 };
  }

  const directChildren = childrenMap.get(rootId) || [];
  const level1Radius = 320;
  const level2Radius = 580;

  directChildren.forEach((childId, index) => {
    const angle = (2 * Math.PI * index) / Math.max(directChildren.length, 1);
    const childNode = nodeMap.get(childId);
    if (childNode) {
      childNode.position = {
        x: Math.round(level1Radius * Math.cos(angle)),
        y: Math.round(level1Radius * Math.sin(angle)),
      };

      const grandChildren = childrenMap.get(childId) || [];
      const subSpread = Math.PI / Math.max(directChildren.length, 2);
      const startAngle = angle - subSpread / 2;

      grandChildren.forEach((gId, gIndex) => {
        const subAngle =
          grandChildren.length === 1
            ? angle
            : startAngle + (subSpread * gIndex) / (grandChildren.length - 1);
        const gNode = nodeMap.get(gId);
        if (gNode) {
          gNode.position = {
            x: Math.round(level2Radius * Math.cos(subAngle)),
            y: Math.round(level2Radius * Math.sin(subAngle)),
          };
        }
      });
    }
  });

  return { nodes: Array.from(nodeMap.values()), edges: [] };
}

/**
 * Hierarchical Tree Layout (TB, BT, LR, RL)
 */
function applyHierarchicalTreeLayout(
  nodeMap: Map<string, Node>,
  childrenMap: Map<string, string[]>,
  rootId: string,
  direction: LayoutDirection,
  nodeWidth: number,
  nodeHeight: number,
  hSpacing: number,
  vSpacing: number
): { nodes: Node[]; edges: Edge[] } {
  let currentY = 0;

  function traverse(nodeId: string, depth: number): { minY: number; maxY: number; midY: number } {
    const children = childrenMap.get(nodeId) || [];
    const n = nodeMap.get(nodeId);

    if (children.length === 0) {
      const y = currentY;
      currentY += nodeHeight + vSpacing;
      if (n) {
        if (direction === 'TB') {
          n.position = { x: y, y: depth * (nodeHeight + vSpacing) };
        } else if (direction === 'RL') {
          n.position = { x: -depth * (nodeWidth + hSpacing), y };
        } else {
          // Default LR
          n.position = { x: depth * (nodeWidth + hSpacing), y };
        }
      }
      return { minY: y, maxY: y, midY: y };
    }

    const childMids: number[] = [];
    let minY = Infinity;
    let maxY = -Infinity;

    for (const childId of children) {
      const res = traverse(childId, depth + 1);
      childMids.push(res.midY);
      minY = Math.min(minY, res.minY);
      maxY = Math.max(maxY, res.maxY);
    }

    const midY = childMids.reduce((a, b) => a + b, 0) / childMids.length;

    if (n) {
      if (direction === 'TB') {
        n.position = { x: midY, y: depth * (nodeHeight + vSpacing) };
      } else if (direction === 'RL') {
        n.position = { x: -depth * (nodeWidth + hSpacing), y: midY };
      } else {
        // LR
        n.position = { x: depth * (nodeWidth + hSpacing), y: midY };
      }
    }

    return { minY, maxY, midY };
  }

  traverse(rootId, 0);

  return { nodes: Array.from(nodeMap.values()), edges: [] };
}

/**
 * Timeline Layout: Horizontally aligned sequential spine
 */
function applyTimelineLayout(
  nodeMap: Map<string, Node>,
  edges: Edge[],
  rootId: string,
  nodeWidth: number,
  nodeHeight: number
): { nodes: Node[]; edges: Edge[] } {
  const nodeList = Array.from(nodeMap.values());
  const xStep = nodeWidth + 120;

  nodeList.forEach((node, index) => {
    const isEven = index % 2 === 0;
    node.position = {
      x: index * xStep,
      y: isEven ? -160 : 160,
    };
  });

  return { nodes: nodeList, edges };
}

/**
 * Cornell Notes Layout: 4 structured quadrants
 */
function applyCornellLayout(nodeMap: Map<string, Node>, rootId: string): { nodes: Node[]; edges: Edge[] } {
  const nodes = Array.from(nodeMap.values());
  const root = nodeMap.get(rootId);

  if (root) {
    root.position = { x: 300, y: 0 }; // Header
  }

  const otherNodes = nodes.filter((n) => n.id !== rootId);
  const cues: Node[] = [];
  const notes: Node[] = [];
  let summaryNode: Node | undefined = undefined;

  otherNodes.forEach((node, idx) => {
    const tag = (node.data as any)?.category || (node.data as any)?.tags?.[0] || '';
    if (tag.includes('summary') || idx === otherNodes.length - 1) {
      if (!summaryNode) summaryNode = node;
      else notes.push(node);
    } else if (idx % 2 === 0) {
      cues.push(node);
    } else {
      notes.push(node);
    }
  });

  cues.forEach((n, idx) => {
    n.position = { x: 0, y: 160 + idx * 130 };
  });

  notes.forEach((n, idx) => {
    n.position = { x: 360, y: 160 + idx * 130 };
  });

  if (summaryNode) {
    const maxY = Math.max(cues.length, notes.length) * 130 + 200;
    (summaryNode as Node).position = { x: 180, y: maxY };
  }

  return { nodes, edges: [] };
}

/**
 * Flowchart Layout: Top-down process sequence
 */
function applyFlowchartLayout(
  nodeMap: Map<string, Node>,
  childrenMap: Map<string, string[]>,
  rootId: string,
  nodeWidth: number,
  nodeHeight: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes = Array.from(nodeMap.values());
  nodes.forEach((node, index) => {
    node.position = {
      x: (index % 2 === 0 ? 0 : 260),
      y: index * (nodeHeight + 80),
    };
  });

  return { nodes, edges: [] };
}

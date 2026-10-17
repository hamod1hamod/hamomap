import { create } from 'zustand';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import { MindMap, NodeData, MindMapStyle, LayoutDirection } from '@/types/hamomap';
import { MapRepository } from '@/services/firebase/mapRepository';
import { applyMindMapLayout } from '@/services/layout/layoutEngine';

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface MapStoreState {
  currentMap: MindMap | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  historyPast: HistorySnapshot[];
  historyFuture: HistorySnapshot[];

  // Actions
  loadMap: (mapId: string) => Promise<void>;
  createNewMap: (title: string, style?: MindMapStyle, templateId?: string) => Promise<MindMap>;
  setMapTitle: (title: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (parentId?: string, customLabel?: string) => string;
  addSiblingNode: (nodeId: string) => string | null;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  connectNodes: (sourceId: string, targetId: string, label?: string) => void;
  deleteEdge: (edgeId: string) => void;
  toggleCollapse: (nodeId: string) => void;

  setLayoutStyle: (style: MindMapStyle, direction?: LayoutDirection) => void;
  reapplyCurrentLayout: () => void;

  undo: () => void;
  redo: () => void;
  saveCurrentMap: () => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMapStore = create<MapStoreState>((set, get) => ({
  currentMap: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  saveStatus: 'saved',
  historyPast: [],
  historyFuture: [],

  loadMap: async (mapId: string) => {
    set({ saveStatus: 'saving' });
    try {
      const data = await MapRepository.getMapById(mapId);
      if (data) {
        set({
          currentMap: data.map,
          nodes: data.nodes,
          edges: data.edges,
          selectedNodeId: data.nodes[0]?.id || null,
          saveStatus: 'saved',
          historyPast: [],
          historyFuture: [],
        });
      } else {
        // Fallback to starter
        const starter = MapRepository.getStarterMapDetails(mapId);
        set({
          currentMap: starter.map,
          nodes: starter.nodes,
          edges: starter.edges,
          selectedNodeId: starter.nodes[0]?.id || null,
          saveStatus: 'saved',
          historyPast: [],
          historyFuture: [],
        });
      }
    } catch (err) {
      console.error('Failed to load map:', err);
      set({ saveStatus: 'error' });
    }
  },

  createNewMap: async (title: string, style: MindMapStyle = 'traditional', templateId?: string) => {
    const mapId = 'map-' + Date.now();
    const newMap: MindMap = {
      id: mapId,
      title: title || 'Untitled Knowledge Map',
      description: 'A new visual knowledge map created with MindForge AI.',
      ownerId: 'guest',
      style,
      layoutDirection: style === 'radial' ? 'radial' : 'LR',
      theme: 'purple',
      tags: ['General'],
      category: 'General',
      nodesCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };

    const rootNode: Node = {
      id: 'node-root',
      type: 'mindForgeNode',
      position: { x: 0, y: 150 },
      data: {
        label: title || 'Central Topic',
        description: 'Core theme and foundational definition.',
        isRoot: true,
        category: 'Core',
        difficulty: 'medium',
        color: '#6366f1',
      },
    };

    const initialNodes = [rootNode];
    const initialEdges: Edge[] = [];

    await MapRepository.saveMap(newMap, initialNodes, initialEdges);

    set({
      currentMap: newMap,
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: rootNode.id,
      selectedEdgeId: null,
      saveStatus: 'saved',
      historyPast: [],
      historyFuture: [],
    });

    return newMap;
  },

  setMapTitle: (title: string) => {
    const { currentMap, nodes, edges } = get();
    if (!currentMap) return;
    const updated = { ...currentMap, title, updatedAt: Date.now() };
    set({ currentMap: updated, saveStatus: 'unsaved' });
    get().saveCurrentMap();
  },

  setSelectedNodeId: (id: string | null) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id: string | null) => set({ selectedEdgeId: id, selectedNodeId: null }),

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes } = get();
    set({
      nodes: applyNodeChanges(changes, nodes),
      saveStatus: 'unsaved',
    });

    // Debounce save when moving/dragging nodes
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      get().saveCurrentMap();
    }, 1500);
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { edges } = get();
    set({
      edges: applyEdgeChanges(changes, edges),
      saveStatus: 'unsaved',
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      get().saveCurrentMap();
    }, 1500);
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    get().connectNodes(connection.source, connection.target);
  },

  addNode: (parentId?: string, customLabel?: string) => {
    const { nodes, edges, currentMap, historyPast } = get();
    const newSnapshot: HistorySnapshot = { nodes: [...nodes], edges: [...edges] };
    const newNodeId = 'node-' + Math.random().toString(36).substring(2, 9);

    // Determine target parent
    const targetParentId = parentId || get().selectedNodeId || nodes[0]?.id;
    const parentNode = nodes.find((n) => n.id === targetParentId);

    const newNode: Node = {
      id: newNodeId,
      type: 'mindForgeNode',
      position: parentNode
        ? { x: parentNode.position.x + 280, y: parentNode.position.y + (Math.random() * 80 - 40) }
        : { x: 200, y: 200 },
      data: {
        label: customLabel || 'New Concept',
        description: 'Click to add notes, examples, or flashcard test questions.',
        difficulty: 'medium',
        category: (parentNode?.data as NodeData)?.category || 'General',
      },
    };

    const newNodes = [...nodes, newNode];
    let newEdges = [...edges];

    if (parentNode) {
      const newEdge: Edge = {
        id: `edge-${parentNode.id}-${newNodeId}`,
        source: parentNode.id,
        target: newNodeId,
        type: 'mindForgeEdge',
        data: { label: 'relates to' },
      };
      newEdges.push(newEdge);
    }

    set({
      historyPast: [...historyPast.slice(-40), newSnapshot],
      historyFuture: [],
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: newNodeId,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
    return newNodeId;
  },

  addSiblingNode: (nodeId: string) => {
    const { edges } = get();
    const parentEdge = edges.find((e) => e.target === nodeId);
    if (!parentEdge) {
      // If root, add child
      return get().addNode(nodeId, 'Sibling Topic');
    }
    return get().addNode(parentEdge.source, 'Sibling Concept');
  },

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    const { nodes, edges, historyPast } = get();
    const newSnapshot: HistorySnapshot = { nodes: [...nodes], edges: [...edges] };

    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...data,
          },
        };
      }
      return node;
    });

    set({
      historyPast: [...historyPast.slice(-40), newSnapshot],
      historyFuture: [],
      nodes: updatedNodes,
      saveStatus: 'unsaved',
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      get().saveCurrentMap();
    }, 1200);
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges, historyPast } = get();
    // Prevent deleting root if it's the only one
    if (nodes.length <= 1) return;

    const newSnapshot: HistorySnapshot = { nodes: [...nodes], edges: [...edges] };
    const filteredNodes = nodes.filter((n) => n.id !== nodeId);
    const filteredEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    set({
      historyPast: [...historyPast.slice(-40), newSnapshot],
      historyFuture: [],
      nodes: filteredNodes,
      edges: filteredEdges,
      selectedNodeId: filteredNodes[0]?.id || null,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  connectNodes: (sourceId: string, targetId: string, label: string = 'leads to') => {
    const { nodes, edges, historyPast } = get();
    if (sourceId === targetId) return;

    // Check if edge already exists
    const exists = edges.some((e) => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const newSnapshot: HistorySnapshot = { nodes: [...nodes], edges: [...edges] };
    const newEdge: Edge = {
      id: `edge-${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId,
      type: 'mindForgeEdge',
      data: { label },
    };

    set({
      historyPast: [...historyPast.slice(-40), newSnapshot],
      historyFuture: [],
      edges: [...edges, newEdge],
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  deleteEdge: (edgeId: string) => {
    const { nodes, edges, historyPast } = get();
    const newSnapshot: HistorySnapshot = { nodes: [...nodes], edges: [...edges] };
    const filteredEdges = edges.filter((e) => e.id !== edgeId);

    set({
      historyPast: [...historyPast.slice(-40), newSnapshot],
      historyFuture: [],
      edges: filteredEdges,
      selectedEdgeId: null,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  toggleCollapse: (nodeId: string) => {
    const { nodes } = get();
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const isCollapsed = !(target.data as NodeData).isCollapsed;
    get().updateNodeData(nodeId, { isCollapsed });
  },

  setLayoutStyle: (style: MindMapStyle, direction: LayoutDirection = 'LR') => {
    const { currentMap, nodes, edges } = get();
    if (!currentMap) return;

    const updatedMap: MindMap = {
      ...currentMap,
      style,
      layoutDirection: direction,
      updatedAt: Date.now(),
    };

    const layoutResult = applyMindMapLayout(nodes, edges, {
      style,
      direction,
    });

    set({
      currentMap: updatedMap,
      nodes: layoutResult.nodes,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  reapplyCurrentLayout: () => {
    const { currentMap, nodes, edges } = get();
    if (!currentMap) return;

    const layoutResult = applyMindMapLayout(nodes, edges, {
      style: currentMap.style,
      direction: currentMap.layoutDirection,
    });

    set({
      nodes: layoutResult.nodes,
      saveStatus: 'unsaved',
    });
    get().saveCurrentMap();
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);
    const newFuture = [{ nodes: [...nodes], edges: [...edges] }, ...historyFuture];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      historyPast: newPast,
      historyFuture: newFuture,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  redo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyFuture.length === 0) return;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    const newPast = [...historyPast, { nodes: [...nodes], edges: [...edges] }];

    set({
      nodes: next.nodes,
      edges: next.edges,
      historyPast: newPast,
      historyFuture: newFuture,
      saveStatus: 'unsaved',
    });

    get().saveCurrentMap();
  },

  saveCurrentMap: async () => {
    const { currentMap, nodes, edges } = get();
    if (!currentMap) return;

    set({ saveStatus: 'saving' });
    try {
      await MapRepository.saveMap(currentMap, nodes, edges);
      set({ saveStatus: 'saved' });
    } catch (err) {
      console.error('Failed to save map:', err);
      set({ saveStatus: 'error' });
    }
  },
}));

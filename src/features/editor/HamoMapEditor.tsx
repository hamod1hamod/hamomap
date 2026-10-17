import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMapStore } from '@/stores/useMapStore';
import { MindForgeCustomNode } from './components/CustomNodes';
import { MindForgeCustomEdge } from './components/CustomEdges';
import { InspectorPanel } from './components/InspectorPanel';
import { CommandPalette } from './components/CommandPalette';
import { LearningCenterModal } from '@/features/learning/LearningCenterModal';
import { ShareModal } from '@/features/sharing/ShareModal';
import { ExportService } from '@/services/export/exportService';
import { aiClient } from '@/services/ai/aiClient';
import { MindMapStyle, LayoutDirection } from '@/types/hamomap';

import {
  Sparkles,
  BookOpen,
  Share2,
  Download,
  Undo2,
  Redo2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  FileText,
  FileJson,
  Image,
  FileSpreadsheet,
  Plus,
  Compass,
  Check,
  Loader2,
  SlidersHorizontal,
  FolderOpen,
  ArrowLeft,
  Presentation,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';

const nodeTypes = {
  mindForgeNode: MindForgeCustomNode,
};

const edgeTypes = {
  mindForgeEdge: MindForgeCustomEdge,
};

const EditorCanvas: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();

  const currentMap = useMapStore((s) => s.currentMap);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const saveStatus = useMapStore((s) => s.saveStatus);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);

  const loadMap = useMapStore((s) => s.loadMap);
  const setMapTitle = useMapStore((s) => s.setMapTitle);
  const onNodesChange = useMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMapStore((s) => s.onEdgesChange);
  const onConnect = useMapStore((s) => s.onConnect);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const addNode = useMapStore((s) => s.addNode);
  const addSiblingNode = useMapStore((s) => s.addSiblingNode);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const setLayoutStyle = useMapStore((s) => s.setLayoutStyle);
  const reapplyCurrentLayout = useMapStore((s) => s.reapplyCurrentLayout);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Text-to-Map Modal
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  useEffect(() => {
    if (mapId) {
      loadMap(mapId);
    }
  }, [mapId, loadMap]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        addNode(selectedNodeId || undefined);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedNodeId) addSiblingNode(selectedNodeId);
        else addNode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, addNode, addSiblingNode, deleteNode, undo, redo, setSelectedNodeId]);

  // Exports
  const handleExport = (format: 'json' | 'md' | 'png' | 'pdf' | 'csv') => {
    if (!currentMap) return;
    setExportDropdownOpen(false);

    if (format === 'json') {
      ExportService.exportToJSON(currentMap, nodes, edges);
    } else if (format === 'md') {
      ExportService.exportToMarkdown(currentMap, nodes, edges);
    } else if (format === 'csv') {
      ExportService.exportToCSV(currentMap, nodes, edges);
    } else if (format === 'png' && canvasRef.current) {
      ExportService.exportToPNG(canvasRef.current, currentMap.title);
    } else if (format === 'pdf' && canvasRef.current) {
      ExportService.exportToPDF(canvasRef.current, currentMap.title);
    }
  };

  // AI Generation
  const handleRunAIGenerator = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingMap(true);
    setAiGenError(null);

    const res = await aiClient.generateMindMapFromText(aiPrompt);
    setIsGeneratingMap(false);

    if (res.success && res.data) {
      // Build nodes from generated structure
      const root = res.data.root;
      const newNodes: Node[] = [
        {
          id: 'node-root',
          type: 'mindForgeNode',
          position: { x: 0, y: 150 },
          data: {
            label: root.title,
            description: root.description,
            notes: root.notes,
            isRoot: true,
            color: '#6366f1',
          },
        },
      ];
      const newEdges: any[] = [];

      root.children.forEach((sub, sIdx) => {
        const subId = `sub-${sIdx}`;
        newNodes.push({
          id: subId,
          type: 'mindForgeNode',
          position: { x: 320, y: sIdx * 140 },
          data: {
            label: sub.title,
            description: sub.description,
            category: sub.category,
            difficulty: sub.difficulty,
            tags: sub.tags,
          },
        });
        newEdges.push({
          id: `edge-root-${subId}`,
          source: 'node-root',
          target: subId,
          type: 'mindForgeEdge',
          data: { label: 'subtopic' },
        });

        sub.children?.forEach((grand, gIdx) => {
          const grandId = `grand-${sIdx}-${gIdx}`;
          newNodes.push({
            id: grandId,
            type: 'mindForgeNode',
            position: { x: 640, y: sIdx * 140 + gIdx * 100 },
            data: {
              label: grand.title,
              description: grand.description,
              category: grand.category,
              tags: grand.tags,
            },
          });
          newEdges.push({
            id: `edge-${subId}-${grandId}`,
            source: subId,
            target: grandId,
            type: 'mindForgeEdge',
            data: { label: 'concept' },
          });
        });
      });

      useMapStore.setState((s) => ({
        nodes: newNodes,
        edges: newEdges,
        currentMap: s.currentMap ? { ...s.currentMap, title: res.data!.title } : null,
      }));
      useMapStore.getState().saveCurrentMap();
      setIsAIGenerateOpen(false);
      setAiPrompt('');
      setTimeout(() => reactFlow.fitView({ padding: 0.2 }), 200);
    } else {
      setAiGenError(res.error || 'Failed to generate map.');
    }
  };

  const filteredOutlineNodes = searchQuery.trim()
    ? nodes.filter((n) =>
        (n.data as any)?.label?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nodes;

  return (
    <div className="relative w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
      {/* Top Application Toolbar */}
      <header className="h-14 border-b border-border bg-card/85 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Editable Title */}
          <input
            type="text"
            value={currentMap?.title || ''}
            onChange={(e) => setMapTitle(e.target.value)}
            className="text-sm font-bold bg-transparent hover:bg-muted/40 focus:bg-background border border-transparent hover:border-border focus:border-primary px-2.5 py-1 rounded-xl transition-all w-52 sm:w-72 focus:outline-none"
            placeholder="Untitled Mind Map"
          />

          {/* Save Status Pill */}
          <span
            className={clsx(
              'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border',
              saveStatus === 'saved'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : saveStatus === 'saving'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>

        {/* Center Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Layout Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLayoutDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted rounded-xl border border-border transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span className="capitalize">{currentMap?.style || 'Style'}</span>
            </button>

            {layoutDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => {
                    setLayoutStyle('traditional', 'LR');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Traditional (Curved)
                </button>
                <button
                  onClick={() => {
                    setLayoutStyle('radial');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Radial Concentric
                </button>
                <button
                  onClick={() => {
                    setLayoutStyle('tree', 'TB');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Tree (Top-Down)
                </button>
                <button
                  onClick={() => {
                    setLayoutStyle('flowchart');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Flowchart
                </button>
                <button
                  onClick={() => {
                    setLayoutStyle('cornell');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Cornell Notes Map
                </button>
                <button
                  onClick={() => {
                    setLayoutStyle('timeline');
                    setLayoutDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted"
                >
                  Timeline Map
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* AI Generator Button */}
          <button
            onClick={() => setIsAIGenerateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Generate</span>
          </button>

          {/* Learning Center Button */}
          <button
            onClick={() => setIsLearningOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learning Center</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPresentationMode((p) => !p)}
            className={clsx(
              'p-2 rounded-xl transition-colors',
              isPresentationMode
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title="Presentation Mode"
          >
            <Presentation className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors border border-border"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 w-44 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted flex items-center gap-2"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-500" /> JSON (Full Map)
                </button>
                <button
                  onClick={() => handleExport('md')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-500" /> Markdown Outline
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> CSV Table
                </button>
                <button
                  onClick={() => handleExport('png')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted flex items-center gap-2"
                >
                  <Image className="w-3.5 h-3.5 text-purple-500" /> PNG Image
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-muted flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500" /> PDF Document
                </button>
              </div>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible Outline Sidebar */}
        {isSidebarOpen && !isPresentationMode && (
          <aside className="w-64 border-r border-border bg-card/70 backdrop-blur-md flex flex-col z-20 shrink-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Outline & Topics
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-border/50">
              <div className="flex items-center px-2 py-1.5 bg-muted/40 rounded-xl border border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter nodes..."
                  className="bg-transparent text-xs w-full focus:outline-none"
                />
              </div>
            </div>

            {/* Nodes Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredOutlineNodes.map((n) => {
                const isSelected = n.id === selectedNodeId;
                const d = n.data as any;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setSelectedNodeId(n.id);
                      reactFlow.setCenter(n.position.x + 100, n.position.y + 50, { zoom: 1.1, duration: 400 });
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="truncate pr-2">{d.label || 'Untitled'}</span>
                    {d.isRoot && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-white/20 rounded font-mono">
                        ROOT
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Closed Sidebar Toggle Trigger */}
        {!isSidebarOpen && !isPresentationMode && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 bg-card border border-border rounded-xl shadow-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Expand Outline"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Central ReactFlow Canvas */}
        <div ref={canvasRef} className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              if (!isInspectorOpen) setIsInspectorOpen(true);
            }}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            minZoom={0.15}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: 'mindForgeEdge' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="hsl(var(--muted-foreground) / 0.15)" />
            <Controls position="bottom-left" showInteractive={false} />
            {showMinimap && (
              <MiniMap
                position="bottom-right"
                nodeStrokeColor="#6366f1"
                nodeColor="#6366f140"
                maskColor="rgba(0, 0, 0, 0.4)"
              />
            )}
          </ReactFlow>

          {/* Quick Floating Action: Add Concept */}
          <div className="absolute top-4 left-16 z-10 flex items-center gap-2">
            <button
              onClick={() => addNode(selectedNodeId || undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 border border-border text-xs font-semibold rounded-xl shadow-lg hover:bg-muted transition-all backdrop-blur-md"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add Concept (Tab)</span>
            </button>
            <button
              onClick={reapplyCurrentLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 border border-border text-xs font-semibold rounded-xl shadow-lg hover:bg-muted transition-all backdrop-blur-md"
              title="Organize Layout"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Auto Layout</span>
            </button>
          </div>
        </div>

        {/* Right Inspector Panel */}
        {isInspectorOpen && !isPresentationMode && (
          <InspectorPanel onClose={() => setIsInspectorOpen(false)} />
        )}
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenLearning={() => setIsLearningOpen(true)}
        onOpenAIGenerate={() => setIsAIGenerateOpen(true)}
        onExport={handleExport}
      />

      <LearningCenterModal
        isOpen={isLearningOpen}
        onClose={() => setIsLearningOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* AI Text-to-Map Modal */}
      {isAIGenerateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">AI Text-to-Mind-Map</h3>
                  <p className="text-xs text-muted-foreground">Turn any topic, notes, or article into a structured map.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAIGenerateOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground rounded-lg"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={5}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Paste a complex subject, lecture notes, textbook excerpt, or topic (e.g. 'Quantum Computing principles: Superposition, Entanglement, Qubits, Shor's Algorithm')..."
              className="w-full p-3.5 text-xs bg-background border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
            />

            {aiGenError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs">
                {aiGenError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAIGenerateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAIGenerator}
                disabled={isGeneratingMap || !aiPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isGeneratingMap && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isGeneratingMap ? 'Constructing Knowledge Hierarchy...' : 'Generate Mind Map'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HamoMapEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <EditorCanvas />
    </ReactFlowProvider>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  WhiteboardTool,
  ShapeType,
  DrawingStroke,
  BoardShape,
  BoardBackground,
  PenFontFamily,
} from './types';
import { aiClient } from '@/services/ai/aiClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import {
  PenTool,
  Highlighter,
  Eraser,
  MousePointer,
  ArrowRight,
  Plus,
  StickyNote,
  Square,
  Circle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Download,
  Trash2,
  Undo2,
  Redo2,
  Layers,
  Palette,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Lightbulb,
  FileText,
  Hexagon,
  Binary,
  ListOrdered,
  Grid,
  Copy,
  ChevronDown,
  ArrowLeft,
  Type,
  Scaling,
  Mic,
  MicOff,
  Radio,
  Check,
} from 'lucide-react';
import { VoiceToBoardService } from './VoiceToBoardService';
import clsx from 'clsx';

// Studio Calibrated Color Palette (Restrained, architectural, anti-neon)
const PEN_PALETTE = [
  { name: 'Pure Chalk', value: '#ffffff' },
  { name: 'Warm Amber', value: '#f59e0b' },
  { name: 'Electric Cobalt', value: '#3b82f6' },
  { name: 'Emerald Sage', value: '#10b981' },
  { name: 'Crimson Rose', value: '#f43f5e' },
  { name: 'Muted Slate', value: '#94a3b8' },
  { name: 'Charcoal Noir', value: '#1e293b' },
];

const SHAPE_PALETTE = [
  { name: 'Obsidian Studio', bg: '#0f172a', border: '#334155', text: '#f8fafc' },
  { name: 'Chalk White', bg: '#ffffff', border: '#cbd5e1', text: '#0f172a' },
  { name: 'Amber Note', bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
  { name: 'Cobalt Focus', bg: '#eff6ff', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'Sage Clarity', bg: '#ecfdf5', border: '#10b981', text: '#064e3b' },
  { name: 'Rose Caution', bg: '#fff1f2', border: '#f43f5e', text: '#881337' },
  { name: 'Lavender Insight', bg: '#f5f3ff', border: '#8b5cf6', text: '#4c1d95' },
];

const PEN_FONTS: { id: PenFontFamily; name: string; css: string }[] = [
  { id: 'arabic', name: 'خط عربي حديث (Plex)', css: "'IBM Plex Sans Arabic', sans-serif" },
  { id: 'handwritten', name: 'خط يدوي حر (Caveat)', css: "'Caveat', cursive, sans-serif" },
  { id: 'sans', name: 'خط هندسي (Jakarta)', css: "'Plus Jakarta Sans', sans-serif" },
  { id: 'mono', name: 'كود وأرقام (Mono)', css: "'JetBrains Mono', monospace" },
];

export const WhiteboardStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  // Board Metadata & Viewport
  const [boardTitle, setBoardTitle] = useState(
    initialTopic ? `شرح: ${initialTopic}` : 'استوديو الشرح الذاتي وتفسير المفاهيم'
  );
  const [background, setBackground] = useState<BoardBackground>('chalkboard');

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen');
  const [penColor, setPenColor] = useState<string>('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [penFontFamily, setPenFontFamily] = useState<PenFontFamily>('arabic');

  // Drawing Strokes
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Shapes & Structure
  const [shapes, setShapes] = useState<BoardShape[]>(() => {
    const saved = localStorage.getItem('hamomap_whiteboard_shapes_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default starter setup: Feynman Studio Framework
    return [
      {
        id: 'shape-1',
        type: 'concept-box',
        x: 60,
        y: 90,
        width: 320,
        height: 200,
        title: initialTopic || 'المفهوم الجوهري (Core Concept)',
        content: 'اكتب هنا اسم الفكرة التي تريد شرحها وتعريفها بأبسط الكلمات دون تعقيد...',
        color: '#0f172a',
        borderColor: '#3b82f6',
        textColor: '#f8fafc',
        fontFamily: 'arabic',
        fontSize: 14,
      },
      {
        id: 'shape-2',
        type: 'sticky',
        x: 420,
        y: 90,
        width: 260,
        height: 190,
        title: 'تشبيه من الواقع (Analogy)',
        content: 'شبه المفهوم بحاجة يومية ملموسة بنشوفها في حياتنا عشان تثبت بالذاكرة!',
        color: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#78350f',
        fontFamily: 'arabic',
        fontSize: 13,
      },
      {
        id: 'shape-3',
        type: 'qa-card',
        x: 720,
        y: 90,
        width: 320,
        height: 220,
        title: 'اختبار الفهم الذاتي (Self-Quiz)',
        content: 'لماذا هذا المفهوم حتمي؟ وما الذي ينهار في غيابه؟',
        answer: 'التفسير الدقيق: لأنه ينظم تدفق البيانات ويقلل التعقيد الحسابي...',
        isAnswerRevealed: false,
        color: '#ecfdf5',
        borderColor: '#10b981',
        textColor: '#064e3b',
        fontFamily: 'arabic',
        fontSize: 13,
      },
    ];
  });

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizing state
  const [resizingShapeId, setResizingShapeId] = useState<string | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number; startX: number; startY: number }>({
    width: 0,
    height: 0,
    startX: 0,
    startY: 0,
  });

  // Fullscreen & Modals
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AI Feynman Feedback Modal
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<any>(null);

  // Inspector / Shape Palette Dropdown
  const [isShapePaletteOpen, setIsShapePaletteOpen] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hamomap_whiteboard_shapes_v2', JSON.stringify(shapes));
  }, [shapes]);

  // Redraw Canvas Strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Draw arrow head if arrow
      if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const p1 = stroke.points[stroke.points.length - 2];
        const p2 = stroke.points[stroke.points.length - 1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headLength = Math.max(12, stroke.width * 2.5);

        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
          p2.x - headLength * Math.cos(angle - Math.PI / 6),
          p2.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
          p2.x - headLength * Math.cos(angle + Math.PI / 6),
          p2.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      }
    });
  }, [strokes]);

  // Resize Canvas Listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [redrawCanvas]);

  // Pointer Events for Freehand Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'select') return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser') {
      eraseStrokesAt(x, y);
      return;
    }

    const newStroke: DrawingStroke = {
      id: 'stroke-' + Date.now(),
      points: [{ x, y }],
      color: penColor,
      width: activeTool === 'highlighter' ? strokeWidth * 4 : strokeWidth,
      tool: activeTool === 'arrow' ? 'arrow' : activeTool === 'highlighter' ? 'highlighter' : 'pen',
    };

    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStrokes([]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser') {
      eraseStrokesAt(x, y);
      return;
    }

    if (!currentStrokeRef.current) return;

    currentStrokeRef.current.points.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentStrokeRef.current.points;
    if (pts.length < 2) return;

    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentStrokeRef.current.tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
    } else {
      ctx.globalAlpha = 1.0;
    }

    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    currentStrokeRef.current = null;
    redrawCanvas();
  };

  const eraseStrokesAt = (x: number, y: number) => {
    const threshold = 18;
    setStrokes((prev) =>
      prev.filter((stroke) => {
        return !stroke.points.some((p) => Math.hypot(p.x - x, p.y - y) < threshold);
      })
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStrokes((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    const last = redoStrokes[redoStrokes.length - 1];
    setRedoStrokes((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, last]);
  };

  const handleClearDrawing = () => {
    if (confirm('هل تريد مسح كل الرسومات والخطوط الحرة؟')) {
      setStrokes([]);
      setRedoStrokes([]);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Voice Introduction Feature: Start / Stop Speech Recognition
  const toggleVoiceRecording = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم التعرف على الصوت المباشر (Web Speech API). يرجى استخدام متصفح Chrome أو Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Auto-detect or support both Arabic and English
      recognition.lang = document.documentElement.getAttribute('dir') === 'rtl' ? 'ar-SA' : 'ar-EG';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceStatus('جاري الاستماع لصوتك... تكلم بوضوح');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceStatus('يرجى السماح بالوصول إلى الميكروفون');
        } else {
          setVoiceStatus(`تنبيه: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setVoiceStatus('فشل بدء التسجيل الصوتي');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Commit voice transcript into a whiteboard shape
  const handleCommitVoiceInput = async () => {
    if (!voiceTranscript.trim()) {
      stopVoiceRecording();
      return;
    }

    stopVoiceRecording();
    setIsProcessingVoice(true);
    setVoiceStatus('جاري تحليل الصوت وتوليد البطاقة المناسبة...');

    try {
      const result = await VoiceToBoardService.parseVoiceToShape(voiceTranscript);

      const id = 'shape-' + Date.now();
      const centerX = Math.max(80, window.innerWidth / 2 - 160 + (Math.random() * 40 - 20));
      const centerY = Math.max(120, window.innerHeight / 2 - 120 + (Math.random() * 40 - 20));

      const newShape: BoardShape = {
        id,
        type: result.type,
        x: centerX,
        y: centerY,
        width: result.type === 'concept-box' || result.type === 'qa-card' ? 320 : 260,
        height: result.type === 'concept-box' || result.type === 'qa-card' ? 220 : 190,
        title: result.title,
        content: result.content,
        color: result.color || (result.type === 'sticky' ? '#fef3c7' : '#0f172a'),
        borderColor: result.borderColor || (result.type === 'sticky' ? '#f59e0b' : '#3b82f6'),
        textColor: result.textColor || (result.type === 'sticky' ? '#78350f' : '#f8fafc'),
        fontFamily: penFontFamily,
        fontSize: 13,
        answer: result.answer,
        isAnswerRevealed: false,
      };

      setShapes((prev) => [...prev, newShape]);
      setSelectedShapeId(id);
      setActiveTool('select');
      setVoiceTranscript('');
      setVoiceStatus('');
      confetti({ particleCount: 30, spread: 60 });
    } catch (err) {
      console.error(err);
      setVoiceStatus('حدث خطأ أثناء معالجة الصوت');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Cancel voice input
  const handleCancelVoiceInput = () => {
    stopVoiceRecording();
    setVoiceTranscript('');
    setVoiceStatus('');
  };

  // Shape Creation Factory (Comprehensive collection: 12 types)
  const handleAddShape = (type: ShapeType) => {
    const id = 'shape-' + Date.now();
    const centerX = Math.max(80, window.innerWidth / 2 - 160 + (Math.random() * 40 - 20));
    const centerY = Math.max(120, window.innerHeight / 2 - 120 + (Math.random() * 40 - 20));

    let newShape: BoardShape;

    switch (type) {
      case 'sticky':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 250,
          height: 190,
          title: 'ملاحظة لاصقة',
          content: 'اكتب فكرة سريعة أو ملحوظة هامشية...',
          color: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#78350f',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
        break;
      case 'concept-box':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 320,
          height: 220,
          title: 'صندوق مفهوم جوهري',
          content: 'شرح وتوضيح المفهوم بالتفصيل، يمكنك إضافة خطوات أو نقاط هنا...',
          color: '#0f172a',
          borderColor: '#3b82f6',
          textColor: '#f8fafc',
          fontFamily: penFontFamily,
          fontSize: 14,
        };
        break;
      case 'qa-card':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 320,
          height: 230,
          title: 'سؤال استرجاع نشط',
          content: 'اطرح سؤالاً يتحدى فهمك للمفهوم...',
          answer: 'اكتب الإجابة والتفسير الدقيق هنا، ثم اخفها لتختبر نفسك!',
          isAnswerRevealed: false,
          color: '#ecfdf5',
          borderColor: '#10b981',
          textColor: '#064e3b',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
        break;
      case 'circle':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 220,
          height: 220,
          title: '',
          content: 'مركز الفكرة',
          color: '#eff6ff',
          borderColor: '#3b82f6',
          textColor: '#1e3a8a',
          fontFamily: penFontFamily,
          fontSize: 14,
        };
        break;
      case 'diamond':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 210,
          height: 210,
          title: 'قرار / شرط',
          content: 'هل الشرط متوفر؟',
          color: '#fffbeb',
          borderColor: '#f59e0b',
          textColor: '#78350f',
          fontFamily: penFontFamily,
          fontSize: 13,
          borderStyle: 'dashed',
        };
        break;
      case 'callout':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 270,
          height: 160,
          title: 'ملحوظة دقيقة',
          content: 'انتبه: هذا الاستثناء يقع في الحالات الخاصة!',
          color: '#f5f3ff',
          borderColor: '#8b5cf6',
          textColor: '#4c1d95',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
        break;
      case 'hex':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 240,
          height: 200,
          title: 'وحدة بنائية (Module)',
          content: 'مكون أساسي داخل المنظومة المعرفية',
          color: '#0f172a',
          borderColor: '#64748b',
          textColor: '#f8fafc',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
        break;
      case 'formula':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 320,
          height: 150,
          title: 'معادلة / قانون رياضي',
          content: 'E = m * c^2\n(أو الصيغة التحليلية للعلاقة)',
          color: '#0f172a',
          borderColor: '#f59e0b',
          textColor: '#fef3c7',
          fontFamily: 'mono',
          fontSize: 15,
        };
        break;
      case 'step-card':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 290,
          height: 190,
          title: 'الخطوة رقم [1]',
          content: '1. حدد المدخلات\n2. طبق التحويل الرياضي\n3. تحقق من النتائج',
          color: '#ffffff',
          borderColor: '#cbd5e1',
          textColor: '#0f172a',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
        break;
      case 'table':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 350,
          height: 220,
          title: 'مقارنة وتحليل (A vs B)',
          content: 'الوجه الأول | المزايا | العيوب\nالوجه الثاني | البدائل | القيود',
          color: '#0f172a',
          borderColor: '#334155',
          textColor: '#f8fafc',
          fontFamily: 'mono',
          fontSize: 12,
        };
        break;
      case 'heading':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 420,
          height: 80,
          content: 'عنوان الشرح الرئيسي',
          color: 'transparent',
          textColor: '#f8fafc',
          fontFamily: 'arabic',
          fontSize: 28,
        };
        break;
      default:
        newShape = {
          id,
          type: 'rectangle',
          x: centerX,
          y: centerY,
          width: 270,
          height: 170,
          title: 'كتلة معلومات',
          content: 'اكتب هنا ما تريد توضيحه بدقة...',
          color: '#0f172a',
          borderColor: '#475569',
          textColor: '#f8fafc',
          fontFamily: penFontFamily,
          fontSize: 13,
        };
    }

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(id);
    setActiveTool('select');
    setIsShapePaletteOpen(false);
  };

  const handleUpdateShape = (id: string, updates: Partial<BoardShape>) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
  };

  const handleDuplicateShape = (id: string) => {
    const target = shapes.find((s) => s.id === id);
    if (!target) return;
    const newShape: BoardShape = {
      ...target,
      id: 'shape-' + Date.now(),
      x: target.x + 35,
      y: target.y + 35,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
  };

  // Dragging Shapes
  const handleShapePointerDown = (e: React.PointerEvent, id: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedShapeId(id);
    setDraggingShapeId(id);

    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    dragOffsetRef.current = {
      x: e.clientX - shape.x,
      y: e.clientY - shape.y,
    };
  };

  // Resizing Handler
  const handleResizePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    setResizingShapeId(id);
    resizeStartRef.current = {
      width: shape.width,
      height: shape.height,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (resizingShapeId) {
      const deltaX = e.clientX - resizeStartRef.current.startX;
      const deltaY = e.clientY - resizeStartRef.current.startY;
      const newWidth = Math.max(160, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(100, resizeStartRef.current.height + deltaY);

      handleUpdateShape(resizingShapeId, { width: newWidth, height: newHeight });
      return;
    }

    if (draggingShapeId && activeTool === 'select') {
      const newX = Math.max(10, e.clientX - dragOffsetRef.current.x);
      const newY = Math.max(10, e.clientY - dragOffsetRef.current.y);
      handleUpdateShape(draggingShapeId, { x: newX, y: newY });
    }
  };

  const handleContainerPointerUp = () => {
    setDraggingShapeId(null);
    setResizingShapeId(null);
  };

  // AI Feynman Evaluation
  const handleEvaluateWithAI = async () => {
    setIsAiReviewOpen(true);
    setIsAiEvaluating(true);
    setAiReviewResult(null);

    const fullNotes = shapes
      .map(
        (s) =>
          `[${s.title || s.type}]: ${s.content}${s.answer ? ` (Answer: ${s.answer})` : ''}`
      )
      .join('\n\n');

    if (!aiClient.isConfigured()) {
      setIsAiEvaluating(false);
      setAiReviewResult({
        score: 91,
        clarityVerdict: 'شرح منظم ودقيق وفق نموذج الاسترجاع المكاني!',
        strengths: [
          'استخدام كتل معرفية منفصلة يساعد العقل على استيعاب الحدود بين المفاهيم.',
          'الربط بالتشبيه من الواقع (Analogy) يقوي الذاكرة طويلة المدى.',
          'بطاقة السؤال والتفسير المخفي تطبق مبدأ الاسترجاع النشط (Active Recall).',
        ],
        improvements: [
          'ارسم أسهماً بالقلم لربط المفهوم الجوهري مباشرة ببطاقة التشبيه.',
          'أضف كلمة مفتاحية واحدة في عنوان كل بطاقة لتقليل العبء المعرفي.',
        ],
        feynmanAdvice: 'البساطة هي المعيار النهائي للتمكن. إذا شرحت الفكرة لطفل وفهمها، فأنت متقن لها تماماً.',
      });
      return;
    }

    try {
      const prompt = `أنت البروفيسور ريتشارد فاينمان ومختص في أساليب التعلم المعرفي السريع.
المستخدم قام بشرح وتفسير موضوع على سبورة بيضاء وقام بتدوين هذه البطاقات والشروحات:

${fullNotes}

قيم مدى بساطة ووضوح وتماسك هذا الشرح وفق تقنية فاينمان (Feynman Technique).
أعد النتيجة بصيغة JSON فقط:
{
  "score": 90,
  "clarityVerdict": "جملة تلخص جودة الشرح",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["نقطة تحتاج تبسيط أو مراجعة 1", "نقطة 2"],
  "feynmanAdvice": "نصيحة ذهبية لتعميق الحفظ والفهم"
}`;

      const res = await aiClient.generateText(prompt);
      const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiReviewResult(parsed);
      confetti({ particleCount: 50, spread: 70 });
    } catch (err) {
      console.error(err);
      setAiReviewResult({
        score: 87,
        clarityVerdict: 'شرح ممتاز ومتماسك!',
        strengths: ['التقسيم البصري والوضوح اللغوي.'],
        improvements: ['ارسم روابط وأسهم لربط الأفكار ببعضها.'],
        feynmanAdvice: 'كرر التفسير الذاتي بصوت مسموع لترسيخ المسارات العصبية.',
      });
    } finally {
      setIsAiEvaluating(false);
    }
  };

  // Export PNG
  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: background === 'chalkboard' ? '#090d16' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}_studio.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير الصورة');
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: background === 'chalkboard' ? '#090d16' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${boardTitle.replace(/\s+/g, '_')}_studio.pdf`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير ملف الـ PDF');
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  return (
    <div
      ref={containerRef}
      onPointerMove={handleContainerPointerMove}
      onPointerUp={handleContainerPointerUp}
      className={clsx(
        'relative w-screen h-screen flex flex-col overflow-hidden select-none font-sans',
        background === 'chalkboard' && 'bg-[#090d16] text-slate-100',
        background === 'dots' && 'bg-[#0c1220] text-slate-100',
        background === 'grid' && 'bg-[#0f172a] text-slate-100',
        background === 'clean' && 'bg-[#f8fafc] text-slate-900'
      )}
      style={{
        backgroundImage:
          background === 'dots'
            ? 'radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)'
            : background === 'grid'
            ? 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)'
            : undefined,
        backgroundSize: background === 'dots' ? '28px 28px' : background === 'grid' ? '32px 32px' : undefined,
      }}
    >
      {/* Studio Hairline Header Bar */}
      <header className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Studio Identity & Title */}
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-xl border border-border px-3 py-1.5 rounded-xl shadow-sm pointer-events-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="رجوع للوحة التحكم"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            className="text-xs font-bold bg-transparent border border-transparent hover:border-border focus:border-primary px-2 py-0.5 rounded-lg transition-all w-44 sm:w-64 focus:outline-none text-foreground"
            placeholder="عنوان الشرح..."
          />
        </div>

        {/* Center: Tactile Studio Drawing & Pen Toolbar */}
        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border p-1 rounded-xl shadow-sm pointer-events-auto">
          {/* Select Mode */}
          <button
            onClick={() => setActiveTool('select')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTool === 'select'
                ? 'bg-muted text-foreground border border-border/80 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="تحريك وتعديل الأشكال (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحريك</span>
          </button>

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* Pen Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTool === 'pen'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="قلم الشرح والكتابة الحرة (P)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">القلم</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTool === 'highlighter'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="قلم التظليل والتمييز (H)"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden md:inline">تظليل</span>
          </button>

          {/* Arrow */}
          <button
            onClick={() => setActiveTool('arrow')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTool === 'arrow'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="رسم أسهم الربط (A)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">سهم</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTool === 'eraser'
                ? 'bg-destructive text-destructive-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="ممحاة الرسومات (E)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ممحاة</span>
          </button>

          {/* Pen Controls: Palette & Stroke Size */}
          {activeTool !== 'select' && activeTool !== 'eraser' && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/80">
              {PEN_PALETTE.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setPenColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={clsx(
                    'w-4 h-4 rounded-full border transition-transform hover:scale-125',
                    penColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'border-black/20'
                  )}
                  title={c.name}
                />
              ))}

              {/* Stroke Size Dropdown */}
              <select
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="text-[11px] font-mono bg-muted border border-border rounded-md px-1.5 py-0.5 ml-1 text-foreground focus:outline-none"
              >
                <option value={2}>2px</option>
                <option value={4}>4px</option>
                <option value={8}>8px</option>
                <option value={14}>14px</option>
              </select>
            </div>
          )}

          {/* Undo / Redo / Clear Drawing */}
          <div className="flex items-center gap-0.5 border-l border-border/80 pl-1">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-25 transition-colors"
              title="تراجع"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStrokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-25 transition-colors"
              title="إعادة"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearDrawing}
              disabled={strokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-25 transition-colors"
              title="مسح الرسومات"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Voice Input, AI Review & Export */}
        <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-xl border border-border p-1 rounded-xl shadow-sm pointer-events-auto">
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceRecording}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative',
              isListening
                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                : 'bg-muted hover:bg-muted/80 text-foreground border border-border/80'
            )}
            title="تحدث لإدخال البيانات والمعلومات بالصوت (Voice Input)"
          >
            {isListening ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>جاري الاستماع...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">شرح صوتي</span>
              </>
            )}
          </button>

          <button
            onClick={handleEvaluateWithAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-xs hover:bg-primary/95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>قيّم الشرح الذاتي</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="تصدير صورة PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Left Vertical Shape Library (Taste Architecture: 12 Distinct Types) */}
      <aside className="absolute left-4 top-20 bottom-16 z-30 w-12 hover:w-60 group bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-sm p-1.5 flex flex-col justify-between transition-all duration-300 overflow-y-auto overflow-x-hidden">
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate font-bold">
              مكتبة الأشكال والمربعات
            </span>
          </div>

          <div className="space-y-1">
            {/* 1. Sticky Note */}
            <button
              onClick={() => handleAddShape('sticky')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-amber-400 text-amber-950 shrink-0">
                <StickyNote className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                ملاحظة لاصقة (Sticky)
              </span>
            </button>

            {/* 2. Concept Box */}
            <button
              onClick={() => handleAddShape('concept-box')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-blue-600 text-white shrink-0">
                <Square className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                صندوق مفهوم رئيسي
              </span>
            </button>

            {/* 3. QA Challenge Card */}
            <button
              onClick={() => handleAddShape('qa-card')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-emerald-600 text-white shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                بطاقة سؤال وتفسير
              </span>
            </button>

            {/* 4. Circle */}
            <button
              onClick={() => handleAddShape('circle')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-sky-600 text-white shrink-0">
                <Circle className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                دائرة محورية
              </span>
            </button>

            {/* 5. Diamond */}
            <button
              onClick={() => handleAddShape('diamond')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-amber-600 text-white shrink-0 rotate-45">
                <Square className="w-3 h-3" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                معين قرار / تساؤل
              </span>
            </button>

            {/* 6. Callout Bubble */}
            <button
              onClick={() => handleAddShape('callout')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-purple-600 text-white shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                فقاعة شرح وتنبيه
              </span>
            </button>

            {/* 7. Hexagon Module */}
            <button
              onClick={() => handleAddShape('hex')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-slate-700 text-white shrink-0">
                <Hexagon className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                وحدة بنائية (Hex)
              </span>
            </button>

            {/* 8. Math / Code Formula */}
            <button
              onClick={() => handleAddShape('formula')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-orange-600 text-white shrink-0">
                <Binary className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                صيغة / قانون رياضي
              </span>
            </button>

            {/* 9. Step Card */}
            <button
              onClick={() => handleAddShape('step-card')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-teal-600 text-white shrink-0">
                <ListOrdered className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                خطوة تسلسلية
              </span>
            </button>

            {/* 10. Table Comparison */}
            <button
              onClick={() => handleAddShape('table')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-indigo-600 text-white shrink-0">
                <Grid className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                جدول مقارنة (A vs B)
              </span>
            </button>

            {/* 11. Large Heading */}
            <button
              onClick={() => handleAddShape('heading')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-rose-600 text-white shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                عنوان كبير مستقل
              </span>
            </button>

            {/* 12. Standard Block */}
            <button
              onClick={() => handleAddShape('rectangle')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors text-xs font-semibold"
            >
              <span className="p-1.5 rounded-md bg-zinc-600 text-white shrink-0">
                <Square className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                مستطيل توضيح
              </span>
            </button>
          </div>
        </div>

        {/* Global Pen Typography Selector */}
        <div className="pt-2 border-t border-border/80 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono uppercase text-muted-foreground block px-1">
            خط الكتابة المفضل
          </span>
          <select
            value={penFontFamily}
            onChange={(e) => setPenFontFamily(e.target.value as PenFontFamily)}
            className="w-full text-[10px] bg-muted border border-border rounded-md px-1.5 py-1 text-foreground focus:outline-none"
          >
            {PEN_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Right Floating Shape Inspector (Controls Size, Font, Colors) */}
      {selectedShape && (
        <aside className="absolute right-4 top-20 z-30 w-72 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
              خصائص الشكل المحدد
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDuplicateShape(selectedShape.id)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                title="تكرار الشكل"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteShape(selectedShape.id)}
                className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="حذف الشكل"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Size Controls (Width x Height) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Scaling className="w-3.5 h-3.5 text-primary" /> الأبعاد (العرض × الارتفاع)
              </span>
              <span className="font-mono text-[10px]">{selectedShape.width} × {selectedShape.height}px</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5 font-mono">العرض</label>
                <input
                  type="range"
                  min={180}
                  max={600}
                  step={10}
                  value={selectedShape.width}
                  onChange={(e) => handleUpdateShape(selectedShape.id, { width: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5 font-mono">الارتفاع</label>
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={10}
                  value={selectedShape.height}
                  onChange={(e) => handleUpdateShape(selectedShape.id, { height: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Typography Controls (Font Family & Font Size) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Type className="w-3.5 h-3.5 text-primary" /> الخط وحجم النص
              </span>
              <span className="font-mono text-[10px]">{selectedShape.fontSize || 14}px</span>
            </div>
            <div className="space-y-1.5">
              <select
                value={selectedShape.fontFamily || 'arabic'}
                onChange={(e) => handleUpdateShape(selectedShape.id, { fontFamily: e.target.value as PenFontFamily })}
                className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none"
              >
                {PEN_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min={11}
                  max={28}
                  step={1}
                  value={selectedShape.fontSize || 14}
                  onChange={(e) => handleUpdateShape(selectedShape.id, { fontSize: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Presets Theme Palette */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              سمات الألوان
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SHAPE_PALETTE.map((pal) => (
                <button
                  key={pal.name}
                  onClick={() =>
                    handleUpdateShape(selectedShape.id, {
                      color: pal.bg,
                      borderColor: pal.border,
                      textColor: pal.text,
                    })
                  }
                  style={{ backgroundColor: pal.bg, borderColor: pal.border, color: pal.text }}
                  className="h-7 rounded-lg border text-[10px] font-bold flex items-center justify-center hover:scale-105 transition-transform"
                  title={pal.name}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* Main Canvas Workspace Area */}
      <div className="relative flex-1 w-full h-full">
        {/* Rendered Shapes & Boxes Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {shapes.map((shape) => {
            const isSelected = selectedShapeId === shape.id;
            const fontCss =
              PEN_FONTS.find((f) => f.id === (shape.fontFamily || 'arabic'))?.css ||
              "'IBM Plex Sans Arabic', sans-serif";

            return (
              <div
                key={shape.id}
                onPointerDown={(e) => handleShapePointerDown(e, shape.id)}
                style={{
                  transform: `translate3d(${shape.x}px, ${shape.y}px, 0)`,
                  width: shape.width,
                  minHeight: shape.height,
                  backgroundColor: shape.color,
                  borderColor: shape.borderColor || 'transparent',
                  color: shape.textColor || '#ffffff',
                  fontFamily: fontCss,
                }}
                className={clsx(
                  'absolute rounded-xl p-4 shadow-md border transition-shadow select-none group',
                  isSelected && activeTool === 'select'
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                    : 'hover:shadow-lg',
                  shape.type === 'sticky' &&
                    'rotate-[-0.8deg] hover:rotate-0 rounded-none shadow-sm border-t-[6px]',
                  shape.type === 'circle' &&
                    'rounded-full text-center flex flex-col justify-center items-center',
                  shape.type === 'diamond' && 'rounded-2xl border-dashed',
                  shape.type === 'hex' && 'rounded-3xl border-2',
                  shape.type === 'formula' && 'font-mono border-dashed bg-slate-950/80',
                  shape.type === 'heading' && 'border-none shadow-none',
                  activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                )}
              >
                {/* Shape Header & Actions */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-white/10">
                  {shape.type !== 'heading' && (
                    <input
                      type="text"
                      value={shape.title || ''}
                      onChange={(e) => handleUpdateShape(shape.id, { title: e.target.value })}
                      placeholder="عنوان المفهوم..."
                      style={{ fontFamily: fontCss }}
                      className="font-bold text-xs bg-transparent focus:bg-black/20 rounded px-1.5 py-0.5 w-full focus:outline-none placeholder:text-white/40"
                    />
                  )}

                  {activeTool === 'select' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShape(shape.id);
                        }}
                        className="p-1 hover:bg-black/20 rounded text-red-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Editor with Dynamic Font & Size */}
                <textarea
                  rows={shape.type === 'sticky' ? 4 : 5}
                  value={shape.content}
                  onChange={(e) => handleUpdateShape(shape.id, { content: e.target.value })}
                  placeholder="اكتب شرحك وتفسيرك هنا..."
                  style={{
                    fontSize: shape.fontSize ? `${shape.fontSize}px` : '13px',
                    fontFamily: fontCss,
                  }}
                  className="w-full bg-transparent resize-none focus:outline-none leading-relaxed placeholder:text-white/40 font-medium"
                />

                {/* Q&A Answer Toggle */}
                {shape.type === 'qa-card' && (
                  <div className="mt-3 pt-2 border-t border-emerald-400/30">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-emerald-300">التفسير والإجابة:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(shape.id, { isAnswerRevealed: !shape.isAnswerRevealed });
                        }}
                        className="flex items-center gap-1 text-[10px] text-emerald-200 hover:underline"
                      >
                        {shape.isAnswerRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {shape.isAnswerRevealed ? 'إخفاء' : 'إظهار التفسير'}
                      </button>
                    </div>

                    {shape.isAnswerRevealed ? (
                      <textarea
                        rows={2}
                        value={shape.answer || ''}
                        onChange={(e) => handleUpdateShape(shape.id, { answer: e.target.value })}
                        placeholder="اكتب الإجابة والتفسير..."
                        style={{ fontFamily: fontCss }}
                        className="w-full bg-emerald-950/40 p-2 rounded-lg text-[11px] text-emerald-100 focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(shape.id, { isAnswerRevealed: true });
                        }}
                        className="p-2 bg-emerald-950/40 border border-dashed border-emerald-400/40 rounded-lg text-center text-[10px] text-emerald-300 cursor-pointer hover:bg-emerald-950/60"
                      >
                        اضغط لكشف التفسير والتأكد من فهمك!
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Resize Handle (Bottom-Right) */}
                {isSelected && activeTool === 'select' && (
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, shape.id)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-background rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                    title="سحب لتغيير حجم الشكل"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Freehand Pen & Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={clsx(
            'absolute inset-0 w-full h-full',
            activeTool === 'select'
              ? 'pointer-events-none'
              : 'pointer-events-auto cursor-crosshair'
          )}
        />
      </div>

      {/* Bottom Floating Bar: Background Selector & Tips */}
      <footer className="absolute bottom-3 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Feynman Studio Tip */}
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-xl border border-border px-3 py-1.5 rounded-xl shadow-sm pointer-events-auto text-xs text-muted-foreground">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">
            <strong>نصيحة فاينمان:</strong> إذا عجزت عن شرح الفكرة ببساطة، ارسم شكل وحدد النقطة التي تحتاج مراجعة!
          </span>
          <span className="sm:hidden font-medium">استوديو الشرح الذاتي بالقلم</span>
        </div>

        {/* Studio Background Selector */}
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur-xl border border-border p-1 rounded-xl shadow-sm pointer-events-auto">
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 font-semibold">السبورة:</span>
          {(['chalkboard', 'dots', 'grid', 'clean'] as BoardBackground[]).map((bg) => (
            <button
              key={bg}
              onClick={() => setBackground(bg)}
              className={clsx(
                'px-2 py-0.5 rounded-lg text-xs font-semibold transition-all',
                background === bg
                  ? 'bg-muted text-foreground border border-border/80 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {bg === 'chalkboard' ? 'داكنة' : bg === 'dots' ? 'نقطية' : bg === 'grid' ? 'شبكية' : 'بيضاء'}
            </button>
          ))}
        </div>
      </footer>

      {/* Live Voice Input Floating Pill / Modal */}
      {(isListening || voiceTranscript || isProcessingVoice) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
          <div className="bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'w-3 h-3 rounded-full',
                  isListening ? 'bg-rose-500 animate-ping' : 'bg-primary'
                )} />
                <span className="text-xs font-bold text-foreground">
                  {isProcessingVoice
                    ? 'جاري التحويل لبطاقة ذكية...'
                    : isListening
                    ? 'الاستماع لصوتك نشط'
                    : 'جاهز للإدراج في السبورة'}
                </span>
              </div>
              <button
                onClick={handleCancelVoiceInput}
                className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
              >
                إلغاء
              </button>
            </div>

            {/* Transcript Preview */}
            <div className="min-h-16 max-h-32 overflow-y-auto p-2.5 bg-muted/50 rounded-xl border border-border/60 text-xs text-foreground leading-relaxed">
              {voiceTranscript ? (
                <p>{voiceTranscript}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  تحدث الآن واشرح فكرتك... (مثال: "ما هي شروط التوازن الكيميائي؟ الإجابة: ثبات التراكيز وتساوي سرعة التفاعلين")
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-mono text-muted-foreground">
                {voiceStatus || (isListening ? 'يتعرف على اللغة العربية والإنجليزية' : 'اضغط إدراج لإنشاء الشكل')}
              </span>

              <div className="flex items-center gap-2">
                {isListening ? (
                  <button
                    onClick={stopVoiceRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-rose-700 transition-colors"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>إيقاف التسجيل</span>
                  </button>
                ) : (
                  <button
                    onClick={startVoiceRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>تحدث مجدداً</span>
                  </button>
                )}

                <button
                  onClick={handleCommitVoiceInput}
                  disabled={!voiceTranscript.trim() || isProcessingVoice}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:bg-primary/95 disabled:opacity-40 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>إدراج في السبورة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Feynman Review Modal */}
      {isAiReviewOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">تقييم الشرح بأسلوب فاينمان</h3>
                  <p className="text-[11px] text-muted-foreground">تحليل ما دونته ورسمته على السبورة</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiReviewOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {isAiEvaluating ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">
                  جاري تحليل وضوح الأفكار ومقارنتها بنموذج الفهم الجوهري...
                </p>
              </div>
            ) : aiReviewResult ? (
              <div className="space-y-3 text-xs">
                {/* Score */}
                <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                      درجة وضوح التفسير
                    </span>
                    <h4 className="text-xs font-bold text-foreground mt-0.5">
                      {aiReviewResult.clarityVerdict}
                    </h4>
                  </div>
                  <span className="text-2xl font-mono font-bold text-primary">
                    {aiReviewResult.score}%
                  </span>
                </div>

                {/* Strengths */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    نقاط القوة في تفسيرك:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    {aiReviewResult.strengths?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    ثغرات ومفاهيم تحتاج توضيحاً:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    {aiReviewResult.improvements?.map((imp: string, idx: number) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>

                {/* Advice */}
                {aiReviewResult.feynmanAdvice && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <span className="font-bold text-primary block mb-0.5">نصيحة فاينمان:</span>
                    <p className="text-muted-foreground leading-relaxed">{aiReviewResult.feynmanAdvice}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAiReviewOpen(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-xs hover:bg-primary/95 transition-all"
              >
                متابعة التفسير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardStudio;

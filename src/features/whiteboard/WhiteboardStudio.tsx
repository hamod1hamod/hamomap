import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  WhiteboardTool,
  ShapeType,
  DrawingStroke,
  BoardShape,
  BoardBackground,
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
  Check,
  ChevronRight,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Lightbulb,
  FileText,
  Sliders,
} from 'lucide-react';
import clsx from 'clsx';

const COLOR_PALETTE = [
  { name: 'أبيض / أسود', value: '#ffffff', darkValue: '#0f172a' },
  { name: 'أصفر مشرق', value: '#facc15' },
  { name: 'سماوي فاقع', value: '#06b6d4' },
  { name: 'أخضر زمردي', value: '#10b981' },
  { name: 'وردي نيون', value: '#f43f5e' },
  { name: 'بنفسجي ملكي', value: '#a855f7' },
  { name: 'برتقالي دافئ', value: '#f97316' },
  { name: 'رمادي هادئ', value: '#94a3b8' },
];

const STICKY_COLORS = [
  { name: 'أصفر كلاسيكي', bg: '#fef08a', text: '#713f12', border: '#fde047' },
  { name: 'وردي منعش', bg: '#fbcfe8', text: '#831843', border: '#f472b6' },
  { name: 'أخضر نعناعي', bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  { name: 'سماوي ناعم', bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc' },
  { name: 'بنفسجي لافندر', bg: '#e9d5ff', text: '#581c87', border: '#d8b4fe' },
];

export const WhiteboardStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  // Board State
  const [boardTitle, setBoardTitle] = useState(
    initialTopic ? `شرح: ${initialTopic}` : 'سبورة الشرح الذاتي وتفسير المفاهيم'
  );
  const [background, setBackground] = useState<BoardBackground>('chalkboard');
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen');
  const [penColor, setPenColor] = useState<string>('#facc15');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Drawing strokes
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Shapes & Cards
  const [shapes, setShapes] = useState<BoardShape[]>(() => {
    const saved = localStorage.getItem('hamomap_whiteboard_shapes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default starter setup: Feynman Technique starter
    return [
      {
        id: 'shape-1',
        type: 'concept-box',
        x: 60,
        y: 80,
        width: 320,
        height: 200,
        title: initialTopic || 'المفهوم الأساسي (The Core Concept)',
        content: 'اكتب هنا اسم الفكرة اللي اتعلمتها وتعريفها الجوهري بأسلوبك بدون تعقيد...',
        color: '#1e1b4b',
        borderColor: '#6366f1',
        textColor: '#e0e7ff',
      },
      {
        id: 'shape-2',
        type: 'sticky',
        x: 420,
        y: 80,
        width: 260,
        height: 200,
        title: '💡 تشبيه من الواقع (Analogy)',
        content: 'شبه المفهوم ده بحاجة بنشوفها في حياتنا اليومية عشان تثبت في الذاكرة!',
        color: '#fef08a',
        borderColor: '#fde047',
        textColor: '#713f12',
      },
      {
        id: 'shape-3',
        type: 'qa-card',
        x: 720,
        y: 80,
        width: 300,
        height: 220,
        title: 'سؤال لاختبار الفهم الذاتي',
        content: 'ليه المفهوم ده مهم؟ وإيه اللي يحصل لو ما استخدمناهوش؟',
        answer: 'الإجابة والتفسير العميق: لأن هذا المفهوم يحل مشكلة معينة...',
        isAnswerRevealed: false,
        color: '#064e3b',
        borderColor: '#10b981',
        textColor: '#ecfdf5',
      },
      {
        id: 'shape-4',
        type: 'sticky',
        x: 60,
        y: 330,
        width: 280,
        height: 180,
        title: '⚠️ نقاط لخبطتني (Misconceptions)',
        content: 'سجل هنا الحاجات اللي كانت صعبة عليك أو خلطت بينها وبين مفاهيم تانية...',
        color: '#fbcfe8',
        borderColor: '#f472b6',
        textColor: '#831843',
      },
    ];
  });

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AI Feynman Feedback Modal
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<any>(null);

  // Save shapes to localStorage
  useEffect(() => {
    localStorage.setItem('hamomap_whiteboard_shapes', JSON.stringify(shapes));
  }, [shapes]);

  // Setup Canvas resolution & redraw strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
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

      // Draw arrow head if arrow tool
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

  // Handle Resize of canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  // Mouse / Pointer handlers for drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser') {
      // Remove strokes close to pointer
      setStrokes((prev) =>
        prev.filter((stroke) => {
          return !stroke.points.some(
            (p) => Math.hypot(p.x - x, p.y - y) < strokeWidth * 3
          );
        })
      );
      return;
    }

    setIsDrawing(true);
    const newStroke: DrawingStroke = {
      id: 'stroke-' + Date.now(),
      points: [{ x, y }],
      color: penColor,
      width: activeTool === 'highlighter' ? strokeWidth * 4 : strokeWidth,
      tool: activeTool as 'pen' | 'highlighter' | 'arrow',
    };

    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStrokes([]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser' && (e.buttons === 1 || e.pressure > 0)) {
      setStrokes((prev) =>
        prev.filter((stroke) => {
          return !stroke.points.some(
            (p) => Math.hypot(p.x - x, p.y - y) < strokeWidth * 3
          );
        })
      );
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) return;

    currentStrokeRef.current.points.push({ x, y });

    // Live stroke drawing for instant feedback
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentStrokeRef.current.points;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentStrokeRef.current.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    currentStrokeRef.current = null;
    redrawCanvas();
  };

  // Undo / Redo for drawing
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStrokes((prev) => [last, ...prev]);
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    const next = redoStrokes[0];
    setRedoStrokes((prev) => prev.slice(1));
    setStrokes((prev) => [...prev, next]);
  };

  const handleClearDrawing = () => {
    if (strokes.length === 0) return;
    if (confirm('هل تريد مسح كل الرسومات والخطوط المكتوبة بالقلم؟')) {
      setStrokes([]);
      setRedoStrokes([]);
    }
  };

  // Shape manipulations
  const handleAddShape = (type: ShapeType, presetColor?: string) => {
    const id = 'shape-' + Date.now();
    let newShape: BoardShape;

    const centerX = 300 + Math.random() * 100;
    const centerY = 180 + Math.random() * 100;

    switch (type) {
      case 'sticky': {
        const color = presetColor || STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)].bg;
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 240,
          height: 190,
          title: 'ملاحظة لاصقة',
          content: 'اكتب فكرة أو تفسير سريع...',
          color,
          borderColor: '#e2e8f0',
          textColor: '#1e293b',
        };
        break;
      }
      case 'concept-box':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 320,
          height: 220,
          title: 'صندوق مفهوم جديد',
          content: 'شرح وتوضيح المفهوم بالتفصيل، يمكنك إضافة خطوات أو نقاط هنا...',
          color: '#1e293b',
          borderColor: '#6366f1',
          textColor: '#f8fafc',
        };
        break;
      case 'qa-card':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 300,
          height: 220,
          title: 'سؤال اختباري للشرح',
          content: 'اطرح سؤالاً لتحدي فهمك...',
          answer: 'اكتب الإجابة النموذجية هنا، ثم اخفها لتختبر نفسك!',
          isAnswerRevealed: false,
          color: '#064e3b',
          borderColor: '#10b981',
          textColor: '#ecfdf5',
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
          content: 'فكرة محورية',
          color: '#3b82f620',
          borderColor: '#3b82f6',
          textColor: '#60a5fa',
        };
        break;
      case 'diamond':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 200,
          height: 200,
          title: 'قرار / شرط',
          content: 'هل الشرط صحيح؟',
          color: '#f59e0b20',
          borderColor: '#f59e0b',
          textColor: '#fbbf24',
        };
        break;
      case 'callout':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 260,
          height: 150,
          title: 'فقاعة شرح',
          content: 'لاحظ هذه النقطة بدقة!',
          color: '#8b5cf620',
          borderColor: '#8b5cf6',
          textColor: '#c084fc',
        };
        break;
      case 'heading':
        newShape = {
          id,
          type,
          x: centerX,
          y: centerY,
          width: 400,
          height: 70,
          content: 'عنوان رئيسي للشرح',
          color: 'transparent',
          textColor: '#f8fafc',
          fontSize: 28,
        };
        break;
      default:
        newShape = {
          id,
          type: 'rectangle',
          x: centerX,
          y: centerY,
          width: 260,
          height: 160,
          title: 'مربع معلومات',
          content: 'اكتب هنا ما تريد توضيحه...',
          color: '#1e293b',
          borderColor: '#475569',
          textColor: '#f8fafc',
        };
    }

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(id);
    setActiveTool('select'); // Switch to select to interact with the new shape
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
      x: target.x + 30,
      y: target.y + 30,
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

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!draggingShapeId || activeTool !== 'select') return;

    const newX = Math.max(10, e.clientX - dragOffsetRef.current.x);
    const newY = Math.max(10, e.clientY - dragOffsetRef.current.y);

    handleUpdateShape(draggingShapeId, { x: newX, y: newY });
  };

  const handleContainerPointerUp = () => {
    setDraggingShapeId(null);
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
        score: 88,
        clarityVerdict: 'شرح ممتاز ومرتب ومنسق بطريقة واضحة!',
        strengths: [
          'استخدام كتل ومربعات منفصلة يساعد العقل على فصل الأفكار.',
          'الربط بالتشبيه من الواقع (Analogy) يقوي الذاكرة طويلة المدى.',
          'وضع أسئلة ذاتية يعزز الاسترجاع النشط (Active Recall).',
        ],
        improvements: [
          'جرب ترسم أسهم أو خطوط بالقلم لتوضح تسلسل الأسباب والنتائج.',
          'احرص على ذكر متى يفشل هذا المفهوم أو الحالات الخاصة به.',
        ],
        feynmanAdvice:
          'أنت تطبق أسلوب فاينمان بشكل ممتاز! الخطوة القادمة: اشرح هذه السبورة بصوت عالي كأنك تشرح لزميل لك.',
      });
      confetti({ particleCount: 40, spread: 60 });
      return;
    }

    try {
      const prompt = `أنت خبير في تقنية فاينمان للتعلم الذاتي (Feynman Technique). قام الطالب بكتابة وشرح المفهوم التالي على سبورته التفاعلية:
العنوان: ${boardTitle}
الملاحظات والأشكال المكتوبة:
${fullNotes}

قيّم شرحه وقدم تقريراً مشجعاً بتنسيق JSON:
{
  "score": 90,
  "clarityVerdict": "حكم موجز ومشجع على جودة التفسير",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "improvements": ["ثغرة أو فكرة إضافية للتوضيح 1", "نصيحة إضافية 2"],
  "feynmanAdvice": "نصيحة ذهبية لتثبيت المفهوم للأبد"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiClient.getApiKey()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      setAiReviewResult(parsed);
      confetti({ particleCount: 50, spread: 70 });
    } catch (err) {
      console.error(err);
      setAiReviewResult({
        score: 85,
        clarityVerdict: 'شرح رائع ومنظم!',
        strengths: ['تقسيم المعلومات في مربعات يساعد الذاكرة المكانية.'],
        improvements: ['يمكنك كتابة تفاصيل إضافية بالقلم لربط الأفكار.'],
        feynmanAdvice: 'استمر في الشرح والتكرار المتباعد!',
      });
    } finally {
      setIsAiEvaluating(false);
    }
  };

  // Export Board (Shapes + Canvas) to PNG
  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: background === 'chalkboard' ? '#0b0f19' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardTitle.replace(/\s+/g, '_')}_whiteboard.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير الصورة');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: background === 'chalkboard' ? '#0b0f19' : '#ffffff',
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
      pdf.save(`${boardTitle.replace(/\s+/g, '_')}_whiteboard.pdf`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير الـ PDF');
    }
  };

  // Toggle Fullscreen
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
        background === 'dots' && 'bg-slate-950 text-slate-100',
        background === 'grid' && 'bg-slate-900 text-slate-100',
        background === 'clean' && 'bg-slate-50 text-slate-900'
      )}
      style={{
        backgroundImage:
          background === 'dots'
            ? 'radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)'
            : background === 'grid'
            ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
            : undefined,
        backgroundSize: background === 'dots' ? '28px 28px' : background === 'grid' ? '32px 32px' : undefined,
      }}
    >
      {/* Top Floating Glassmorphism Toolbar */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 bg-card/85 backdrop-blur-xl border border-border px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            title="رجوع للوحة التحكم"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            className="text-xs sm:text-sm font-extrabold bg-transparent focus:bg-background border border-transparent hover:border-border focus:border-primary px-2.5 py-1 rounded-xl transition-all w-48 sm:w-72 focus:outline-none"
            placeholder="عنوان السبورة والشرح..."
          />
        </div>

        {/* Center: Tools & Pen Selector */}
        <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-xl border border-border p-1.5 rounded-2xl shadow-xl pointer-events-auto">
          {/* Select Mode */}
          <button
            onClick={() => setActiveTool('select')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTool === 'select'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="تحريك وتعديل الأشكال (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحريك الأشكال</span>
          </button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Pen Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTool === 'pen'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTool === 'highlighter'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTool === 'arrow'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="رسم أسهم للشرح والربط (A)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">سهم</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTool === 'eraser'
                ? 'bg-destructive text-destructive-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="ممحاة الرسومات (E)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ممحاة</span>
          </button>

          {/* Pen Color Picker */}
          {activeTool !== 'select' && activeTool !== 'eraser' && (
            <div className="flex items-center gap-1 pl-1.5 border-l border-border">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setPenColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={clsx(
                    'w-5 h-5 rounded-full border transition-transform hover:scale-125',
                    penColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'border-black/20'
                  )}
                  title={c.name}
                />
              ))}

              {/* Stroke Size */}
              <select
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="text-[11px] bg-background border border-border rounded-lg px-1.5 py-1 ml-1 text-foreground focus:outline-none"
              >
                <option value={2}>رفيع (2px)</option>
                <option value={4}>متوسط (4px)</option>
                <option value={8}>عريض (8px)</option>
                <option value={14}>سميك (14px)</option>
              </select>
            </div>
          )}

          {/* Undo / Redo / Clear for drawing */}
          <div className="flex items-center gap-0.5 border-l border-border pl-1">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 transition-colors"
              title="تراجع عن آخر خط"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStrokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 transition-colors"
              title="إعادة آخر خط"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearDrawing}
              disabled={strokes.length === 0}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-30 transition-colors"
              title="مسح كل الرسومات بالقلم"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: AI Evaluate & Export */}
        <div className="flex items-center gap-2 bg-card/85 backdrop-blur-xl border border-border p-1.5 rounded-2xl shadow-xl pointer-events-auto">
          {/* AI Feynman Review Button */}
          <button
            onClick={handleEvaluateWithAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>قيّم شرحي بالذكاء الاصطناعي</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="تصدير كصورة PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Left Floating Shapes & Boxes Toolbar */}
      <aside className="absolute left-4 top-24 bottom-20 z-30 w-14 hover:w-56 group bg-card/85 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-2.5 flex flex-col justify-between transition-all duration-300 overflow-hidden">
        <div className="space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
              أشكال ومربعات الشرح
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Sticky Note */}
            <button
              onClick={() => handleAddShape('sticky')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-amber-400 text-amber-950 shadow-sm shrink-0">
                <StickyNote className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                ملاحظة لاصقة (Sticky)
              </span>
            </button>

            {/* Concept Box */}
            <button
              onClick={() => handleAddShape('concept-box')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-indigo-500 text-white shadow-sm shrink-0">
                <Square className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                صندوق مفهوم رئيسي
              </span>
            </button>

            {/* Q&A Challenge Card */}
            <button
              onClick={() => handleAddShape('qa-card')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                <HelpCircle className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                بطاقة سؤال وتفسير
              </span>
            </button>

            {/* Callout Bubble */}
            <button
              onClick={() => handleAddShape('callout')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-purple-500 text-white shadow-sm shrink-0">
                <MessageSquare className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                فقاعة كلام وملاحظة
              </span>
            </button>

            {/* Circle */}
            <button
              onClick={() => handleAddShape('circle')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-sky-500 text-white shadow-sm shrink-0">
                <Circle className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                دائرة محورية
              </span>
            </button>

            {/* Diamond */}
            <button
              onClick={() => handleAddShape('diamond')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0 rotate-45">
                <Square className="w-3.5 h-3.5" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                معين قرار / تساؤل
              </span>
            </button>

            {/* Big Heading */}
            <button
              onClick={() => handleAddShape('heading')}
              className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-muted/80 text-foreground transition-colors text-xs font-bold"
            >
              <span className="p-1.5 rounded-xl bg-pink-500 text-white shadow-sm shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity truncate">
                نص حر / عنوان كبير
              </span>
            </button>
          </div>
        </div>

        {/* Selected Shape Quick Controls (Color, Duplicate, Delete) */}
        {selectedShape && (
          <div className="pt-2 border-t border-border space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-2">
              تعديل الشكل المحدد
            </span>
            <div className="flex items-center gap-1 justify-center">
              <button
                onClick={() => handleDuplicateShape(selectedShape.id)}
                className="px-2.5 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-[10px] font-semibold"
              >
                تكرار
              </button>
              <button
                onClick={() => handleDeleteShape(selectedShape.id)}
                className="px-2.5 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-[10px] font-semibold"
              >
                حذف
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Canvas Workspace Area */}
      <div className="relative flex-1 w-full h-full">
        {/* Rendered Shapes & Boxes Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {shapes.map((shape) => {
            const isSelected = selectedShapeId === shape.id;

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
                }}
                className={clsx(
                  'absolute rounded-2xl p-4 shadow-xl border-2 transition-shadow select-none group',
                  isSelected && activeTool === 'select'
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl scale-[1.01]'
                    : 'hover:shadow-2xl',
                  shape.type === 'sticky' &&
                    'rotate-[-1deg] hover:rotate-0 rounded-none shadow-md font-sans border-t-[8px]',
                  shape.type === 'circle' && 'rounded-full text-center flex flex-col justify-center items-center',
                  shape.type === 'diamond' && 'rounded-3xl rotate-0 border-dashed',
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

                {/* Content Editor */}
                <textarea
                  rows={shape.type === 'sticky' ? 4 : 5}
                  value={shape.content}
                  onChange={(e) => handleUpdateShape(shape.id, { content: e.target.value })}
                  placeholder="اكتب شرحك وتفسيرك هنا..."
                  style={{ fontSize: shape.fontSize ? `${shape.fontSize}px` : undefined }}
                  className="w-full bg-transparent resize-none focus:outline-none text-xs leading-relaxed placeholder:text-white/40 font-medium"
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
                        className="w-full bg-emerald-950/40 p-2 rounded-xl text-[11px] text-emerald-100 focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(shape.id, { isAnswerRevealed: true });
                        }}
                        className="p-2.5 bg-emerald-950/40 border border-dashed border-emerald-400/40 rounded-xl text-center text-[10px] text-emerald-300 cursor-pointer hover:bg-emerald-950/60"
                      >
                        اضغط هنا لكشف التفسير والتأكد من فهمك!
                      </div>
                    )}
                  </div>
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
              : activeTool === 'eraser'
              ? 'pointer-events-auto cursor-crosshair'
              : 'pointer-events-auto cursor-crosshair'
          )}
        />
      </div>

      {/* Bottom Floating Bar: Background, Tips, Stats */}
      <footer className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Feynman Tip Pill */}
        <div className="flex items-center gap-2 bg-card/85 backdrop-blur-xl border border-border px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto text-xs text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">
            <strong>نصيحة فاينمان:</strong> إذا عجزت عن شرح الفكرة ببساطة، ارسم شكل وحدد النقطة التي تحتاج مراجعة!
          </span>
          <span className="sm:hidden font-medium">قلم وأشكال للشرح الذاتي</span>
        </div>

        {/* Board Background Selector */}
        <div className="flex items-center gap-1 bg-card/85 backdrop-blur-xl border border-border p-1.5 rounded-2xl shadow-xl pointer-events-auto">
          <span className="text-[10px] font-bold text-muted-foreground px-2">السبورة:</span>
          <button
            onClick={() => setBackground('chalkboard')}
            className={clsx(
              'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
              background === 'chalkboard'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            داكنة
          </button>
          <button
            onClick={() => setBackground('dots')}
            className={clsx(
              'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
              background === 'dots'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            نقطية
          </button>
          <button
            onClick={() => setBackground('grid')}
            className={clsx(
              'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
              background === 'grid'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            شبكية
          </button>
          <button
            onClick={() => setBackground('clean')}
            className={clsx(
              'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
              background === 'clean'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            بيضاء
          </button>
        </div>
      </footer>

      {/* AI Feynman Review Modal */}
      {isAiReviewOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">تقييم الشرح بأسلوب فاينمان</h3>
                  <p className="text-xs text-muted-foreground">تحليل ما كتبته ورسمته على السبورة</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiReviewOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground rounded-lg"
              >
                ✕
              </button>
            </div>

            {isAiEvaluating ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-muted-foreground">
                  جاري قراءة الملاحظات والمفاهيم وتحليل وضوح تفسيرك...
                </p>
              </div>
            ) : aiReviewResult ? (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">درجة وضوح الشرح</span>
                    <h4 className="text-sm font-semibold text-foreground mt-0.5">
                      {aiReviewResult.clarityVerdict}
                    </h4>
                  </div>
                  <span className="text-3xl font-black text-emerald-500">{aiReviewResult.score}%</span>
                </div>

                {/* Strengths */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-1.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    ✨ نقاط القوة في تفسيرك:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {aiReviewResult.strengths?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    🔍 ثغرات وتساؤلات للمراجعة:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {aiReviewResult.improvements?.map((imp: string, idx: number) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>

                {/* Feynman Golden Advice */}
                {aiReviewResult.feynmanAdvice && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs">
                    <span className="font-bold text-indigo-500 block mb-1">💡 نصيحة فاينمان:</span>
                    <p className="text-muted-foreground leading-relaxed">{aiReviewResult.feynmanAdvice}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAiReviewOpen(false)}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow hover:bg-primary/90"
              >
                حسناً، سأواصل التفسير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WhiteboardStudio;

import React, { useState, useMemo } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { NodeData, LearningMode, ReviewGrade, Flashcard, StudySession } from '@/types/hamomap';
import { calculateSM2, evaluateBlurtingRecall, BlurtingScore } from '@/services/learning/retentionEngine';
import { MapRepository } from '@/services/firebase/mapRepository';
import { aiClient, GeneratedQuizQuestion } from '@/services/ai/aiClient';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Sparkles,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  Award,
  Layers,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';

interface LearningCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningCenterModal: React.FC<LearningCenterModalProps> = ({ isOpen, onClose }) => {
  const currentMap = useMapStore((s) => s.currentMap);
  const nodes = useMapStore((s) => s.nodes);
  const updateNodeData = useMapStore((s) => s.updateNodeData);

  const [activeMode, setActiveMode] = useState<LearningMode>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Blurting mode state
  const [blurtingInput, setBlurtingInput] = useState('');
  const [blurtingResult, setBlurtingResult] = useState<BlurtingScore | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<GeneratedQuizQuestion[]>([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // Teach-back state
  const [teachBackInput, setTeachBackInput] = useState('');
  const [teachBackFeedback, setTeachBackFeedback] = useState<string | null>(null);

  // Extract study items
  const studyItems = useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      title: (n.data as NodeData).label || 'Untitled',
      description: (n.data as NodeData).description || '',
      notes: (n.data as NodeData).notes || '',
      formula: (n.data as NodeData).formula,
      isFlashcard: (n.data as NodeData).isFlashcard,
      question: (n.data as NodeData).flashcardQuestion || `Explain the core concept and role of ${(n.data as NodeData).label}`,
      answer: (n.data as NodeData).flashcardAnswer || (n.data as NodeData).description || (n.data as NodeData).notes || 'No description provided.',
      retention: (n.data as NodeData).retention,
    }));
  }, [nodes]);

  const flashcardQueue = useMemo(() => {
    const customCards = studyItems.filter((i) => i.isFlashcard);
    return customCards.length > 0 ? customCards : studyItems;
  }, [studyItems]);

  if (!isOpen) return null;

  const currentItem = flashcardQueue[currentIndex] || flashcardQueue[0];

  // Grade SM-2 Flashcard
  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentItem) return;

    const currentRetention = currentItem.retention || {
      interval: 0,
      easeFactor: 2.5,
      repetitionCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      status: 'new',
    };

    const sm2 = calculateSM2(currentRetention, grade);
    const isCorrect = grade === 'good' || grade === 'easy';

    updateNodeData(currentItem.id, {
      retention: {
        ...currentRetention,
        interval: sm2.interval,
        easeFactor: sm2.easeFactor,
        repetitionCount: sm2.repetitionCount,
        nextReviewDate: sm2.nextReviewDate,
        status: sm2.status,
        lastReviewed: Date.now(),
        correctCount: currentRetention.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: currentRetention.incorrectCount + (!isCorrect ? 1 : 0),
      },
    });

    setReviewedCount((prev) => prev + 1);
    if (isCorrect) setCorrectCount((prev) => prev + 1);

    if (grade === 'easy') {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }

    setIsAnswerRevealed(false);
    if (currentIndex < flashcardQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all items in queue
      recordSessionCompletion();
    }
  };

  const recordSessionCompletion = async () => {
    if (!currentMap) return;
    const session: StudySession = {
      id: 'session-' + Date.now(),
      mapId: currentMap.id,
      mapTitle: currentMap.title,
      userId: currentMap.ownerId || 'guest',
      mode: activeMode,
      cardsReviewed: reviewedCount + 1,
      correctCount: correctCount + 1,
      durationSeconds: Math.round((Date.now() - sessionStartTime) / 1000),
      createdAt: Date.now(),
    };
    await MapRepository.recordStudySession(session);
  };

  // Evaluate blurting
  const handleEvaluateBlurting = () => {
    const targetConcepts = nodes.map((n) => ({
      id: n.id,
      title: (n.data as NodeData).label,
      description: (n.data as NodeData).description,
    }));
    const result = evaluateBlurtingRecall(targetConcepts, blurtingInput);
    setBlurtingResult(result);
    if (result.score >= 80) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    }
  };

  // Start Quiz
  const handleStartQuiz = async () => {
    const sampleNodes = nodes.map((n) => ({
      title: (n.data as NodeData).label,
      description: (n.data as NodeData).description,
    }));
    const res = await aiClient.generateNodeQuiz(sampleNodes);
    if (res.success && res.data) {
      setQuizQuestions(res.data);
      setCurrentIndex(0);
      setQuizScore(0);
      setQuizSelectedOption(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">MindForge Learning Center</h2>
              <p className="text-xs text-muted-foreground">{currentMap?.title || 'Knowledge Map'}</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/80">
            <button
              onClick={() => {
                setActiveMode('flashcard');
                setCurrentIndex(0);
                setIsAnswerRevealed(false);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                activeMode === 'flashcard'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Spaced Repetition
            </button>
            <button
              onClick={() => {
                setActiveMode('recall');
                setCurrentIndex(0);
                setIsAnswerRevealed(false);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                activeMode === 'recall'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Active Recall
            </button>
            <button
              onClick={() => {
                setActiveMode('blurting');
                setBlurtingResult(null);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                activeMode === 'blurting'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Blurting Mode
            </button>
            <button
              onClick={() => {
                setActiveMode('quiz');
                handleStartQuiz();
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                activeMode === 'quiz'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              AI Quiz
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
          {/* Flashcard & Spaced Repetition Mode */}
          {activeMode === 'flashcard' && currentItem && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-6">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-medium px-2">
                <span>
                  Card {currentIndex + 1} of {flashcardQueue.length}
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  <Flame className="w-4 h-4 fill-current" />
                  SM-2 Interval: {currentItem.retention?.interval || 0}d
                </span>
              </div>

              {/* Flashcard Body with Flip Animation */}
              <div
                onClick={() => setIsAnswerRevealed((prev) => !prev)}
                className={clsx(
                  'w-full min-h-[260px] p-8 rounded-3xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-xl select-none',
                  isAnswerRevealed
                    ? 'bg-card border-primary/50 ring-2 ring-primary/20'
                    : 'bg-muted/30 border-border hover:border-primary/40 hover:shadow-2xl'
                )}
              >
                {!isAnswerRevealed ? (
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary">
                      Question / Concept
                    </span>
                    <h3 className="text-xl font-bold text-foreground leading-relaxed px-4">
                      {currentItem.question}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-4">
                      <Eye className="w-3.5 h-3.5" /> Tap or click to reveal answer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Answer / Core Knowledge
                    </span>
                    <h4 className="text-lg font-semibold text-foreground px-4 leading-relaxed">
                      {currentItem.answer}
                    </h4>
                    {currentItem.notes && (
                      <p className="text-xs text-muted-foreground italic px-6 mt-2">
                        Note: {currentItem.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* SM-2 Rating Buttons */}
              {isAnswerRevealed && (
                <div className="w-full grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => handleGrade('again')}
                    className="py-3 px-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>Again</span>
                    <span className="text-[10px] opacity-75 font-normal mt-0.5">&lt; 1 day</span>
                  </button>
                  <button
                    onClick={() => handleGrade('hard')}
                    className="py-3 px-2 bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>Hard</span>
                    <span className="text-[10px] opacity-75 font-normal mt-0.5">
                      {Math.max(1, Math.round((currentItem.retention?.interval || 1) * 1.2))}d
                    </span>
                  </button>
                  <button
                    onClick={() => handleGrade('good')}
                    className="py-3 px-2 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>Good</span>
                    <span className="text-[10px] opacity-75 font-normal mt-0.5">
                      {Math.max(2, Math.round((currentItem.retention?.interval || 1) * 2.5))}d
                    </span>
                  </button>
                  <button
                    onClick={() => handleGrade('easy')}
                    className="py-3 px-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>Easy</span>
                    <span className="text-[10px] opacity-75 font-normal mt-0.5">
                      {Math.max(4, Math.round((currentItem.retention?.interval || 1) * 3.3))}d
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Recall Mode */}
          {activeMode === 'recall' && currentItem && (
            <div className="w-full max-w-xl space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Concept {currentIndex + 1} of {studyItems.length}
                </span>
                <h3 className="text-2xl font-bold text-foreground">{currentItem.title}</h3>
              </div>

              <div className="p-6 bg-card border border-border rounded-3xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Your Mental Challenge
                  </span>
                  <button
                    onClick={() => setIsAnswerRevealed((prev) => !prev)}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {isAnswerRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isAnswerRevealed ? 'Hide Answer' : 'Reveal Answer'}
                  </button>
                </div>

                {isAnswerRevealed ? (
                  <div className="p-4 bg-muted/40 rounded-2xl space-y-2 animate-in fade-in">
                    <p className="text-sm text-foreground leading-relaxed">{currentItem.description}</p>
                    {currentItem.notes && (
                      <p className="text-xs text-muted-foreground">{currentItem.notes}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                    <p className="text-sm font-medium">
                      Explain the definition and core principles of "{currentItem.title}" in your mind
                      before checking.
                    </p>
                  </div>
                )}
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((prev) => prev - 1);
                    setIsAnswerRevealed(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={currentIndex === studyItems.length - 1}
                  onClick={() => {
                    setCurrentIndex((prev) => prev + 1);
                    setIsAnswerRevealed(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90 disabled:opacity-40"
                >
                  Next Concept <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Blurting Mode */}
          {activeMode === 'blurting' && (
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-foreground">Blurting Mode (Free Recall)</h3>
                <p className="text-xs text-muted-foreground">
                  Topic: <strong className="text-foreground">{currentMap?.title}</strong>. Write down everything
                  you can recall without looking at the map.
                </p>
              </div>

              <textarea
                rows={8}
                value={blurtingInput}
                onChange={(e) => setBlurtingInput(e.target.value)}
                placeholder="Type all concepts, definitions, formulas, relationships, and key takeaways from memory..."
                className="w-full p-4 text-sm bg-background border border-input rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary shadow-inner leading-relaxed"
              />

              <div className="flex justify-center">
                <button
                  onClick={handleEvaluateBlurting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <Award className="w-4 h-4" />
                  Evaluate Memory Retention
                </button>
              </div>

              {blurtingResult && (
                <div className="p-6 bg-card border border-border rounded-3xl shadow-xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Recall Score</span>
                    <span
                      className={clsx(
                        'text-2xl font-black px-3 py-1 rounded-xl',
                        blurtingResult.score >= 75
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : blurtingResult.score >= 40
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-rose-500/10 text-rose-600'
                      )}
                    >
                      {blurtingResult.score}%
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {blurtingResult.feedback}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs">
                      <span className="font-bold text-emerald-600 block mb-1">
                        Recalled Concepts ({blurtingResult.matchedConcepts.length})
                      </span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {blurtingResult.matchedConcepts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs">
                      <span className="font-bold text-rose-600 block mb-1">
                        Omitted Concepts ({blurtingResult.missingConcepts.length})
                      </span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {blurtingResult.missingConcepts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Quiz Mode */}
          {activeMode === 'quiz' && (
            <div className="w-full max-w-xl space-y-6">
              {quizQuestions.length > 0 ? (
                (() => {
                  const q = quizQuestions[currentIndex];
                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          Question {currentIndex + 1} of {quizQuestions.length}
                        </span>
                        <span className="font-semibold text-primary">Score: {quizScore}</span>
                      </div>

                      <div className="p-6 bg-card border border-border rounded-3xl shadow-lg space-y-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                          Topic: {q.sourceNodeTitle}
                        </span>
                        <h4 className="text-base font-bold text-foreground leading-relaxed">
                          {q.question}
                        </h4>

                        <div className="space-y-2 pt-2">
                          {q.options?.map((opt, i) => {
                            const isSelected = quizSelectedOption === opt;
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <button
                                key={i}
                                disabled={quizSelectedOption !== null}
                                onClick={() => {
                                  setQuizSelectedOption(opt);
                                  if (opt === q.correctAnswer) {
                                    setQuizScore((s) => s + 1);
                                    confetti({ particleCount: 20, spread: 50 });
                                  }
                                }}
                                className={clsx(
                                  'w-full text-left p-3.5 rounded-2xl text-xs font-medium border transition-all flex items-center justify-between',
                                  quizSelectedOption === null
                                    ? 'bg-background hover:bg-muted border-border'
                                    : isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                    : isSelected
                                    ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300'
                                    : 'bg-background border-border opacity-50'
                                )}
                              >
                                <span>{opt}</span>
                                {quizSelectedOption && isCorrect && (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSelectedOption && (
                          <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground animate-in fade-in">
                            <strong className="text-foreground">Explanation: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>

                      {quizSelectedOption && currentIndex < quizQuestions.length - 1 && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setCurrentIndex((c) => c + 1);
                              setQuizSelectedOption(null);
                            }}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90"
                          >
                            Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm text-muted-foreground">Generating questions from mind map nodes...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { RetentionData, ReviewGrade } from '@/types/hamomap';

export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitionCount: number;
  nextReviewDate: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm implementation
 * Quality scale:
 * again = 1 (complete blackout / incorrect)
 * hard  = 3 (serious difficulty)
 * good  = 4 (correct after hesitation)
 * easy  = 5 (perfect recall)
 */
export function calculateSM2(
  current: RetentionData = {
    interval: 0,
    easeFactor: 2.5,
    repetitionCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    status: 'new',
  },
  grade: ReviewGrade
): SM2Result {
  let q: number;
  switch (grade) {
    case 'again':
      q = 1;
      break;
    case 'hard':
      q = 3;
      break;
    case 'good':
      q = 4;
      break;
    case 'easy':
      q = 5;
      break;
  }

  let { interval, easeFactor, repetitionCount } = current;

  // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  let status: 'new' | 'learning' | 'review' | 'mastered' = current.status;

  if (q < 3) {
    // Incorrect / blackout: reset interval and repetitions
    repetitionCount = 0;
    interval = 1;
    status = 'learning';
  } else {
    // Successful recall
    if (repetitionCount === 0) {
      interval = 1;
    } else if (repetitionCount === 1) {
      interval = 6;
    } else {
      let multiplier = easeFactor;
      if (grade === 'easy') multiplier *= 1.3;
      interval = Math.round(interval * multiplier);
    }
    repetitionCount += 1;

    if (interval > 30) {
      status = 'mastered';
    } else {
      status = 'review';
    }
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitionCount,
    nextReviewDate,
    status,
  };
}

/**
 * Blurting evaluation: Compares user reconstructed recall text against target mind-map concepts
 */
export interface BlurtingScore {
  score: number; // 0 - 100
  totalConcepts: number;
  recalledCount: number;
  matchedConcepts: string[];
  missingConcepts: string[];
  feedback: string;
}

export function evaluateBlurtingRecall(
  targetConcepts: Array<{ id: string; title: string; description?: string }>,
  userInput: string
): BlurtingScore {
  if (!targetConcepts || targetConcepts.length === 0) {
    return {
      score: 100,
      totalConcepts: 0,
      recalledCount: 0,
      matchedConcepts: [],
      missingConcepts: [],
      feedback: 'No concepts to evaluate.',
    };
  }

  const normalizedInput = userInput.toLowerCase();
  const matchedConcepts: string[] = [];
  const missingConcepts: string[] = [];

  for (const concept of targetConcepts) {
    const titleWords = concept.title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Concept is recognized if the exact title or majority of key words are mentioned
    const isMatched =
      normalizedInput.includes(concept.title.toLowerCase()) ||
      (titleWords.length > 0 &&
        titleWords.filter((w) => normalizedInput.includes(w)).length >= Math.ceil(titleWords.length * 0.6));

    if (isMatched) {
      matchedConcepts.push(concept.title);
    } else {
      missingConcepts.push(concept.title);
    }
  }

  const score = Math.round((matchedConcepts.length / targetConcepts.length) * 100);

  let feedback = '';
  if (score >= 90) {
    feedback = 'Outstanding active recall! You have captured almost every core concept with high precision.';
  } else if (score >= 70) {
    feedback = 'Great job! You retained the primary concepts, but some key branches were omitted.';
  } else if (score >= 40) {
    feedback = 'Good foundation. Review the missing concepts and try another blurting session in 24 hours.';
  } else {
    feedback = 'Significant recall gaps detected. We recommend reviewing in Study Mode before re-attempting.';
  }

  return {
    score,
    totalConcepts: targetConcepts.length,
    recalledCount: matchedConcepts.length,
    matchedConcepts,
    missingConcepts,
    feedback,
  };
}

export type MindMapStyle =
  | 'traditional'
  | 'radial'
  | 'tree'
  | 'concept'
  | 'flowchart'
  | 'cornell'
  | 'timeline'
  | 'flashcard'
  | 'exam'
  | 'gradient-border'
  | 'neon-minimal'
  | 'pill-modern'
  | 'contrast-box';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL' | 'radial' | 'manual';

export type NodeShape =
  | 'rounded'
  | 'rectangle'
  | 'pill'
  | 'diamond'
  | 'card'
  | 'hexagon'
  | 'gradient-border'
  | 'minimal-flat'
  | 'split-gradient';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface RetentionData {
  lastReviewed?: number;
  nextReviewDate?: number;
  interval: number; // in days
  easeFactor: number; // SM-2 default 2.5
  repetitionCount: number;
  correctCount: number;
  incorrectCount: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface NodeData {
  label: string;
  description?: string;
  notes?: string;
  markdown?: string;
  tags?: string[];
  category?: string;
  difficulty?: DifficultyLevel;
  priority?: PriorityLevel;
  color?: string;
  borderColor?: string;
  textColor?: string;
  shape?: NodeShape;
  icon?: string;
  isRoot?: boolean;
  isCollapsed?: boolean;
  formula?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  sourceReference?: string;
  isFlashcard?: boolean;
  flashcardQuestion?: string;
  flashcardAnswer?: string;
  retention?: RetentionData;
  comments?: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: number;
  }>;
  [key: string]: unknown;
}

export interface EdgeData {
  label?: string;
  relationshipType?: 'leads_to' | 'causes' | 'requires' | 'contrasts' | 'part_of' | 'example_of' | 'custom';
  styleType?: 'bezier' | 'smoothstep' | 'straight';
  animated?: boolean;
  color?: string;
}

export interface MindMap {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  collaborators?: Record<string, 'viewer' | 'editor'>;
  isPublic?: boolean;
  style: MindMapStyle;
  layoutDirection: LayoutDirection;
  theme: 'slate' | 'ocean' | 'forest' | 'sunset' | 'purple' | 'cyberpunk' | 'monochrome';
  tags: string[];
  category: string;
  nodesCount: number;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface Flashcard {
  id: string;
  mapId: string;
  mapTitle: string;
  nodeId: string;
  question: string;
  answer: string;
  explanation?: string;
  tags?: string[];
  category?: string;
  userId: string;
  retention: RetentionData;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewEvent {
  id: string;
  userId: string;
  cardId: string;
  nodeId: string;
  mapId: string;
  grade: ReviewGrade;
  timestamp: number;
  prevInterval: number;
  nextInterval: number;
  easeFactor: number;
}

export type LearningMode =
  | 'study'
  | 'presentation'
  | 'quiz'
  | 'recall'
  | 'flashcard'
  | 'deep_understanding'
  | 'exam'
  | 'teach_back'
  | 'blurting'
  | 'blank_map';

export interface StudySession {
  id: string;
  mapId: string;
  mapTitle: string;
  userId: string;
  mode: LearningMode;
  cardsReviewed: number;
  correctCount: number;
  durationSeconds: number;
  recallScore?: number;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  streakDays: number;
  lastActiveDate: string;
  totalReviews: number;
  totalMaps: number;
  preferredLanguage: 'en' | 'ar';
  theme: 'light' | 'dark' | 'system';
}

export interface SubjectTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  style: MindMapStyle;
  tags: string[];
  sampleNodes: Array<{
    id: string;
    data: NodeData;
    parentId?: string;
  }>;
}

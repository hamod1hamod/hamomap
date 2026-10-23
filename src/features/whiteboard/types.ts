export type WhiteboardTool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'arrow';

export type ShapeType =
  | 'sticky'
  | 'concept-box'
  | 'qa-card'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'callout'
  | 'heading';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'arrow';
}

export interface BoardShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content: string;
  color: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  answer?: string;
  isAnswerRevealed?: boolean;
}

export type BoardBackground = 'chalkboard' | 'dots' | 'grid' | 'clean';

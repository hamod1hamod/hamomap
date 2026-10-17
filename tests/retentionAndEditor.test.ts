import { describe, it, expect } from 'vitest';
import { calculateSM2, evaluateBlurtingRecall } from '../src/services/learning/retentionEngine';
import { applyMindMapLayout } from '../src/services/layout/layoutEngine';
import { Node, Edge } from '@xyflow/react';

describe('Retention Engine - SuperMemo SM-2 Algorithm', () => {
  it('correctly schedules the first good review with interval 1 day', () => {
    const initial = {
      interval: 0,
      easeFactor: 2.5,
      repetitionCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      status: 'new' as const,
    };

    const result = calculateSM2(initial, 'good');
    expect(result.interval).toBe(1);
    expect(result.repetitionCount).toBe(1);
    expect(result.status).toBe('review');
    expect(result.easeFactor).toBe(2.5); // q=4 leaves EF unchanged
  });

  it('correctly advances repetition 1 to interval 6 days on good grade', () => {
    const stage1 = {
      interval: 1,
      easeFactor: 2.5,
      repetitionCount: 1,
      correctCount: 1,
      incorrectCount: 0,
      status: 'review' as const,
    };

    const result = calculateSM2(stage1, 'good');
    expect(result.interval).toBe(6);
    expect(result.repetitionCount).toBe(2);
  });

  it('applies ease factor multiplier on subsequent reviews', () => {
    const stage2 = {
      interval: 6,
      easeFactor: 2.5,
      repetitionCount: 2,
      correctCount: 2,
      incorrectCount: 0,
      status: 'review' as const,
    };

    const result = calculateSM2(stage2, 'good');
    expect(result.interval).toBe(15); // 6 * 2.5 = 15
    expect(result.repetitionCount).toBe(3);
  });

  it('resets interval and repetitions to 1 on "again" failure', () => {
    const advanced = {
      interval: 30,
      easeFactor: 2.6,
      repetitionCount: 5,
      correctCount: 5,
      incorrectCount: 0,
      status: 'mastered' as const,
    };

    const result = calculateSM2(advanced, 'again');
    expect(result.interval).toBe(1);
    expect(result.repetitionCount).toBe(0);
    expect(result.status).toBe('learning');
    expect(result.easeFactor).toBeLessThan(2.6);
  });

  it('ensures ease factor never drops below 1.3', () => {
    let state = {
      interval: 1,
      easeFactor: 1.35,
      repetitionCount: 0,
      correctCount: 0,
      incorrectCount: 3,
      status: 'learning' as const,
    };

    const result = calculateSM2(state, 'again');
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('Retention Engine - Blurting Active Recall Evaluation', () => {
  const targetConcepts = [
    { id: '1', title: 'Backpropagation' },
    { id: '2', title: 'Gradient Descent' },
    { id: '3', title: 'Activation Functions' },
    { id: '4', title: 'Transformers' },
  ];

  it('awards 100% when all concepts are mentioned in text', () => {
    const userText = 'Neural networks use backpropagation with gradient descent, activation functions, and transformers.';
    const score = evaluateBlurtingRecall(targetConcepts, userText);
    expect(score.score).toBe(100);
    expect(score.recalledCount).toBe(4);
    expect(score.missingConcepts.length).toBe(0);
  });

  it('correctly tracks omitted concepts and calculates partial score', () => {
    const userText = 'I remember backpropagation and gradient descent only.';
    const score = evaluateBlurtingRecall(targetConcepts, userText);
    expect(score.score).toBe(50);
    expect(score.matchedConcepts).toContain('Backpropagation');
    expect(score.matchedConcepts).toContain('Gradient Descent');
    expect(score.missingConcepts).toContain('Activation Functions');
    expect(score.missingConcepts).toContain('Transformers');
  });
});

describe('Layout Engine - Topology Tests', () => {
  it('correctly positions nodes in Radial layout around center', () => {
    const nodes: Node[] = [
      { id: 'root', position: { x: 0, y: 0 }, data: { label: 'Root', isRoot: true } },
      { id: 'c1', position: { x: 0, y: 0 }, data: { label: 'Child 1' } },
      { id: 'c2', position: { x: 0, y: 0 }, data: { label: 'Child 2' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'root', target: 'c1' },
      { id: 'e2', source: 'root', target: 'c2' },
    ];

    const result = applyMindMapLayout(nodes, edges, { style: 'radial' });
    const rootNode = result.nodes.find((n) => n.id === 'root');
    expect(rootNode?.position).toEqual({ x: 0, y: 0 });

    const c1 = result.nodes.find((n) => n.id === 'c1');
    const c2 = result.nodes.find((n) => n.id === 'c2');
    expect(c1?.position).not.toEqual({ x: 0, y: 0 });
    expect(c2?.position).not.toEqual({ x: 0, y: 0 });
  });

  it('correctly offsets hierarchical nodes in Tree Left-to-Right layout', () => {
    const nodes: Node[] = [
      { id: 'root', position: { x: 0, y: 0 }, data: { label: 'Root', isRoot: true } },
      { id: 'c1', position: { x: 0, y: 0 }, data: { label: 'Child 1' } },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'root', target: 'c1' }];

    const result = applyMindMapLayout(nodes, edges, { style: 'traditional', direction: 'LR' });
    const c1 = result.nodes.find((n) => n.id === 'c1');
    expect(c1?.position.x).toBeGreaterThan(0);
  });
});

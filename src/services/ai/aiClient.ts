import { NodeData, DifficultyLevel } from '@/types/hamomap';

export interface GeneratedMapStructure {
  title: string;
  root: {
    title: string;
    description: string;
    notes?: string;
    children: Array<{
      title: string;
      description: string;
      notes?: string;
      category?: string;
      difficulty?: DifficultyLevel;
      tags?: string[];
      children?: Array<{
        title: string;
        description: string;
        notes?: string;
        category?: string;
        tags?: string[];
      }>;
    }>;
  };
}

export interface TopicExplanation {
  simpleExplanation: string;
  detailedExplanation: string;
  realWorldExample: string;
  analogy: string;
  prerequisites: string[];
  commonMisconceptions: string[];
  practicalApplications: string[];
  relatedConcepts: string[];
}

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceNodeTitle: string;
}

export interface MapAuditSuggestion {
  type: 'missing_prerequisite' | 'duplicate_concept' | 'clarity' | 'structure';
  title: string;
  description: string;
  actionableRecommendation: string;
}

class AIClient {
  private userApiKey: string | null = null;

  constructor() {
    this.userApiKey = localStorage.getItem('hamomap_gemini_key') || null;
  }

  public setApiKey(key: string) {
    this.userApiKey = key.trim();
    if (this.userApiKey) {
      localStorage.setItem('hamomap_gemini_key', this.userApiKey);
    } else {
      localStorage.removeItem('hamomap_gemini_key');
    }
  }

  public getApiKey(): string | null {
    return this.userApiKey;
  }

  public isConfigured(): boolean {
    return Boolean(this.userApiKey);
  }

  /**
   * Generates a hierarchical Mind Map from raw text or topic
   */
  public async generateMindMapFromText(
    inputText: string,
    depth: 'compact' | 'standard' | 'comprehensive' = 'standard'
  ): Promise<{ success: boolean; data?: GeneratedMapStructure; error?: string }> {
    if (!this.isConfigured()) {
      // Graceful rule-based extraction fallback for structured text/markdown
      const fallback = this.extractStructuredTextFallback(inputText);
      if (fallback) {
        return { success: true, data: fallback };
      }
      return {
        success: false,
        error: 'AI is not configured. Please enter your Google Gemini API key in Settings (or use markdown bullet points for offline import).',
      };
    }

    try {
      const prompt = `You are MindForge AI, an expert knowledge architect. Convert the following text or topic into a structured mind map hierarchy.
Text / Topic: "${inputText}"
Depth: ${depth}

Return ONLY valid JSON matching this exact structure:
{
  "title": "Clear Topic Title",
  "root": {
    "title": "Central Concept",
    "description": "Clear 1-2 sentence core definition",
    "notes": "Essential background note",
    "children": [
      {
        "title": "Primary Subtopic",
        "description": "Definition and relevance",
        "category": "core",
        "difficulty": "medium",
        "tags": ["topic"],
        "children": [
          {
            "title": "Detailed Concept",
            "description": "Supporting detail and formula or example",
            "category": "detail",
            "tags": ["key-point"]
          }
        ]
      }
    ]
  }
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `API error (${res.status})`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No content returned from AI provider.');

      const parsed: GeneratedMapStructure = JSON.parse(text);
      return { success: true, data: parsed };
    } catch (err: any) {
      return { success: false, error: err.message || 'AI request failed' };
    }
  }

  /**
   * Explain a selected node concept at multiple cognitive levels
   */
  public async explainNode(
    nodeTitle: string,
    nodeDescription?: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<{ success: boolean; data?: TopicExplanation; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI is not configured. Please add your Gemini API key in Settings to unlock interactive explanations.',
      };
    }

    try {
      const prompt = `Explain the following concept for a ${level} learner:
Concept: "${nodeTitle}"
Context: "${nodeDescription || ''}"

Return JSON:
{
  "simpleExplanation": "Clear, jargon-free summary (1-2 paragraphs)",
  "detailedExplanation": "Technical and rigorous breakdown with key principles",
  "realWorldExample": "Concrete practical application or industry scenario",
  "analogy": "Intuitive, memorable metaphor",
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "commonMisconceptions": ["common pitfall 1", "common pitfall 2"],
  "practicalApplications": ["application A", "application B"],
  "relatedConcepts": ["concept X", "concept Y"]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const parsed: TopicExplanation = JSON.parse(json.candidates[0].content.parts[0].text);
      return { success: true, data: parsed };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates quiz questions (MCQ, True/False, Fill in Blank) for nodes
   */
  public async generateNodeQuiz(
    nodes: Array<{ title: string; description?: string }>
  ): Promise<{ success: boolean; data?: GeneratedQuizQuestion[]; error?: string }> {
    if (!this.isConfigured()) {
      // Offline fallback: generate basic review questions based on node definitions
      const offlineQuestions: GeneratedQuizQuestion[] = nodes.slice(0, 5).map((n, i) => ({
        id: `offline-q-${i}`,
        question: `What is the core definition or role of "${n.title}"?`,
        type: 'multiple_choice',
        options: [
          n.description || `Primary characteristic of ${n.title}`,
          `An unrelated background concept`,
          `Opposite function of ${n.title}`,
          `Historical deprecated approach`,
        ],
        correctAnswer: n.description || `Primary characteristic of ${n.title}`,
        explanation: n.description || `Core knowledge defined in node ${n.title}`,
        sourceNodeTitle: n.title,
      }));
      return { success: true, data: offlineQuestions };
    }

    try {
      const conceptsSummary = nodes
        .map((n) => `- ${n.title}: ${n.description || 'No description'}`)
        .join('\n');

      const prompt = `Generate 4 high-quality quiz questions (2 multiple choice, 1 true/false, 1 fill-in-the-blank) based on these mind map concepts:
${conceptsSummary}

Return JSON array:
[
  {
    "id": "q1",
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this is correct",
    "sourceNodeTitle": "Exact node title"
  }
]`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const parsed: GeneratedQuizQuestion[] = JSON.parse(json.candidates[0].content.parts[0].text);
      return { success: true, data: parsed };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Offline text parser for indented markdown/bullet lists
   */
  private extractStructuredTextFallback(text: string): GeneratedMapStructure | null {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return null;

    const mainTitle = lines[0].replace(/^[#*\-•\d.]+\s*/, '');
    const children: Array<{ title: string; description: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cleanLine = lines[i].replace(/^[#*\-•\d.]+\s*/, '');
      const parts = cleanLine.split(/[:–—]/);
      const title = parts[0].trim();
      const description = parts.length > 1 ? parts.slice(1).join(':').trim() : 'Key concept';
      if (title) {
        children.push({ title, description });
      }
    }

    return {
      title: mainTitle,
      root: {
        title: mainTitle,
        description: 'Knowledge topic extracted from structured notes',
        children:
          children.length > 0
            ? children
            : [
                { title: 'Subtopic 1', description: 'Overview' },
                { title: 'Subtopic 2', description: 'Key components' },
              ],
      },
    };
  }
}

export const aiClient = new AIClient();

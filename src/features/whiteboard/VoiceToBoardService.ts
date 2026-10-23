import { BoardShape, ShapeType } from './types';
import { aiClient } from '@/services/ai/aiClient';

export interface VoiceParsingResult {
  title: string;
  content: string;
  type: ShapeType;
  color?: string;
  borderColor?: string;
  textColor?: string;
  answer?: string;
}

/**
 * Service to process speech input into structured whiteboard knowledge shapes
 */
export class VoiceToBoardService {
  /**
   * Intelligently structure transcript into a whiteboard shape.
   * If AI is configured, uses Gemini to analyze intent (e.g. "Create a question about X", "Sticky note about Y", "Formula for Z").
   * If offline or no key, uses heuristic NLP patterns in Arabic and English.
   */
  static async parseVoiceToShape(transcript: string): Promise<VoiceParsingResult> {
    const cleanText = transcript.trim();
    if (!cleanText) {
      return {
        title: 'ملاحظة صوتية',
        content: 'لم يتم التقاط أي نص صوتي...',
        type: 'sticky',
      };
    }

    // Try AI parsing if key is available
    if (aiClient.isConfigured()) {
      try {
        const prompt = `You are an intelligent knowledge assistant for a visual whiteboard.
The user spoke this text in Arabic or English:
"${cleanText}"

Convert this voice input into the most appropriate whiteboard card or shape:
Available shape types:
- "sticky" (for quick ideas, tips, reminders)
- "concept-box" (for core definitions, explanations, theories)
- "qa-card" (if the user asked a question or spoke a quiz/recall question; include the expected answer or explanation in the answer field)
- "callout" (for warnings, special observations, caveats)
- "step-card" (if describing a step or sequence of actions)
- "formula" (if describing a formula, math rule, or code law)
- "diamond" (if stating a condition, decision, or check)
- "circle" (for a central key theme)

Return ONLY a valid JSON object matching this schema:
{
  "title": "Short concise title (2-5 words)",
  "content": "Well-formatted body text of what was spoken",
  "type": "sticky" | "concept-box" | "qa-card" | "callout" | "step-card" | "formula" | "diamond" | "circle",
  "answer": "Answer text ONLY if type is qa-card, otherwise omit"
}`;

        const responseText = await aiClient.generateText(prompt);
        const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return {
          title: parsed.title || 'فكرة صوتية',
          content: parsed.content || cleanText,
          type: (parsed.type as ShapeType) || 'concept-box',
          answer: parsed.answer,
        };
      } catch (e) {
        console.warn('AI voice parsing fallback to heuristic:', e);
      }
    }

    // Heuristic Offline Parser (Arabic + English)
    return this.heuristicParse(cleanText);
  }

  private static heuristicParse(text: string): VoiceParsingResult {
    const lower = text.toLowerCase();

    // Check Question / Q&A
    if (
      text.includes('؟') ||
      text.includes('?') ||
      lower.startsWith('لماذا') ||
      lower.startsWith('كيف') ||
      lower.startsWith('ما هو') ||
      lower.startsWith('ما هي') ||
      lower.startsWith('هل') ||
      lower.startsWith('why') ||
      lower.startsWith('how') ||
      lower.startsWith('what is')
    ) {
      const parts = text.split(/[؟?]/);
      const question = parts[0] + '؟';
      const possibleAnswer = parts.length > 1 && parts[1].trim() ? parts.slice(1).join(' ').trim() : 'سؤال استرجاع نشط لاختبار الفهم الذاتي.';

      return {
        title: 'سؤال واختبار فهم',
        content: question,
        answer: possibleAnswer,
        type: 'qa-card',
        color: '#ecfdf5',
        borderColor: '#10b981',
        textColor: '#064e3b',
      };
    }

    // Check Steps / Procedure
    if (
      text.includes('خطوة') ||
      text.includes('أولاً') ||
      text.includes('المرحلة') ||
      lower.includes('step') ||
      lower.includes('first')
    ) {
      return {
        title: 'خطوة إجرائية',
        content: text,
        type: 'step-card',
        color: '#ffffff',
        borderColor: '#cbd5e1',
        textColor: '#0f172a',
      };
    }

    // Check Formula / Rule
    if (
      text.includes('قانون') ||
      text.includes('معادلة') ||
      text.includes('يساوي') ||
      text.includes('=') ||
      lower.includes('formula') ||
      lower.includes('equation')
    ) {
      return {
        title: 'قانون / معادلة',
        content: text,
        type: 'formula',
        color: '#0f172a',
        borderColor: '#f59e0b',
        textColor: '#fef3c7',
      };
    }

    // Check Caution / Callout
    if (
      text.includes('انتبه') ||
      text.includes('ملاحظة مهمة') ||
      text.includes('تحذير') ||
      lower.includes('warning') ||
      lower.includes('note')
    ) {
      return {
        title: 'تنبيه وملاحظة دقيقة',
        content: text,
        type: 'callout',
        color: '#f5f3ff',
        borderColor: '#8b5cf6',
        textColor: '#4c1d95',
      };
    }

    // Check Sticky
    if (text.length < 70) {
      return {
        title: 'خاطرة سريعة',
        content: text,
        type: 'sticky',
        color: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#78350f',
      };
    }

    // Default: Concept Box
    return {
      title: text.slice(0, 32).trim() + '...',
      content: text,
      type: 'concept-box',
      color: '#0f172a',
      borderColor: '#3b82f6',
      textColor: '#f8fafc',
    };
  }
}

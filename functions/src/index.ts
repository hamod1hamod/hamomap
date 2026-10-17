import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface TextToMapRequest {
  topicOrText: string;
  depth?: 'compact' | 'standard' | 'comprehensive';
  targetStyle?: string;
}

export const generateMindMapFromText = functions.https.onCall(async (data: TextToMapRequest, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to use AI Mind Map generation.'
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'AI Provider API Key (GEMINI_API_KEY) is not configured in server environment. Please configure it in Cloud Functions environment or Firebase Secret Manager.'
    );
  }

  const prompt = `You are MindForge AI, an expert knowledge architect. Convert the following text or topic into a structured mind map hierarchy.
Topic/Text: "${data.topicOrText}"
Detail level: ${data.depth || 'standard'}

Return ONLY valid JSON matching this schema:
{
  "title": "Main Topic Title",
  "root": {
    "title": "Central Concept",
    "description": "Clear core definition",
    "notes": "Key context",
    "children": [
      {
        "title": "Subtopic 1",
        "description": "Summary of subtopic",
        "category": "core",
        "difficulty": "medium",
        "tags": ["tag1"],
        "children": []
      }
    ]
  }
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Provider HTTP error: ${response.status} - ${errText}`);
    }

    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No generated content received from AI provider');
    }

    const parsed = JSON.parse(candidateText);
    return { success: true, map: parsed };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'AI generation failed');
  }
});

export const explainNodeTopic = functions.https.onCall(async (data: { nodeTitle: string; nodeDescription?: string; level?: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'GEMINI_API_KEY is not configured on the server.');
  }

  const prompt = `Provide a comprehensive learning explanation for the concept: "${data.nodeTitle}".
Context: "${data.nodeDescription || ''}"
Learner level: "${data.level || 'intermediate'}"

Return JSON:
{
  "simpleExplanation": "ELIF5 simple explanation",
  "detailedExplanation": "In-depth formal conceptual explanation",
  "realWorldExample": "Concrete practical application or case study",
  "analogy": "Memorable intuitive analogy",
  "prerequisites": ["concept A", "concept B"],
  "commonMisconceptions": ["misconception 1", "misconception 2"],
  "practicalApplications": ["use case 1", "use case 2"],
  "relatedConcepts": ["related 1", "related 2"]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const resJson = await response.json();
    const parsed = JSON.parse(resJson.candidates[0].content.parts[0].text);
    return { success: true, explanation: parsed };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to explain node');
  }
});

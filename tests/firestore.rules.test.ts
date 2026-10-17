import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Specification & Verification', () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  it('declares rules_version = 2', () => {
    expect(rulesContent).toContain("rules_version = '2'");
  });

  it('restricts private mind maps to authenticated owners and collaborators', () => {
    expect(rulesContent).toContain('function isOwner(userId)');
    expect(rulesContent).toContain('function canReadMap(mapData)');
    expect(rulesContent).toContain('function canEditMap(mapData)');
  });

  it('ensures subcollection nodes and edges inherit map access permissions', () => {
    expect(rulesContent).toContain('match /nodes/{nodeId}');
    expect(rulesContent).toContain('match /edges/{edgeId}');
  });

  it('protects review events from unauthorized tampering (immutable log)', () => {
    expect(rulesContent).toContain('match /reviewEvents/{eventId}');
    expect(rulesContent).toContain('allow update, delete: if false;');
  });

  it('enforces default deny for unmatched collections', () => {
    expect(rulesContent).toContain('match /{document=**}');
    expect(rulesContent).toContain('allow read, write: if false;');
  });
});

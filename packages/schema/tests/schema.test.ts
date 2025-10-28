import { describe, expect, it } from 'vitest';
import { LessonRecordDetailSchema } from '../src/index.js';

describe('LessonRecordDetailSchema', () => {
  it('validates minimal payload', () => {
    const result = LessonRecordDetailSchema.parse({
      id: '5f6d3d34-2ae1-420c-90c9-7a2f1c02f1a0',
      lessonRecordId: 'f496593f-6ff8-4cf5-8a93-b1fb53f4dd5c',
      studentMappingId: 'e04ff84f-8bfc-4d4e-a55b-828534c90388',
      resortId: 12
    });

    expect(result.shareVisibility).toBe('private');
    expect(result.studentTypes).toHaveLength(0);
  });

  it('rejects invalid enum value', () => {
    expect(() =>
      LessonRecordDetailSchema.parse({
        id: '5f6d3d34-2ae1-420c-90c9-7a2f1c02f1a0',
        lessonRecordId: 'f496593f-6ff8-4cf5-8a93-b1fb53f4dd5c',
        studentMappingId: 'e04ff84f-8bfc-4d4e-a55b-828534c90388',
        resortId: 12,
        shareVisibility: 'unknown'
      })
    ).toThrow();
  });
});

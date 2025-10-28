import { z } from 'zod';

export const ShareVisibilityEnum = z.enum(['private', 'resort', 'all']);
export const StudentPersonaEnum = z.enum(['doer', 'thinker', 'watcher']);

export const LessonRecordDetailSchema = z.object({
  id: z.string().uuid(),
  lessonRecordId: z.string().uuid(),
  studentMappingId: z.string().uuid(),
  resortId: z.number().int().positive(),
  shareVisibility: ShareVisibilityEnum.default('private'),
  studentTypes: z.array(StudentPersonaEnum).default([]),
  sharedAt: z.string().datetime().nullable().optional().default(null),
  sharedBy: z.string().uuid().nullable().optional().default(null)
});

export type LessonRecordDetail = z.infer<typeof LessonRecordDetailSchema>;

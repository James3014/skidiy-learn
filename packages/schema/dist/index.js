// src/index.ts
import { z } from "zod";
var ShareVisibilityEnum = z.enum(["private", "resort", "all"]);
var StudentPersonaEnum = z.enum(["doer", "thinker", "watcher"]);
var LessonRecordDetailSchema = z.object({
  id: z.string().uuid(),
  lessonRecordId: z.string().uuid(),
  studentMappingId: z.string().uuid(),
  resortId: z.number().int().positive(),
  shareVisibility: ShareVisibilityEnum.default("private"),
  studentTypes: z.array(StudentPersonaEnum).default([]),
  sharedAt: z.string().datetime().nullable().optional().default(null),
  sharedBy: z.string().uuid().nullable().optional().default(null)
});
export {
  LessonRecordDetailSchema,
  ShareVisibilityEnum,
  StudentPersonaEnum
};

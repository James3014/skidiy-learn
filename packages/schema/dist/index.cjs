"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  LessonRecordDetailSchema: () => LessonRecordDetailSchema,
  ShareVisibilityEnum: () => ShareVisibilityEnum,
  StudentPersonaEnum: () => StudentPersonaEnum
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
var ShareVisibilityEnum = import_zod.z.enum(["private", "resort", "all"]);
var StudentPersonaEnum = import_zod.z.enum(["doer", "thinker", "watcher"]);
var LessonRecordDetailSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  lessonRecordId: import_zod.z.string().uuid(),
  studentMappingId: import_zod.z.string().uuid(),
  resortId: import_zod.z.number().int().positive(),
  shareVisibility: ShareVisibilityEnum.default("private"),
  studentTypes: import_zod.z.array(StudentPersonaEnum).default([]),
  sharedAt: import_zod.z.string().datetime().nullable().optional().default(null),
  sharedBy: import_zod.z.string().uuid().nullable().optional().default(null)
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LessonRecordDetailSchema,
  ShareVisibilityEnum,
  StudentPersonaEnum
});

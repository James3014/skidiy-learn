-- Generated via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`

-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('snowboard', 'ski');

-- CreateEnum
CREATE TYPE "RecordShareVisibility" AS ENUM ('private', 'resort', 'all');

-- CreateEnum
CREATE TYPE "StudentPersona" AS ENUM ('doer', 'thinker', 'watcher');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('parent', 'guardian', 'relative');

-- CreateEnum
CREATE TYPE "SeatIdentityStatus" AS ENUM ('draft', 'submitted', 'confirmed');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('pending', 'invited', 'claimed', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "CoachProficiencyBand" AS ENUM ('knew', 'familiar', 'excellent');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "canViewSharedRecords" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resort" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" SERIAL NOT NULL,
    "resortId" INTEGER NOT NULL,
    "instructorId" TEXT NOT NULL,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalStudent" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMapping" (
    "id" TEXT NOT NULL,
    "globalStudentId" TEXT NOT NULL,
    "resortId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianRelationship" (
    "id" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" "GuardianType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSeat" (
    "id" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "claimedMappingId" TEXT,
    "status" "SeatStatus" NOT NULL DEFAULT 'pending',
    "claimedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatInvitation" (
    "code" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "claimedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatInvitation_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "SeatIdentityForm" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "status" "SeatIdentityStatus" NOT NULL DEFAULT 'draft',
    "preferredName" TEXT,
    "studentPersona" "StudentPersona"[],
    "equipmentNotes" TEXT,
    "injuryHistory" TEXT,
    "medicalNotes" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "guardianEmail" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatIdentityForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonRecord" (
    "id" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "coachNotes" TEXT,
    "resortNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonRecordDetail" (
    "id" TEXT NOT NULL,
    "lessonRecordId" TEXT NOT NULL,
    "studentMappingId" TEXT NOT NULL,
    "shareVisibility" "RecordShareVisibility" NOT NULL DEFAULT 'private',
    "studentTypes" TEXT[],
    "summary" TEXT,
    "sharedBy" TEXT,
    "sharedAt" TIMESTAMP(3),
    "resortId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonRecordDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDetailAnalysis" (
    "id" TEXT NOT NULL,
    "lessonRecordDetailId" TEXT NOT NULL,
    "analysisGroupId" INTEGER NOT NULL,
    "analysisItemId" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonDetailAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDetailPractice" (
    "id" TEXT NOT NULL,
    "lessonRecordDetailId" TEXT NOT NULL,
    "skillId" INTEGER,
    "drillId" INTEGER,
    "displayOrder" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonDetailPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sportType" "SportType" NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisItem" (
    "id" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "sportType" "SportType" NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "sportType" "SportType" NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeDrill" (
    "id" INTEGER NOT NULL,
    "skillId" INTEGER,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "sportType" "SportType" NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "PracticeDrill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityCatalog" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sportType" "SportType" NOT NULL,
    "skillLevel" INTEGER NOT NULL,
    "sequenceInLevel" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAbilityRating" (
    "id" TEXT NOT NULL,
    "lessonRecordDetailId" TEXT NOT NULL,
    "abilityId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "proficiencyBand" "CoachProficiencyBand" NOT NULL,
    "comment" TEXT,
    "sourceRatingId" TEXT,
    "ratedBy" TEXT NOT NULL,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CoachAbilityRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSelfEvaluation" (
    "id" TEXT NOT NULL,
    "studentMappingId" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "selfRating" INTEGER NOT NULL,
    "selfComment" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSelfEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyIdMapping" (
    "id" TEXT NOT NULL,
    "legacyType" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "newEntityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyIdMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "scope" TEXT,
    "filters" JSONB,
    "count" INTEGER,
    "reason" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "processedCount" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonRecordDetail_shareVisibility_resortId_idx" ON "LessonRecordDetail"("shareVisibility", "resortId");

-- CreateIndex
CREATE INDEX "LessonRecordDetail_studentTypes_idx" ON "LessonRecordDetail" USING GIN ("studentTypes");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDetailAnalysis_lessonRecordDetailId_displayOrder_key" ON "LessonDetailAnalysis"("lessonRecordDetailId", "displayOrder");

-- CreateIndex
CREATE INDEX "LessonDetailAnalysis_analysisItemId_idx" ON "LessonDetailAnalysis"("analysisItemId");

-- CreateIndex
CREATE INDEX "LessonDetailAnalysis_analysisGroupId_idx" ON "LessonDetailAnalysis"("analysisGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDetailPractice_lessonRecordDetailId_displayOrder_key" ON "LessonDetailPractice"("lessonRecordDetailId", "displayOrder");

-- CreateIndex
CREATE INDEX "LessonDetailPractice_skillId_idx" ON "LessonDetailPractice"("skillId");

-- CreateIndex
CREATE INDEX "LessonDetailPractice_drillId_idx" ON "LessonDetailPractice"("drillId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonRecord_lessonId_key" ON "LessonRecord"("lessonId");

-- CreateIndex
CREATE INDEX "Lesson_recordLessonId_idx" ON "LessonRecord"("lessonId");

-- CreateIndex
CREATE INDEX "Lesson_studentMappingId_idx" ON "LessonRecordDetail"("studentMappingId");

-- CreateIndex
CREATE INDEX "AbilityCatalog_sportType_skillLevel_sequenceInLevel_idx" ON "AbilityCatalog"("sportType", "skillLevel", "sequenceInLevel");

-- CreateIndex
CREATE INDEX "CoachAbilityRating_lessonRecordDetailId_abilityId_idx" ON "CoachAbilityRating"("lessonRecordDetailId", "abilityId");

-- CreateIndex
CREATE INDEX "CoachAbilityRating_sourceRatingId_idx" ON "CoachAbilityRating"("sourceRatingId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSelfEvaluation_studentMappingId_lessonId_key" ON "StudentSelfEvaluation"("studentMappingId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatIdentityForm_seatId_key" ON "SeatIdentityForm"("seatId");

-- CreateIndex
CREATE INDEX "SeatInvitation_expiresAt_idx" ON "SeatInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonRecord_lessonId_unique" ON "LessonRecord"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDetailAnalysis_displayOrder_unique" ON "LessonDetailAnalysis"("displayOrder");

-- CreateIndex
CREATE INDEX "LessonDetailAnalysis_lessonRecord_idx" ON "LessonDetailAnalysis"("lessonRecordDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDetailPractice_displayOrder_unique" ON "LessonDetailPractice"("displayOrder");

-- CreateIndex
CREATE INDEX "LessonDetailPractice_lessonRecordDetailId_idx" ON "LessonDetailPractice"("lessonRecordDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatInvitation_code_key" ON "SeatInvitation"("code");

-- CreateIndex
CREATE INDEX "SeatInvitation_claimedBy_idx" ON "SeatInvitation"("claimedBy");

-- CreateIndex
CREATE INDEX "LessonRecordDetail_studentTypes_idx1" ON "LessonRecordDetail" USING GIN ("studentTypes");

-- CreateIndex
CREATE INDEX "LessonRecordDetail_resortId_idx" ON "LessonRecordDetail"("resortId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisGroup_name_sportType_key" ON "AnalysisGroup"("name", "sportType");

-- CreateIndex
CREATE INDEX "AnalysisItem_groupId_idx" ON "AnalysisItem"("groupId");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_resortId_fkey" FOREIGN KEY ("resortId") REFERENCES "Resort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMapping" ADD CONSTRAINT "StudentMapping_globalStudentId_fkey" FOREIGN KEY ("globalStudentId") REFERENCES "GlobalStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMapping" ADD CONSTRAINT "StudentMapping_resortId_fkey" FOREIGN KEY ("resortId") REFERENCES "Resort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "GlobalStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSeat" ADD CONSTRAINT "OrderSeat_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSeat" ADD CONSTRAINT "OrderSeat_claimedMappingId_fkey" FOREIGN KEY ("claimedMappingId") REFERENCES "StudentMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatInvitation" ADD CONSTRAINT "SeatInvitation_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OrderSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatInvitation" ADD CONSTRAINT "SeatInvitation_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "StudentMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatIdentityForm" ADD CONSTRAINT "SeatIdentityForm_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OrderSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecord" ADD CONSTRAINT "LessonRecord_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecordDetail" ADD CONSTRAINT "LessonRecordDetail_lessonRecordId_fkey" FOREIGN KEY ("lessonRecordId") REFERENCES "LessonRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecordDetail" ADD CONSTRAINT "LessonRecordDetail_studentMappingId_fkey" FOREIGN KEY ("studentMappingId") REFERENCES "StudentMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecordDetail" ADD CONSTRAINT "LessonRecordDetail_resortId_fkey" FOREIGN KEY ("resortId") REFERENCES "Resort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecordDetail" ADD CONSTRAINT "LessonRecordDetail_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailAnalysis" ADD CONSTRAINT "LessonDetailAnalysis_lessonRecordDetailId_fkey" FOREIGN KEY ("lessonRecordDetailId") REFERENCES "LessonRecordDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailAnalysis" ADD CONSTRAINT "LessonDetailAnalysis_analysisGroupId_fkey" FOREIGN KEY ("analysisGroupId") REFERENCES "AnalysisGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailAnalysis" ADD CONSTRAINT "LessonDetailAnalysis_analysisItemId_fkey" FOREIGN KEY ("analysisItemId") REFERENCES "AnalysisItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailPractice" ADD CONSTRAINT "LessonDetailPractice_lessonRecordDetailId_fkey" FOREIGN KEY ("lessonRecordDetailId") REFERENCES "LessonRecordDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailPractice" ADD CONSTRAINT "LessonDetailPractice_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDetailPractice" ADD CONSTRAINT "LessonDetailPractice_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "PracticeDrill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAbilityRating" ADD CONSTRAINT "CoachAbilityRating_lessonRecordDetailId_fkey" FOREIGN KEY ("lessonRecordDetailId") REFERENCES "LessonRecordDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAbilityRating" ADD CONSTRAINT "CoachAbilityRating_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "AbilityCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAbilityRating" ADD CONSTRAINT "CoachAbilityRating_sourceRatingId_fkey" FOREIGN KEY ("sourceRatingId") REFERENCES "CoachAbilityRating"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAbilityRating" ADD CONSTRAINT "CoachAbilityRating_ratedBy_fkey" FOREIGN KEY ("ratedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSelfEvaluation" ADD CONSTRAINT "StudentSelfEvaluation_studentMappingId_fkey" FOREIGN KEY ("studentMappingId") REFERENCES "StudentMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSelfEvaluation" ADD CONSTRAINT "StudentSelfEvaluation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


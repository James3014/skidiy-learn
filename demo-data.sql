-- ===================================================================
-- DIY Ski 評量系統 - 測試資料 (三種狀態)
-- ===================================================================
--
-- 此腳本創建以下三種測試情境:
-- 1. Lesson #101: 未記錄未評量 - 席位已認領,學生已自評,但教練還沒建立記錄
-- 2. Lesson #102: 已記錄未評量 - 有教學記錄和分析/練習,但沒有能力評分
-- 3. Lesson #103: 都完成 - 完整的教學記錄 + 分析 + 練習 + 8項能力評分
--
-- 使用方式:
-- docker exec -i diyski-postgres-1 psql -U diyski -d diyski < demo-data.sql
-- ===================================================================

BEGIN;

-- 1. 創建測試帳號和教練
INSERT INTO "Account" (id, role, status, "mfaEnabled", "createdAt", "updatedAt")
VALUES ('demo-instructor-1', 'instructor', 'active', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Instructor" (id, "accountId", "canViewSharedRecords", "createdAt", "updatedAt")
VALUES ('demo-instructor-1-profile', 'demo-instructor-1', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 創建或更新雪場
INSERT INTO "Resort" (id, name, location, "createdAt", "updatedAt")
VALUES (1, '白馬雪場', '長野縣', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = '白馬雪場', location = '長野縣';

-- 3. 創建學生
INSERT INTO "GlobalStudent" (id, email, phone, "createdAt")
VALUES
  ('student-demo-1', 'student1@demo.com', '0912345678', NOW()),
  ('student-demo-2', 'student2@demo.com', '0923456789', NOW()),
  ('student-demo-3', 'student3@demo.com', '0934567890', NOW())
ON CONFLICT (id) DO NOTHING;

-- 創建學生映射
INSERT INTO "StudentMapping" (id, "globalStudentId", "resortId", "createdAt")
VALUES
  ('mapping-demo-1', 'student-demo-1', 1, NOW()),
  ('mapping-demo-2', 'student-demo-2', 1, NOW()),
  ('mapping-demo-3', 'student-demo-3', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 情境 1: 未記錄未評量 (Lesson #101)
-- =====================================================
INSERT INTO "Lesson" (id, "resortId", "instructorId", "lessonDate", "createdAt", "updatedAt")
VALUES (101, 1, 'demo-instructor-1-profile', '2025-01-15 09:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "lessonDate" = '2025-01-15 09:00:00+00';

-- 創建席位 - 已認領
INSERT INTO "OrderSeat" (id, "lessonId", "seatNumber", status, "claimedMappingId", "claimedAt", version, "createdAt", "updatedAt")
VALUES ('seat-101-1', 101, 1, 'claimed', 'mapping-demo-1', '2025-01-10 10:00:00+00', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 創建學生自評
INSERT INTO "StudentSelfEvaluation" (id, "lessonId", "studentMappingId", "selfRating", "selfComment", "createdAt", "updatedAt")
VALUES ('self-eval-101-1', 101, 'mapping-demo-1', 3, '我覺得我在轉彎的時候還不太穩定,希望教練能多指導。', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 情境 2: 已記錄未評量 (Lesson #102)
-- =====================================================
INSERT INTO "Lesson" (id, "resortId", "instructorId", "lessonDate", "createdAt", "updatedAt")
VALUES (102, 1, 'demo-instructor-1-profile', '2025-01-16 09:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "lessonDate" = '2025-01-16 09:00:00+00';

INSERT INTO "OrderSeat" (id, "lessonId", "seatNumber", status, "claimedMappingId", "claimedAt", version, "createdAt", "updatedAt")
VALUES ('seat-102-1', 102, 1, 'claimed', 'mapping-demo-2', '2025-01-12 10:00:00+00', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 創建教學記錄 - 但沒有評分
INSERT INTO "LessonRecord" (id, "lessonId", summary, "createdAt", "updatedAt")
VALUES ('record-102', 102, '今天主要練習了基本的轉彎技巧。學員表現積極,但還需要更多練習。', NOW(), NOW())
ON CONFLICT ("lessonId") DO UPDATE SET summary = '今天主要練習了基本的轉彎技巧。學員表現積極,但還需要更多練習。';

INSERT INTO "LessonRecordDetail" (id, "lessonRecordId", "studentMappingId", "resortId", "shareVisibility", "createdAt", "updatedAt")
VALUES ('record-detail-102-1', 'record-102', 'mapping-demo-2', 1, 'private', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 添加分析項目 (假設有分析項目存在)
INSERT INTO "RecordAnalysis" (id, "lessonRecordDetailId", "analysisItemId", "customAnalysis", "createdAt", "updatedAt")
SELECT 'analysis-102-1-1', 'record-detail-102-1', id, '需要加強重心轉移', NOW(), NOW()
FROM "AnalysisItem" LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 添加練習項目 (假設有練習項目存在)
INSERT INTO "RecordPractice" (id, "lessonRecordDetailId", "drillId", "practiceNotes", "createdAt", "updatedAt")
SELECT 'practice-102-1-1', 'record-detail-102-1', id, '重複練習20次,進步明顯', NOW(), NOW()
FROM "PracticeDrill" LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 情境 3: 都完成 (Lesson #103)
-- =====================================================
INSERT INTO "Lesson" (id, "resortId", "instructorId", "lessonDate", "createdAt", "updatedAt")
VALUES (103, 1, 'demo-instructor-1-profile', '2025-01-17 09:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "lessonDate" = '2025-01-17 09:00:00+00';

INSERT INTO "OrderSeat" (id, "lessonId", "seatNumber", status, "claimedMappingId", "claimedAt", version, "createdAt", "updatedAt")
VALUES ('seat-103-1', 103, 1, 'claimed', 'mapping-demo-3', '2025-01-14 10:00:00+00', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 創建完整的教學記錄
INSERT INTO "LessonRecord" (id, "lessonId", summary, "createdAt", "updatedAt")
VALUES ('record-103', 103, '優秀的表現！學員掌握了所有基本技巧,可以開始進階課程。', NOW(), NOW())
ON CONFLICT ("lessonId") DO UPDATE SET summary = '優秀的表現！學員掌握了所有基本技巧,可以開始進階課程。';

INSERT INTO "LessonRecordDetail" (id, "lessonRecordId", "studentMappingId", "resortId", "shareVisibility", "createdAt", "updatedAt")
VALUES ('record-detail-103-1', 'record-103', 'mapping-demo-3', 1, 'resort', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 添加分析和練習
INSERT INTO "RecordAnalysis" (id, "lessonRecordDetailId", "analysisItemId", "createdAt", "updatedAt")
SELECT 'analysis-103-1-' || ROW_NUMBER() OVER (), 'record-detail-103-1', id, NOW(), NOW()
FROM "AnalysisItem" LIMIT 2
ON CONFLICT (id) DO NOTHING;

INSERT INTO "RecordPractice" (id, "lessonRecordDetailId", "drillId", "practiceNotes", "createdAt", "updatedAt")
SELECT 'practice-103-1-1', 'record-detail-103-1', id, '完美執行,可以進入下一階段', NOW(), NOW()
FROM "PracticeDrill" LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 創建能力評分 (8項)
WITH abilities AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "skillLevel", "sequenceInLevel") as rn
  FROM "AbilityCatalog"
  WHERE "sportType" = 'ski'
  LIMIT 8
)
INSERT INTO "CoachAbilityRating" (id, "lessonRecordDetailId", "coachAccountId", "abilityId", rating, "proficiencyBand", comment, "createdAt", "updatedAt")
SELECT
  'rating-103-1-' || rn,
  'record-detail-103-1',
  'demo-instructor-1',
  id,
  CASE
    WHEN rn % 3 = 1 THEN 1
    WHEN rn % 3 = 2 THEN 2
    ELSE 3
  END,
  CASE
    WHEN rn % 3 = 1 THEN 'knew'::\"CoachProficiencyBand\"
    WHEN rn % 3 = 2 THEN 'familiar'::\"CoachProficiencyBand\"
    ELSE 'excellent'::\"CoachProficiencyBand\"
  END,
  CASE
    WHEN rn = 1 THEN '表現優異,掌握良好'
    WHEN rn = 4 THEN '需要更多練習'
    ELSE NULL
  END,
  NOW(),
  NOW()
FROM abilities
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ===================================================================
-- 完成！
-- ===================================================================
-- 現在您可以使用帳號 "demo-instructor-1" 登入系統查看:
-- - Lesson #101: 未記錄未評量 (有席位和自評,但無教學記錄)
-- - Lesson #102: 已記錄未評量 (有教學記錄,但無能力評分)
-- - Lesson #103: 都完成 (完整記錄 + 8項能力評分)
-- ===================================================================

SELECT
  '✅ Demo data created successfully!' as message,
  'Login with account: demo-instructor-1' as login_info;

SELECT
  '📊 Test Scenarios:' as summary;

SELECT
  '  - Lesson #101: 未記錄未評量' as scenario_1,
  '  - Lesson #102: 已記錄未評量' as scenario_2,
  '  - Lesson #103: 都完成' as scenario_3;

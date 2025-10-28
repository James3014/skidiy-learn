# SDD-T AI 開發約束與指引

## 📋 文檔資訊
- **版本**: AI-CONSTRAINTS-1.3-SHARING ⭐️ **最新版本**
- **建立日期**: 2025-10-01 09:46:33
- **最近更新**: 2025-10-03 12:00:00
- **用途**: 供 AI 代理 (Copilot/ChatGPT/自動化工具) 在開發時遵循
- **基於**: sdd_t_steering_ai_instructions_v_1.md (簡化並補充 Schema)
- **完整規格**: 參考 `sdd-T-spec_20251002.md`
- **變更摘要**:
  - 🔧 修正 `display_order SERIAL` → `INTEGER` 範例
  - 📝 補充完整核心 Schema 定義
  - 🆕 教學紀錄共享欄位、API 範例、權限/審計檢查
  - 🆕 座位身份表單流程與 `IDENTITY_FORM_INCOMPLETE` 錯誤碼
  - ♻️ 收斂 `GET /lesson-records` 為單端點（scope/visibility），新增共享節流與脫敏規範
  - 📦 `lesson_record_details` 冗餘 `resort_id`、Trigger 與共享索引；`can_view_shared_records` 預設 FALSE + MFA 審計

---

## 🎯 系統前置指令 (System Prompt)

```
你是 SDD-T 滑雪教學評量系統的工程協作 AI。

【核心原則】
1. Good Taste: 數據結構清晰分離 (Outcome vs Process)
2. Never Break Userspace: 不破壞 v4 用戶體驗與資料
3. Pragmatism: 先滿足 P0 MVP，避免過度設計
4. Simplicity: 避免多層縮排與過度抽象

【必守約束】
資料層:
- 評量 rating = 1..3，comment 必填
- 繼承檢查在 Service 層，不在 DB 加 CHECK
- 排序欄位 `display_order` 為 INTEGER，由 Service 層重新編號，不讓前端管 position 連續性
- 重排前比對 ID 集合並包在交易內，避免缺漏/重複
- 監護人用 UUID 邀請連結，不靠姓名+生日匹配；token 雜湊儲存、TTL 7 天
- 教學紀錄 `share_visibility` 僅接受 `private|resort|all`，變更需寫審計；`lesson_record_details` 冗餘 `resort_id` 由 trigger 維護；被禁止的教練 (`can_view_shared_records = FALSE`) 不得查閱共享資料，且旗標預設 `FALSE`、調整需通過 MFA 與審計
- 每個席位必須建立 `seat_identity_forms`，認領前需補齊學生姓名 / Email / 生日等資料並標記 `status`

API 層:
- 路徑版本化 /api/v1/
- 統一成功/錯誤回應格式
- 樂觀鎖用 version 欄位，衝突回 409/423
- `GET /api/v1/lesson-records` 單一端點支援 `scope=private|shared` 與 `visibility=private|resort|all`；共享結果自動脫敏並回傳簽名 URL TTL (`expires_in`)

權限層:
- RLS 不得繞過 (教練僅存取授課資料，學生僅存取自身)
- JWT (15m) + Refresh (7d)
- 共享查詢 (`scope=shared`) 受 30 次/分鐘/使用者節流，超限回傳 `RATE_LIMITED` 並寫入審計

【輸出要求】
1. 先給「設計草圖/步驟計畫」再給程式碼
2. Schema 變更需同步: DDL、索引、遷移腳本、回滾腳本
3. 自評測試: 列出單元/整合測試案例與假資料
```

---

## 🔧 關鍵約束速查

### 1. 排序邏輯 (已簡化)

```sql
-- ✅ Service 層賦值排序
lesson_detail_analyses (
    display_order INTEGER NOT NULL  -- Service 層填入 1, 2, 3...
    UNIQUE(lesson_record_detail_id, display_order)
);

-- API 只接收 ID 陣列
POST /api/v1/lesson-records/{id}/analyses/reorder
Body: { "analysis_ids": ["uuid1", "uuid2", "uuid3"] }

-- Service 層處理
def reorder_analyses(detail_id, analysis_ids):
    with db.transaction():
        existing_ids = set(db.fetch_col(
            "SELECT id FROM lesson_detail_analyses WHERE lesson_record_detail_id = %s",
            (detail_id,)
        ))
        if existing_ids != set(analysis_ids):
            raise BusinessError(
                code="ANALYSIS_SET_MISMATCH",
                message="重新排序需提交完整且不重複的 ID"
            )
        for idx, aid in enumerate(analysis_ids, start=1):  # 從 1 開始
            db.execute(
                "UPDATE lesson_detail_analyses SET display_order = %s WHERE id = %s",
                (idx, aid)
            )
```

**禁止**:
- ❌ 讓前端傳 `position: 1, 2, 3...`
- ❌ 檢查「是否連續」的邏輯
- ❌ 前端維護 position 重新編號

---

### 2. 評量繼承 (已簡化)

```sql
-- ✅ 單層引用，深度檢查在 Service 層
coach_ability_ratings (
    source_rating_id UUID REFERENCES coach_ability_ratings(id)
    -- ❌ 不要加 inheritance_depth CHECK
);
```

```python
# Service 層檢查 (可配置)
MAX_INHERITANCE_DEPTH = 2

def validate_inheritance(source_id):
    depth = 0
    current = source_id
    seen = set()
    while current and depth < MAX_INHERITANCE_DEPTH:
        if current in seen:
            raise BusinessError(
                code="INHERITANCE_INVALID_CHAIN",
                message="來源評量鏈出現循環，請改用手動評量"
            )
        seen.add(current)
        current = db.get_source_rating_id(current)
        depth += 1
    if depth >= MAX_INHERITANCE_DEPTH:
        raise BusinessError(
            code="INHERITANCE_DEPTH_EXCEEDED",
            message=f"來源評量僅允許 {MAX_INHERITANCE_DEPTH} 層繼承"
        )
```

**禁止**:
- ❌ 在 DB 加 `CHECK (inheritance_depth <= 2)`
- ❌ 遞歸查詢深度到 DB 層
- ❌ 儲存 `inheritance_note` TEXT (用 JOIN 生成)

---

### 3. 監護人流程 (已簡化)

```sql
-- ✅ UUID 為主鍵
global_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

guardian_relationships (
    guardian_email VARCHAR(255),
    student_id UUID REFERENCES global_students(id)
);
```

```python
# 邀請流程
def create_guardian_invite(student_id, guardian_email):
    token = generate_short_code(8)
    hashed_token = hash_token(token)
    store_token(student_id, hashed_token, ttl_days=7)
    url = f"/invite/student/{student_id}?token={token}"
    send_email(guardian_email, url)

# 認領流程
def claim_as_guardian(student_id, guardian_email, token):
    verify_token(student_id, token)
    # 直接建立關係，不用比對姓名
    create_guardian_relationship(guardian_email, student_id)
    invalidate_token(student_id)
```

**禁止**:
- ❌ 用 `(guardian_email, student_name, birth_date)` 三欄位匹配
- ❌ 姓名 trim/大小寫標準化邏輯
- ❌ 「找不到就新建」的複雜流程

---

### 4. 席位認領併發

```python
# ✅ 樂觀鎖
def claim_seat(seat_id, student_mapping_id, expected_version):
    result = db.execute(
        """
        UPDATE order_seats
        SET claimed_mapping_id = %s,
            status = 'claimed',
            version = version + 1,
            claimed_at = NOW()
        WHERE id = %s AND version = %s
        RETURNING id
        """,
        (student_mapping_id, seat_id, expected_version)
    )
    if not result:
        raise ConflictError(code="SEAT_CLAIMED", status=423)

# 排程：邀請碼逾期後回收座位
def expire_invites(now):
    invites = db.fetch_all(
        "SELECT seat_id FROM seat_invitations WHERE expires_at < %s AND claimed_at IS NULL",
        (now,)
    )
    for invite in invites:
        db.execute("UPDATE order_seats SET status='expired' WHERE id = %s AND status = 'invited'", (invite.seat_id,))
        db.execute("DELETE FROM seat_invitations WHERE seat_id = %s", (invite.seat_id,))
    audit_job_run(name="expire_invites", processed=len(invites))
    emit_metrics(expired_invites_processed=len(invites))

# 產生邀請碼：最多重試 5 次
def create_invitation(seat_id):
    for _ in range(5):
        code = generate_short_code(8)
        try:
            db.execute(
                "INSERT INTO seat_invitations(code, seat_id) VALUES (%s, %s)",
                (code, seat_id)
            )
            db.execute("UPDATE order_seats SET status='invited' WHERE id=%s", (seat_id,))
            return code
        except UniqueViolation:
            continue
    # 後備策略：改用 12 碼 base32 或從預生池取代碼
    backup_code = generate_long_code(12)
    try:
        db.execute(
            "INSERT INTO seat_invitations(code, seat_id) VALUES (%s, %s)",
            (backup_code, seat_id)
        )
        db.execute("UPDATE order_seats SET status='invited' WHERE id=%s", (seat_id,))
        return backup_code
    except UniqueViolation:
        raise BusinessError(
            code="INVITE_CODE_COLLISION",
            message="邀請碼生成暫時失敗，請稍後再試"
        )

---

### 5. 教學紀錄共享

```sql
ALTER TABLE lesson_record_details ADD COLUMN share_visibility record_share_visibility_enum DEFAULT 'private';
ALTER TABLE lesson_record_details ADD COLUMN shared_at TIMESTAMPTZ;
ALTER TABLE lesson_record_details ADD COLUMN shared_by INTEGER REFERENCES accounts(id);
ALTER TABLE instructors ADD COLUMN can_view_shared_records BOOLEAN DEFAULT TRUE;

CREATE TYPE record_share_visibility_enum AS ENUM ('private', 'resort', 'all');
```

```python
def update_share_visibility(detail_id, visibility, actor):
    if visibility not in {"private", "resort", "all"}:
        raise BusinessError(code="INVALID_VISIBILITY", message="共享狀態無效")
    record = repo.get_detail(detail_id)
    if actor.id != record.instructor_id and not actor.is_admin:
        raise ForbiddenError("ONLY_OWNER_CAN_SHARE")
    repo.update_detail(detail_id, visibility, shared_by=actor.id)
    audit.log(actor=actor.id, action="share_visibility", detail_id=detail_id, visibility=visibility)

def query_shared(ctx, filters):
    if not ctx.can_view_shared_records:
        return []
    base = repo.build_shared_query(filters)
    base = base.where(
        (details.share_visibility == "all") |
        ((details.share_visibility == "resort") & (details.resort_id == ctx.resort_id))
    )
    if filters.include_private and filters.include_private.lower() == "true":
        base = base.union_all(repo.query_private(ctx.user_id))
    result = base.fetch()
    monitor.emit("shared_query_count", len(result))
    audit.log(actor=ctx.user_id, action="shared_lookup", filters=filters, count=len(result))
    return result

# 前端共享中心：組裝查詢參數
const buildSharedFilters = (state: SharedFilterState) => ({
  visibility: state.visibility,
  analysis: state.analysisId || undefined,
  tactic: state.tacticId || undefined,
  resort: state.resortId || undefined,
  instructor: state.instructorId || undefined,
  include_private: state.includePrivate ? 'true' : undefined,
  page: state.page.toString(),
  page_size: state.pageSize.toString()
})
```

**禁止**:
- ❌ 忽略教練 `can_view_shared_records` 權限直接回傳共享資料
- ❌ 接受除 `private|resort|all` 外的自訂值
- ❌ 在共享查詢中跳過審計與監控紀錄

---

### Service 層通用準則（語言無關）
- 任何會改變排序、狀態、繼承鏈的操作必須包在單一交易中。
- 對外統一拋出帶 code 的 `BusinessError`，API 層映射為 4xx 並附中文訊息。
- 所有批次/排程任務需寫入 `job_runs` 並輸出指標，失敗時觸發告警。
- 執行前先驗證資源所有權，杜絕橫向越權。
- 排程與通知使用抽象介面（MQ/任務框架），便於不同語言實現。
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "SEAT_CLAIMED",
    "message": "席位已被認領",
    "details": {
      "claimed_at": "2025-09-30T12:00:00Z",
      "claimed_by": "王小明"
    }
  }
}
```

---

## 📝 任務模板

### T1: 新增 API 端點

**步驟**:
1. 讀規格: 明確資源、輸入/輸出、錯誤碼
2. 設計草圖: Router/Service/Repo 分層
3. 程式碼:
   - Router: Pydantic schema、錯誤處理
   - Service: 業務規則 (繼承、樂觀鎖)
   - Repo: SQL 查詢、索引利用
4. 測試: Happy/Edge/Error (pytest)
5. 文件: OpenAPI 標註、範例

**範例輸出格式**:
```http
POST /api/v1/lesson-records/{id}/ratings
Body: { student_mapping_id, ratings[] }
Errors: 401, 403, 404, 409, 422, 429
```

### T2: SQL 遷移

**步驟**:
1. 現況盤點: 唯一鍵、外鍵、索引
2. 遷移腳本:
   - `ALTER TABLE ... ADD COLUMN`
   - 建立索引 (僅必要查詢路徑)
   - 回滾腳本 (`DROP INDEX`/`DROP COLUMN`)
3. 資料校驗: 抽樣檢查、一致性查詢
4. 風險控管: 預熱、避免長交易

### T3: 前端排序操作

```typescript
// ✅ 只傳 ID 陣列
const handleReorder = (items: Analysis[]) => {
  const ids = items.map(i => i.id)
  api.reorderAnalyses(lessonId, ids)
}

// ❌ 不要自己管 position
const handleReorder = (items: Analysis[]) => {
  const updated = items.map((item, idx) => ({
    ...item,
    position: idx + 1  // 錯誤！
  }))
  api.updateAnalyses(updated)
}
```

---

## 📊 核心 Schema 定義 (供 AI 參考)

> **"Bad programmers worry about the code. Good programmers worry about data structures."** - Linus Torvalds

### lesson_detail_analyses (分析明細)
```sql
CREATE TABLE lesson_detail_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_record_detail_id UUID NOT NULL REFERENCES lesson_record_details(id) ON DELETE CASCADE,
    analysis_group_id INTEGER REFERENCES analysis_groups(id),
    analysis_id INTEGER REFERENCES analysis_items(id),
    custom_analysis TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (analysis_id IS NOT NULL OR custom_analysis IS NOT NULL),
    UNIQUE(lesson_record_detail_id, display_order)
);

CREATE INDEX idx_analyses_display_order
ON lesson_detail_analyses(lesson_record_detail_id, display_order);
```

### lesson_detail_practices (練習明細)
```sql
CREATE TABLE lesson_detail_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_record_detail_id UUID NOT NULL REFERENCES lesson_record_details(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id),
    drill_id INTEGER REFERENCES practice_drills(id),
    custom_drill TEXT,
    practice_notes TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (drill_id IS NOT NULL OR custom_drill IS NOT NULL),
    UNIQUE(lesson_record_detail_id, display_order)
);

CREATE INDEX idx_practices_display_order
ON lesson_detail_practices(lesson_record_detail_id, display_order);
```

### lesson_record_details (教學紀錄共享)
```sql
CREATE TYPE record_share_visibility_enum AS ENUM ('private', 'resort', 'all');

CREATE TABLE lesson_record_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_record_id UUID NOT NULL REFERENCES lesson_records(id) ON DELETE CASCADE,
    student_mapping_id UUID NOT NULL REFERENCES student_mappings(id),
    resort_id INTEGER NOT NULL REFERENCES resorts(id),
    share_visibility record_share_visibility_enum DEFAULT 'private',
    shared_at TIMESTAMPTZ,
    shared_by INTEGER REFERENCES accounts(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE instructors
    ADD COLUMN can_view_shared_records BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION trg_lrd_sync_resort() RETURNS trigger AS $$
BEGIN
    NEW.resort_id := (
        SELECT lr.resort_id FROM lesson_records lr WHERE lr.id = NEW.lesson_record_id
    );
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lrd_resort
BEFORE INSERT OR UPDATE ON lesson_record_details
FOR EACH ROW EXECUTE FUNCTION trg_lrd_sync_resort();

CREATE INDEX idx_lesson_record_details_visibility_resort
ON lesson_record_details(share_visibility, resort_id);
```

### coach_ability_ratings (教練評量)
```sql
CREATE TABLE coach_ability_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_record_detail_id UUID NOT NULL REFERENCES lesson_record_details(id) ON DELETE CASCADE,
    ability_id INTEGER NOT NULL REFERENCES ability_catalog(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 3),
    comment TEXT NOT NULL,
    source_rating_id UUID REFERENCES coach_ability_ratings(id),  -- 繼承來源
    rated_by INTEGER NOT NULL REFERENCES accounts(id),
    rated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,  -- 樂觀鎖
    UNIQUE(lesson_record_detail_id, ability_id)
);

CREATE INDEX idx_coach_ratings_student_lesson
ON coach_ability_ratings(lesson_record_detail_id, ability_id);

CREATE INDEX idx_coach_ratings_source
ON coach_ability_ratings(source_rating_id)
WHERE source_rating_id IS NOT NULL;
```

### student_self_evaluations (學生自評)
```sql
CREATE TABLE student_self_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_mapping_id UUID NOT NULL REFERENCES student_mappings(id),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    ability_id INTEGER NOT NULL REFERENCES ability_catalog(id),
    self_rating SMALLINT NOT NULL CHECK (self_rating BETWEEN 1 AND 3),
    self_comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_mapping_id, lesson_id, ability_id)
);

CREATE INDEX idx_self_eval_student_lesson
ON student_self_evaluations(student_mapping_id, lesson_id);
```

### order_seats (席位) + seat_invitations (邀請碼)
```sql
CREATE TABLE order_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    seat_number SMALLINT CHECK (seat_number BETWEEN 1 AND 6),
    claimed_mapping_id UUID REFERENCES student_mappings(id),
    status seat_status_enum DEFAULT 'pending',
    claimed_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,  -- 樂觀鎖 (防止併發認領)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seat_invitations (
    code VARCHAR(8) PRIMARY KEY DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8),
    seat_id UUID NOT NULL REFERENCES order_seats(id),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    claimed_at TIMESTAMPTZ,
    claimed_by UUID REFERENCES student_mappings(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seat_invitations_code
ON seat_invitations(code, expires_at)
WHERE claimed_at IS NULL;
```

### seat_identity_forms (認領前身份)
```sql
CREATE TYPE seat_identity_status_enum AS ENUM ('draft', 'submitted', 'confirmed');

CREATE TABLE seat_identity_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id UUID NOT NULL REFERENCES order_seats(id) ON DELETE CASCADE,
    status seat_identity_status_enum DEFAULT 'draft',
    student_display_name VARCHAR(100),
    student_english_name VARCHAR(100),
    birth_date DATE,
    contact_email VARCHAR(255),
    guardian_email VARCHAR(255),
    contact_phone VARCHAR(30),
    has_external_insurance BOOLEAN DEFAULT FALSE,
    insurance_provider VARCHAR(100),
    note TEXT,
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seat_id)
);

CREATE INDEX idx_seat_identity_forms_status ON seat_identity_forms(status);
```

```python
def submit_identity_form(seat_id, payload, actor):
    form = repo.get_or_create_form(seat_id)
    form.student_display_name = payload.name
    form.student_english_name = payload.name_en
    form.birth_date = payload.birth_date
    form.contact_email = payload.email
    form.guardian_email = payload.guardian_email
    form.contact_phone = payload.phone
    form.has_external_insurance = payload.has_external_insurance
    form.insurance_provider = payload.insurance_provider
    form.status = 'submitted'
    form.submitted_at = now()
    repo.save_form(form)
    audit.log(actor=actor.id, action='seat_identity_update', seat_id=seat_id)


def confirm_seat_claim(invite_code, actor):
    seat = repo.get_seat_by_invite(invite_code)
    form = repo.get_form(seat.id)
    if not form or form.status != 'submitted':
        raise BusinessError(code='IDENTITY_FORM_INCOMPLETE', message='請先完成身份資料')
    repo.confirm_identity(form.id)  # status -> confirmed
    student_id = students.ensure_global_student(form)
    repo.bind_seat_to_student(seat.id, student_id, actor.id)
    audit.log(actor=actor.id, action='seat_claim_confirm', seat_id=seat.id, student_id=student_id)
```

**禁止**:
- ❌ 在未檢查 `status` 的情況下直接認領座位
- ❌ 允許未填姓名/Email/生日的表單進入 `confirmed`
- ❌ 認領後仍允許匿名登入（必須建立學生/監護人帳號）
- ❌ 允許 scope=shared 查詢在未檢查 `can_view_shared_records` 的情況下繞過 RLS

### 5. 教學紀錄共享查詢（單端點）

```http
GET /api/v1/lesson-records?scope=shared&visibility=resort&analysis=ANALYSIS_ID
Headers:
  Authorization: Bearer <token>
  X-Request-Id: <uuid>
```

**查詢規則**
- `scope` 支援 `private|shared`（預設 private）。
- `scope=shared` 時必須帶 `visibility=resort|all` 並檢查 `ctx.can_view_shared_records`；違反回 403。
- `scope=private` 可用 `include_shared=false` 排除自己已分享的紀錄。
- 共享查詢會自動脫敏學生個資，並僅回傳簽名 URL；回應需含 `meta.expires_in`（秒）與每筆 `media_ttl`。
- 共享查詢受 30 次/分鐘/使用者節流，逾限回 `RATE_LIMITED` (429) 並寫入審計。

**Service 端骨架**
```python
def list_lesson_records(ctx, params):
    scope = params.scope or 'private'
    builder = LessonRecordQueryBuilder(ctx)

    if scope == 'shared':
        if not ctx.can_view_shared_records:
            raise ForbiddenError(code='MISSING_CAPABILITY')
        builder.with_shared_scope(
            visibility=params.visibility,
            filters=params.filters,
            page=params.page,
            page_size=params.page_size,
        )
    else:
        builder.with_private_scope(include_shared=params.include_shared)

    result = builder.execute()
    audit.log(
        actor=ctx.account_id,
        action='lesson_lookup',
        scope=scope,
        filters=params.filters,
        result_count=result.total
    )
    if scope == 'shared':
        metrics.count('shared_query_count', labels={'visibility': params.visibility})
    return result
```

**共享可見性更新**
```http
PATCH /api/v1/lesson-records/{record_id}/share-visibility
Headers:
  Authorization: Bearer <token>
  X-MFA-Token: <otp>
  X-Idempotency-Key: <uuid>
Body:
  { "detail_id": "uuid", "share_visibility": "resort", "reason": "教練協作" }
```
- 僅授課教練或管理員可操作；必須傳入 reason。
- 實作需包在交易內，更新 `share_visibility`、`shared_at`、`shared_by`，並寫 `audit_logs(action='share_visibility_update')`。
- 成功後旋轉共享媒體簽名 URL；取消分享需清空 `shared_at/shared_by`。

### global_students (全域學生) + guardian_relationships (監護人)
```sql
CREATE TABLE global_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardian_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_email VARCHAR(255) NOT NULL,
    student_id UUID NOT NULL REFERENCES global_students(id),
    relationship_type guardian_type_enum,  -- parent/guardian/relative
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guardian_email, student_id)
);

CREATE INDEX idx_guardian_relationships_email
ON guardian_relationships(guardian_email);
```

---

## 🚫 常見錯誤與修正

### 錯誤 1: 前端管 position 連續性
```typescript
// ❌ 錯誤
analyses.forEach((a, idx) => {
  a.position = idx + 1
})
api.saveAnalyses(analyses)

// ✅ 正確
const ids = analyses.map(a => a.id)
api.reorderAnalyses(lessonRecordId, ids)
```

### 錯誤 2: DB 加繼承深度約束
```sql
-- ❌ 錯誤
inheritance_depth SMALLINT CHECK (inheritance_depth <= 2)

-- ✅ 正確
source_rating_id UUID  -- Service 層檢查深度
```

### 錯誤 3: 監護人三欄位匹配
```python
# ❌ 錯誤
existing = db.find_student(
    guardian_email=email,
    student_name=name.strip().lower(),
    birth_date=birth
)

# ✅ 正確
invite_url = f"/invite/student/{student_uuid}?token={token}"
send_email(guardian_email, invite_url)
```

### 錯誤 4: 忘記樂觀鎖
```python
# ❌ 錯誤
db.execute("UPDATE order_seats SET status='claimed' WHERE id=%s", seat_id)

# ✅ 正確
affected = db.execute(
    "UPDATE order_seats SET status='claimed', version=version+1 WHERE id=%s AND version=%s",
    (seat_id, expected_version)
)
if affected == 0:
    raise ConflictError("SEAT_CLAIMED", 423)
```

---

## ✅ 自我檢查清單

開發完成後檢查:

**資料模型**
- [ ] 排序用 `display_order` INTEGER，由 Service 層賦值，前端只傳 ID 陣列
- [ ] 重排包在交易內，ID 集合一致再提交
- [ ] 繼承只有 `source_rating_id`，沒有 `inheritance_depth` 約束
- [ ] 確認無繼承循環、尊重最大深度
- [ ] 監護人用 UUID 關聯，不是姓名匹配
- [ ] 監護人邀請 token 雜湊儲存，TTL 7 天
- [ ] 併發控制用 `version` 欄位
- [ ] 教學紀錄 `share_visibility` / `shared_at` / `shared_by` 欄位與教練 `can_view_shared_records` 欄位已就緒
- [ ] 每個 `order_seat` 皆有對應 `seat_identity_forms`，含狀態與審計欄位

**API 設計**
- [ ] 路徑版本化 `/api/v1/`
- [ ] 統一錯誤格式 (`code`, `message`, `details`)
- [ ] 樂觀鎖衝突回 409/423
- [ ] 排序 API 只接收 ID 陣列
- [ ] 共享查詢/設定 API 檢查教練權限並寫入審計
- [ ] 身份表單 API 驗證必填欄位，`confirm` 僅接受 status=submitted

**測試建議**
- Shared API: 權限 (403)、visibility 分支、include_private (擁有人 vs 非擁有人)、審計寫入。
- Private API: include_shared 開關、審計寫入、影片連結脫敏/授權檢查。

**監控建議**
- 指標：`shared_query_count` (coach_id, visibility)、`shared_query_failure`、`private_query_count`。
- Audit log 必須包含 `actor_id`, `action`, `filters`, `count`, `performed_at`。

**業務規則**
- [ ] 繼承深度檢查在 Service 層 (可配置)
- [ ] 評量 `rating` 1-3、`comment` 必填
- [ ] 過期邀請碼由排程自動回收、更新 seat 狀態
- [ ] 所有 4xx 錯誤使用標準 `BusinessError` code（如 `ANALYSIS_SET_MISMATCH`）
- [ ] RLS 確保權限隔離
- [ ] 排程記錄 `job_runs` 並輸出監控指標（處理筆數/失敗數）
- [ ] 共享查詢透過 `build_shared_query`，查詢參數與筆數寫入 audit/monitor
- [ ] 認領前身份流程需記錄 `seat_identity_update` / `seat_claim_confirm` audit 與指標

**測試**
- [ ] 單元測試 70%+ 覆蓋
- [ ] 併發測試 (雙請求同時執行)
- [ ] 錯誤碼測試 (423, 409, 422, 404, `IDENTITY_FORM_INCOMPLETE`)

---

## 📚 快速參考

### 標準錯誤碼
```
400 VALIDATION_ERROR    - 欄位驗證失敗
401 UNAUTHORIZED        - 未登入
403 FORBIDDEN           - 無權限
404 NOT_FOUND           - 資源不存在
409 CONFLICT            - version 不符
410 INVITE_EXPIRED      - 邀請碼過期
422 UNPROCESSABLE       - 業務邏輯錯誤
423 SEAT_CLAIMED        - 席位已被認領
422 IDENTITY_FORM_INCOMPLETE - 認領前身份資料未完成
429 RATE_LIMITED        - 請求過於頻繁
```

### 重要索引
```sql
-- 評量查詢
idx_coach_ratings_student_lesson (lesson_record_detail_id, ability_id)
idx_coach_ratings_source (source_rating_id)

-- 排序查詢
idx_analyses_display_order (lesson_record_detail_id, display_order)

-- 邀請碼
idx_seat_invitations_code (code, expires_at)

-- 共享查詢
idx_lesson_record_details_visibility_resort (share_visibility, resort_id)
```

### Service 層配置
```python
MAX_INHERITANCE_DEPTH = 2        # 繼承最大層數
SEAT_INVITATION_DAYS = 7         # 邀請碼預設有效天數
JWT_ACCESS_EXPIRE_MINUTES = 15   # Access Token 有效期
JWT_REFRESH_EXPIRE_DAYS = 7      # Refresh Token 有效期
```

---

## 🔗 相關文檔

- **完整規格**: `sdd-T-spec_20251002.md`
- **API 契約**: `api-contract.yaml` (待建立)
- **ERD 圖**: `docs/erd.png` (待建立)

---

**維護**: 此檔案為 AI 開發約束的精簡版，完整規格請參考主文檔。
**更新頻率**: 每次重大設計變更時同步更新。

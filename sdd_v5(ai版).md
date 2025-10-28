# 滑雪學生評量系統 SDD v5 (集成語音評量)

## 0. 版本資訊與設計原則

**版本**: v5.0 with Voice Evaluation
**狀態**: 增強版本 - 集成AI語音評量
**設計哲學**: 基於 Linus Torvalds 實用主義原則 + 教練工作流優化

### 設計原則
- **好品味 (Good Taste)**: 消除特殊情況，統一數據流，語音評量與手動評量無差異
- **實用主義**: 解決教練真實痛點 - 多課程、多學生的評量記憶負擔
- **簡潔執念**: 語音錄製→AI解析→快速確認，最小化認知負荷
- **向後兼容**: 保護現有CSV數據投資，支援傳統手動評量方式

### v5.0 核心創新
- **智能語音評量**: 支援課後語音錄製，AI自動解析為結構化評量
- **暱稱映射系統**: 解決"上課叫小名，評量填正名"的身份識別問題
- **智能詞彙轉譯**: AI自動將教練口語轉換為標準化能力項目
- **異步處理架構**: 佇列機制確保語音處理可靠性和系統性能
- **漸進式增強**: 傳統手動評量依然可用，語音評量作為高級功能

---

## 1. 系統概述

### 1.1 產品目標
建立簡潔高效的滑雪學生評量系統，重點支援：
- **教練**: 語音錄製課後評量，AI自動解析，大幅減少輸入時間
- **教練**: 參考學生自評和上次評量，快速完成評量確認
- **學生**: 可選課前自評，查看跨雪場評量歷史
- **管理**: 多雪場統計分析與課程優化

### 1.2 v5核心創新功能

#### 1.2.1 智能語音評量系統
- **結構化語音錄製**: 按課程教學內容分項錄音評量
- **AI雙重解析**: Whisper語音轉文字 + GPT-4結構化解析
- **置信度評估**: AI自動評估解析準確性，低置信度提醒人工確認
- **異步處理**: 佇列機制處理，30-45秒完成解析，不阻塞使用者操作

#### 1.2.2 暱稱映射與身份識別
- **暱稱收集**: 席位認領時收集學生上課常用暱稱
- **智能匹配**: 語音中的"小明"自動匹配"王小明"
- **模糊搜尋**: 支援部分姓名匹配和常見暱稱變體

#### 1.2.3 漸進式評量輔助
- **上次評量參考**: 顯示學生上次課程評量結果，支援一鍵繼承
- **學生自評對比**: 展示學生課前自評，教練可參考調整
- **評量模板**: 預設常用評量模板，快速套用

### 1.3 傳承功能 (來自v4)
- **席位認領機制**: 6位邀請碼 + 姓名確認，簡單防錯
- **評量繼承**: 新課程可參考上次教練評量，加速填寫
- **跨雪場統一**: 學生可查看不同雪場、不同教練的評量記錄
- **3星評量體系**: knew(⭐) → familiar(⭐⭐) → excellent(⭐⭐⭐)

### 1.4 非目標 (MVP不做)
- 即時語音識別和即時評量生成
- 離線語音處理能力
- 與訂課平台的即時資料同步

---

## 2. 使用者情境

### 2.1 傳統評量流程 (保持不變)
```
1. 席位認領流程 (同v4)
2. 手動評量流程 (同v4)
3. 學生進度查看 (同v4)
```

### 2.2 新增：語音評量流程

#### 2.2.1 課前準備（簡化版）
```
學生席位確認:
- 認領時填寫暱稱 "上課時叫我小明"
- 系統建立 "王小明 ↔ 小明" 映射關係
- 無需課前設定教學計劃，根據實際教學狀況彈性調整
```

#### 2.2.2 課後語音評量
```
1. 語音錄製 (教練端):
   - 選擇"語音評量"功能
   - 系統顯示本次課程學生名單（含暱稱映射）
   - 教練自由錄音描述教學內容和學生表現
   - 支援整體錄音: "今天教了裝備、推板、直滑三項，小明裝備做得很好給三星..."

2. AI智能解析:
   - 音頻上傳到處理佇列
   - Whisper API 語音轉文字
   - GPT-4智能識別:
     * 從教練口語自動推斷教授了哪些標準化能力
     * 將"裝備"轉譯為"熟悉裝備"，"推板"轉譯為"單腳平坡滑動"
     * 解析各學生各能力的評分和評語
   - 系統顯示處理進度 "解析中... 預計30秒"

3. 結果確認:
   - AI解析完成後推送通知
   - 顯示結構化評量結果供確認
   - 特別標示低置信度項目需要人工確認
   - 教練可快速修正錯誤或遺漏
   - 確認後自動寫入評量資料庫

4. 失敗與降級處理:
   - 任務3分鐘未完成或進入failed狀態時推送提醒
   - 教練可選擇重新上傳錄音或切換至手動評量表單
   - 系統保留暫存轉錄以利手動補填，確認後自動清除暫存檔
   - 失敗原因記錄於工作佇列供技術團隊追蹤
```

語音任務每次都會同步建立重試票據；若多次失敗，系統會自動顯示手動評量入口並帶入暫存轉錄方便補填，確保評量流程不中斷。

#### 2.2.3 語音評量示例

**教練錄音內容（口語化）**:
> "今天教了穿板子、推板、還有直滑三項。穿板子小明做得很好給三星，能獨立穿脫，小華兩星還需要練習脫板。推板小明兩星還可以，小華也是兩星，兩個人差不多。直滑小明一星剛開始比較緊張，小華兩星比較穩定。"

**AI智能轉譯與解析**:
```json
{
  "vocabulary_translation": {
    "穿板子": {"standard_ability": "熟悉裝備", "confidence": 0.98},
    "推板": {"standard_ability": "單腳平坡滑動", "confidence": 0.95},
    "直滑": {"standard_ability": "緩坡單腳直滑", "confidence": 0.96}
  },
  "evaluations": [
    {
      "ability": "熟悉裝備",
      "spoken_term": "穿板子",
      "students": [
        {"name": "小明", "matched_id": 123, "rating": 3, "comment": "做得很好，能獨立穿脫"},
        {"name": "小華", "matched_id": 124, "rating": 2, "comment": "還需要練習脫板"}
      ]
    },
    {
      "ability": "單腳平坡滑動",
      "spoken_term": "推板",
      "students": [
        {"name": "小明", "matched_id": 123, "rating": 2, "comment": "還可以"},
        {"name": "小華", "matched_id": 124, "rating": 2, "comment": "差不多"}
      ]
    }
  ],
  "overall_confidence": 0.94,
  "low_confidence_items": [] // 無需人工確認項目
}
```

#### 2.2.4 教練詞彙智能轉譯機制

為解決教練不熟悉標準化60項能力名稱的問題，系統提供以下解決方案：

**1. 常見口語轉譯字典**:
```yaml
裝備相關:
  - "穿板子/脫板子/裝備/綁板" → "熟悉裝備"

滑行動作:
  - "煞車/停下來/剎車" → "單腳直滑轉彎煞車"
  - "直線滑/直滑" → "緩坡單腳直滑"
  - "推板/滑動" → "單腳平坡滑動"

纜車相關:
  - "坐纜車/上纜車/纜車" → "上下纜車"

轉彎技巧:
  - "C轉" → "背面轉彎成正面" 或 "正面轉彎成背面"
  - "S轉" → "順暢連結兩種C turn轉彎完成S turn"
  - "落葉飄" → "落葉飄，轉動雪板改變方向並控制速度"
```

**2. 上下文智能推斷**:
- AI根據上下文自動判斷具體能力
- 例如："轉彎"配合學生等級自動選擇適當的轉彎能力
- 置信度評估，低於85%的轉譯會要求人工確認

**3. 詞彙優先順序與分層**:
- 匹配順序: 教練個人詞彙 > 雪場專屬詞彙 > 系統通用字典
- 不同語系優先採用對應 `language_code`，找不到時回退至 `zh-TW`
- `priority_scope` 可微調特定詞彙權重（例如新方案先行測試）
- 匹配結果與來源層級會在確認介面標示，方便教練建立信任

### 2.3 評量等級定義 (沿用v4)
```
星等對應能力掌握度:
⭐   (1星) = knew      = 基礎會，初步了解該技能
⭐⭐ (2星) = familiar  = 熟練掌握，能穩定執行
⭐⭐⭐(3星) = excellent = 優秀表現，技巧純熟

評量必填項目:
- 星等評分 (1-3星，每個能力項目必選)
- 教練評語 (TEXT，必填欄位，可從語音自動提取)
- 教練身份 (instructor_id，追蹤評量來源)
```

---

## 3. 資料庫設計

### 3.1 核心資料表 (沿用v4基礎)

```sql
-- 基礎表格保持不變: resorts, users, user_roles, lessons, order_seats, abilities, evaluations, audit_logs
```

### 3.2 新增：語音評量相關表格

```sql
-- 學生暱稱映射表
CREATE TABLE student_nicknames (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) NOT NULL,
    lesson_id INTEGER REFERENCES lessons(id),
    formal_name VARCHAR(100) NOT NULL, -- 正式姓名
    preferred_name VARCHAR(50) NOT NULL, -- 上課暱稱
    instructor_confirmed BOOLEAN DEFAULT false,
    usage_frequency INTEGER DEFAULT 1, -- 使用頻次，用於智能匹配
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lesson_id, preferred_name) -- 同課程暱稱不重複
);

-- 索引需於表建立後單獨建立 (PostgreSQL 標準語法)
CREATE INDEX idx_student_nicknames ON student_nicknames(student_id, preferred_name);

-- 教練個人詞彙學習表 (智能轉譯核心)
CREATE TABLE instructor_vocabulary_learning (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER REFERENCES users(id) NOT NULL,
    spoken_term VARCHAR(100) NOT NULL, -- 教練說的詞彙 "穿板子"
    standard_ability_id INTEGER REFERENCES abilities(id) NOT NULL, -- 對應標準能力
    confidence DECIMAL(3,2), -- AI匹配信心度
    human_confirmed BOOLEAN DEFAULT false, -- 教練確認正確
    usage_frequency INTEGER DEFAULT 1, -- 使用次數
    context_info JSONB, -- 使用上下文資訊
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(instructor_id, spoken_term, standard_ability_id)
);

CREATE INDEX idx_instructor_terms ON instructor_vocabulary_learning(instructor_id, spoken_term);
CREATE INDEX idx_confirmed_terms ON instructor_vocabulary_learning(instructor_id, human_confirmed);

-- 通用詞彙轉譯字典 (系統預設)
CREATE TABLE vocabulary_translation_dictionary (
    id SERIAL PRIMARY KEY,
    spoken_term VARCHAR(100) NOT NULL, -- 口語詞彙
    standard_ability_id INTEGER REFERENCES abilities(id) NOT NULL,
    translation_type vocabulary_type_enum DEFAULT 'common',
    confidence DECIMAL(3,2) DEFAULT 0.90, -- 預設信心度
    usage_contexts TEXT[], -- 適用情境 ["初學者", "進階者"]
    alternative_terms TEXT[], -- 替代說法
    language_code VARCHAR(10) DEFAULT 'zh-TW', -- 語系
    resort_id INTEGER REFERENCES resorts(id), -- 特定雪場用語
    priority_scope SMALLINT DEFAULT 0, -- 口語優先層級 (越大越優先)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spoken_terms ON vocabulary_translation_dictionary(spoken_term);
CREATE INDEX idx_ability_mapping ON vocabulary_translation_dictionary(standard_ability_id);
CREATE INDEX idx_vocab_language ON vocabulary_translation_dictionary(language_code);
CREATE INDEX idx_vocab_resort ON vocabulary_translation_dictionary(resort_id);

-- 語音處理任務佇列
CREATE TABLE voice_processing_jobs (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) NOT NULL,
    instructor_id INTEGER REFERENCES users(id) NOT NULL,

    -- 音頻檔案資訊
    audio_file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER,
    duration_seconds INTEGER,

    -- 處理狀態
    status voice_job_status_enum DEFAULT 'pending',
    current_step VARCHAR(100), -- 當前處理步驟描述
    progress_percentage INTEGER DEFAULT 0,

    -- AI處理結果
    transcription TEXT, -- Whisper轉錄結果
    parsed_evaluations JSONB, -- GPT-4解析結果
    confidence_scores JSONB, -- 各項置信度分數
    ai_processing_time_ms INTEGER, -- AI處理耗時

    -- 錯誤處理
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- 人工確認
    human_reviewed BOOLEAN DEFAULT false,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    final_confirmed BOOLEAN DEFAULT false,

    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_status_created ON voice_processing_jobs(status, created_at);
CREATE INDEX idx_instructor_lesson ON voice_processing_jobs(instructor_id, lesson_id);

-- 語音評量生成記錄 (用於審計)
CREATE TABLE voice_generated_evaluations (
    id SERIAL PRIMARY KEY,
    voice_job_id INTEGER REFERENCES voice_processing_jobs(id) NOT NULL,
    evaluation_id INTEGER REFERENCES evaluations(id) NOT NULL,
    ai_confidence DECIMAL(3,2), -- AI對此條評量的置信度
    human_modified BOOLEAN DEFAULT false, -- 是否被人工修改過
    original_ai_rating INTEGER, -- AI原始評分
    original_ai_comment TEXT, -- AI原始評語
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 評量模板系統
CREATE TABLE evaluation_templates (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER REFERENCES users(id) NOT NULL,
    template_name VARCHAR(100) NOT NULL, -- "Level 1 初學者", "進步顯著", "需要加強"
    template_type template_type_enum DEFAULT 'instructor_custom',

    -- 模板內容
    default_ratings JSONB, -- 預設評分 {"ability_1": 2, "ability_2": 3}
    comment_templates JSONB, -- 評語模板 {"ability_1": "表現不錯", "general": "繼續加油"}
    applicable_levels INTEGER[], -- 適用級別 [1, 2]

    usage_count INTEGER DEFAULT 0, -- 使用次數統計
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_instructor ON evaluation_templates(instructor_id, is_active);
```

### 3.3 新增枚舉定義

```sql
CREATE TYPE voice_job_status_enum AS ENUM (
    'pending',      -- 等待處理
    'processing',   -- 處理中
    'completed',    -- 處理完成
    'failed',       -- 處理失敗
    'retrying'      -- 重試中
);

CREATE TYPE template_type_enum AS ENUM (
    'system_default',    -- 系統預設
    'instructor_custom', -- 教練自定義
    'resort_standard'    -- 雪場標準
);

CREATE TYPE vocabulary_type_enum AS ENUM (
    'common',           -- 通用口語詞彙
    'regional',         -- 地區性用語
    'instructor_habit', -- 教練個人習慣
    'technical'         -- 技術術語
);
```

### 3.4 原有evaluations表擴展

```sql
-- 為現有evaluations表添加語音評量相關欄位
ALTER TABLE evaluations ADD COLUMN voice_job_id INTEGER REFERENCES voice_processing_jobs(id);
ALTER TABLE evaluations ADD COLUMN generated_by_ai BOOLEAN DEFAULT false;
ALTER TABLE evaluations ADD COLUMN ai_confidence DECIMAL(3,2);
ALTER TABLE evaluations ADD COLUMN template_id INTEGER REFERENCES evaluation_templates(id);
ALTER TABLE evaluations ADD COLUMN human_reviewed_at TIMESTAMPTZ;

-- 新增索引
CREATE INDEX idx_evaluations_voice_job ON evaluations(voice_job_id);
CREATE INDEX idx_evaluations_ai_generated ON evaluations(generated_by_ai, ai_confidence);
```

---

## 4. API設計

### 4.1 傳統API (保持v4設計)
```javascript
// 認證與授權、席位認領、手動評量、學生進度等API保持不變
```

### 4.2 新增：語音評量API

#### 4.2.1 暱稱管理API
```javascript
// 添加學生暱稱
POST /api/students/nicknames
Body: {
    lesson_id: number,
    student_id: number,
    preferred_name: string, // "小明"
    context?: string // 可選：使用情境
}

// 獲取課程學生暱稱映射
GET /api/lessons/{lesson_id}/student-nicknames
Response: {
    mappings: [
        {student_id: 123, formal_name: "王小明", preferred_name: "小明", confirmed: true},
        {student_id: 124, formal_name: "李小華", preferred_name: "小華", confirmed: false}
    ]
}
```

#### 4.2.2 語音評量處理API
```javascript
// 1. 上傳語音檔案開始處理
POST /api/voice-evaluations/upload
Content-Type: multipart/form-data
Body: {
    lesson_id: number,
    audio_file: File,
    processing_priority?: 'normal' | 'high', // 處理優先級
    expected_abilities?: number[] // 可選：預期評量的能力ID
}

Response: {
    job_id: string,
    estimated_processing_time: "30-45 seconds",
    queue_position: 2, // 佇列位置
    status_polling_url: "/api/voice-evaluations/jobs/{job_id}/status"
}

// 2. 查詢處理狀態 (支援輪詢)
GET /api/voice-evaluations/jobs/{job_id}/status
Response: {
    job_id: string,
    status: "pending" | "processing" | "completed" | "failed",
    progress_percentage: 75,
    current_step: "解析學生評分中...",
    estimated_remaining_seconds: 15,
    error_message?: string,
    retry_available?: boolean
}

// 3. 獲取處理結果
GET /api/voice-evaluations/jobs/{job_id}/results
Response: {
    job_id: string,
    transcription: "今天教了三個能力...", // 完整轉錄文字
    processing_summary: {
        total_abilities_detected: 3,
        total_students_detected: 2,
        overall_confidence: 0.94,
        low_confidence_items: [] // 需要人工確認的項目
    },
    suggested_evaluations: [
        {
            student_id: 123,
            student_name: "王小明",
            matched_nickname: "小明",
            name_confidence: 0.98,
            evaluations: [
                {
                    ability_id: 1,
                    ability_name: "熟悉裝備",
                    suggested_rating: 3,
                    rating_confidence: 0.92,
                    extracted_comment: "做得很好，能獨立穿脫",
                    comment_confidence: 0.89,
                    needs_review: false
                }
            ]
        }
    ],
    unmatched_mentions: [], // 無法匹配的學生姓名
    missing_students: [], // 未提及的學生
    processing_metadata: {
        whisper_processing_time: "8.3s",
        gpt_processing_time: "12.7s",
        total_processing_time: "23.1s"
    }
}

// 4. 確認並保存評量
POST /api/voice-evaluations/jobs/{job_id}/confirm
Body: {
    confirmed_evaluations: [
        {
            student_id: 123,
            ability_id: 1,
            final_rating: 3, // 教練確認後的評分
            final_comment: "做得很好，能獨立穿脫", // 教練確認後的評語
            was_modified: false // 是否修改了AI建議
        }
    ],
    general_feedback?: string, // 教練對AI處理結果的反饋
    processing_quality_rating?: number // 1-5分，用於改進AI
}

Response: {
    evaluations_created: number,
    evaluations_updated: number,
    processing_complete: true,
    redirect_url: "/coach/lessons/{lesson_id}/evaluations"
}
```

---

## 5. 前端界面設計

### 5.1 增強的教練評量頁面

```html
📱 課後評量 - Level 1 初級班
┌─────────────────────────────┐
│ 👥 學生名單 (暱稱映射)       │
│ • 王小明(小明) • 李小華(小華) │
│                            │
│ 📝 評量方式選擇:             │
│ ┌─────────────────────────┐ │
│ │ 🎙️ 語音快速評量 (推薦)   │ │
│ │ 錄音3分鐘，AI自動解析    │ │
│ │ [開始錄音]              │ │
│ └─────────────────────────┘ │
│                            │
│ ┌─────────────────────────┐ │
│ │ ✏️ 傳統手動評量          │ │
│ │ 逐項填寫，精確控制      │ │
│ │ [手動評量]              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 5.2 語音錄製界面（簡化版）

```html
📱 課後語音評量
┌─────────────────────────────┐
│ 👥 本次課程學生:             │
│ • 王小明(小明) • 李小華(小華) │
│ • 張小李(小李)              │
│                            │
│ 🎙️ [錄音中...] 1:23 / 5:00  │
│ ┌─────────────────────────┐ │
│ │     🔴 REC              │ │
│ │   [■ 停止錄音]           │ │
│ └─────────────────────────┘ │
│                            │
│ 💡 錄音建議:                │
│ "自然描述今天教了什麼，      │
│  各學生的表現如何"          │
│                            │
│ 📝 範例:                   │
│ "今天教了穿板子和推板，      │
│  小明穿板子很好三星..."     │
│                            │
│ 🤖 AI會自動:                │
│ • 識別教學內容              │
│ • 轉譯口語為標準能力        │
│ • 解析學生評分              │
│                            │
│ 🔄 [重新錄音] ✅ [確認上傳] │
└─────────────────────────────┘
```

### 5.3 AI處理進度界面

```html
📱 AI處理中...
┌─────────────────────────────┐
│ 🤖 正在分析您的語音評量      │
│                            │
│ ████████░░ 75%             │
│                            │
│ 📝 當前步驟:                │
│ "解析學生評分中..."         │
│                            │
│ ⏱️ 預計剩餘: 15秒           │
│                            │
│ ✅ 語音轉文字完成            │
│ ✅ 識別教學內容完成          │
│ 🔄 解析學生評分中...        │
│ ⏳ 生成評量記錄等待中...     │
│                            │
│ ❌ 若超時/失敗: 推播提醒      │
│    並提供重試或手動評量      │
│                            │
│ [📱 可以離開此頁面，完成後通知] │
│ [↩ 切換手動評量] [🔄 重新上傳] │
└─────────────────────────────┘
```

### 5.4 AI解析結果確認界面（含智能轉譯）

```html
📱 AI解析結果確認
┌─────────────────────────────┐
│ 🤖 詞彙轉譯結果:             │
│ ✅ "穿板子" → 熟悉裝備 (98%) │
│ ✅ "推板" → 單腳平坡滑動(95%)│
│ ⚠️ "練轉彎" → ? (需確認)     │
│                            │
│ 📋 請選擇"練轉彎"對應能力:    │
│ ○ 八字左右轉連接            │
│ ○ 背面轉彎成正面            │
│ ○ 順暢連結兩種C turn        │
│ ○ 其他: ____________       │
│                            │
│ [💡 記住我的習慣] [✅ 確認]  │
└─────────────────────────────┘

📱 學生評量結果確認
┌─────────────────────────────┐
│ 🎯 熟悉裝備 (信心度: 98%)    │
│ 📝 教練說: "穿板子"          │
│ ┌─────────────────────────┐ │
│ │👤 小明 → 王小明 ✓        │ │
│ │  ⭐⭐⭐ "做得很好，能獨立穿脫"│ │
│ │  自評: ⭐⭐ → 調整為 ⭐⭐⭐ │ │
│ │                        │ │
│ │👤 小華 → 李小華 ✓        │ │
│ │  ⭐⭐ "還需要練習脫板"    │ │
│ │  自評: ⭐ → 保持 ⭐⭐     │ │
│ └─────────────────────────┘ │
│                            │
│ 🎯 單腳平坡滑動 (信心度: 95%)│
│ 📝 教練說: "推板"           │
│ [展開詳情...]              │
│                            │
│ ⚠️ 需要確認:               │
│ • 小李未在錄音中提及        │
│ • "練轉彎"詞彙待確認        │
│                            │
│ [✏️ 手動調整] [✅ 確認保存] │
└─────────────────────────────┘
```

### 5.5 教練詞彙助手界面

```html
📱 詞彙轉譯助手
┌─────────────────────────────┐
│ 💡 您的常用教學詞彙:         │
│                            │
│ 📚 已學習詞彙 (15項):       │
│ • "穿板子" → 熟悉裝備 ✅    │
│ • "推板" → 單腳平坡滑動 ✅  │
│ • "直滑" → 緩坡單腳直滑 ✅  │
│ • "煞車" → 單腳直滑轉彎煞車 ✅│
│ [查看全部...]              │
│                            │
│ 📖 常用詞彙參考:            │
│ ┌─────────────────────────┐ │
│ │ Level 1 基礎:           │ │
│ │ 裝備/穿板 → "熟悉裝備"   │ │
│ │ 推板/滑動 → "單腳平坡滑動"│ │
│ │ 直滑 → "緩坡單腳直滑"   │ │
│ │                        │ │
│ │ Level 2 進階:           │ │
│ │ 落葉飄 → "落葉飄轉動雪板" │ │
│ │ C轉 → "背面/正面轉彎"    │ │
│ └─────────────────────────┘ │
│                            │
│ [📖 完整對照表] [🔧 自定義] │
└─────────────────────────────┘
```

### 5.6 學生進度頁面 (顯示語音評量來源)

```html
📱 我的滑雪進度
┌─────────────────────────────┐
│ 📅 最新評量 (2024/01/20)     │
│ 🏔️ 東山雪場 - 李教練 🎙️    │
│                            │
│ 🎯 熟悉裝備    ⭐⭐⭐        │
│   我的預期: ⭐⭐ (謙虛了!)   │
│   教練評語: "做得很好，能獨立穿脫" │
│   📝 來源: AI語音評量       │
│                            │
│ 🎯 單腳滑動    ⭐⭐          │
│   我的預期: ⭐⭐⭐ (高估了)   │
│   教練評語: "還可以"        │
│   📝 來源: AI語音評量       │
│                            │
│ 💭 整體評語:               │
│ "今天天氣不錯，進步明顯，    │
│  繼續保持練習頻率"          │
└─────────────────────────────┘
```

---

## 6. 技術架構

### 6.1 系統架構圖 (v5增強版)

```
[前端 PWA] ──HTTPS──> [Nginx] ──> [Node.js API]
     │                   │             │
     │                   │             ├─> [PostgreSQL]
     │                   │             │
     │                   │             ├─> [Redis佇列]
     │                   │             │      │
     │                   │             │      ▼
     │                   │             └─> [語音處理Worker]
     │                   │                      │
     │                   v                      ├─> [Whisper API]
     │              [靜態資源]                  │
     │                                         ├─> [GPT-4 API]
     │                                         │
     └─> [WebSocket] <────[即時通知]<───────────┘
```

### 6.2 技術選型 (v5版本)

```yaml
前端 (保持不變):
  - Progressive Web App
  - HTML5 + Vanilla JavaScript + WebSocket
  - Tailwind CSS
  - Chart.js (進度圖表)

後端核心 (保持不變):
  - Node.js + Express
  - JWT RS256 驗證
  - PostgreSQL 15+

新增：語音處理架構:
  - Redis 7+ (佇列管理)
  - Bull Queue (任務調度)
  - OpenAI Whisper API (語音轉文字)
  - OpenAI GPT-4 API (文本解析)
  - WebSocket (即時狀態更新)

部署 (增強版):
  - Docker + Docker Compose
  - Nginx (反向代理 + WebSocket支援)
  - PM2 (API服務 + Worker集群)
  - Let's Encrypt SSL

監控 (新增):
  - Queue監控: Bull Dashboard
  - AI API監控: 自定義指標
  - 成本監控: API使用量追蹤
  - 錯誤追蹤: Sentry + 語音處理專用日誌
```

---

## 7. 安全與隱私

### 7.1 語音資料安全 (新增重點)

```yaml
音頻檔案安全:
  - AES-256加密儲存
  - 7天自動刪除策略
  - 僅授權教練可存取
  - 傳輸過程TLS 1.3加密

AI API安全:
  - API Key輪換機制
  - 請求頻率限制
  - 敏感資訊過濾
  - 零日誌策略 (OpenAI API配置)

資料隱私:
  - 語音資料不永久儲存
  - AI處理結果可選匿名化
  - 歐盟GDPR合規
  - 使用者資料刪除權限

轉錄與解析資料:
  - Whisper轉錄文字與GPT解析JSON保留30天後自動刪除
  - 匿名化處理學生姓名與識別資訊才可延長保存
  - 支援教練提出手動刪除請求即時清除歷史轉錄
  - 審計日誌僅保留哈希後的語音關聯鍵
```

### 7.2 傳統安全措施 (沿用v4)
```javascript
// JWT驗證、權限控制、資料加密等保持不變
```

---

## 8. 性能與成本

### 8.1 語音處理性能指標

```yaml
處理時間目標:
  - 語音轉文字: < 25秒 (3分鐘音頻)
  - GPT-4解析: < 15秒
  - 總處理時間: < 45秒
  - 使用者等待體驗: 優秀

並發處理能力:
  - Worker水平擴展: 2-5個實例
  - 佇列緩衝: 100個任務
  - 峰值處理: 20個語音同時處理
  - 降級策略: 佇列滿時提示延遲處理

準確率目標:
  - 姓名識別: > 95%
  - 評分識別: > 90%
  - 評語提取: > 85%
  - 整體可用性: > 90%
```

### 8.2 成本控制

```yaml
AI API成本 (每月預估):
  - 300次語音評量/月
  - 平均錄音時長3分鐘 (Whisper large-v3 0.006/分鐘)
  - GPT-4 Turbo 128k 以 3k tokens/次轉譯計算
  - Whisper API: ~$10
  - GPT-4 API: ~$45
  - 總計: ~$55/月 (~NT$1650)

優化策略:
  - 批量處理折扣
  - 快取常用解析結果
  - 失敗任務重試限制
  - 成本監控與報警

ROI分析:
  - 節省教練時間: 300次 × 10分鐘 = 50小時/月
  - 時薪價值: NT$500-1000
  - 月度價值: NT$25,000-50,000
  - 成本效益比: 15-30倍回報
```

---

## 9. 風險管理

### 9.1 技術風險

```yaml
AI服務依賴風險:
  緩解策略:
    - 多個API Key輪換
    - 服務降級到手動評量
    - 本地語音處理備案 (未來)
    - 處理失敗友好提示

語音識別準確率風險:
  緩解策略:
    - 置信度評分機制
    - 低置信度人工確認
    - 教練培訓錄音技巧
    - 逐步改進AI提示詞

佇列系統故障風險:
  緩解策略:
    - Redis主從部署
    - 任務持久化儲存
    - 失敗任務手動重試
    - 監控和告警系統
```

### 9.2 業務風險

```yaml
使用者接受度風險:
  緩解策略:
    - 保留傳統手動評量
    - 漸進式功能推廣
    - 充分使用者培訓
    - 收集反饋快速改進

成本超支風險:
  緩解策略:
    - 成本監控和報警
    - API使用量限制
    - 批量處理優化
    - ROI定期評估

資料隱私風險:
  緩解策略:
    - 音頻檔案定期刪除
    - 資料傳輸加密
    - 使用者隱私協議
    - 合規審計機制
```

---

## 10. 成功指標與KPI

### 10.1 技術指標

```yaml
系統性能:
  - API回應時間 p95 < 300ms (非語音介面)
  - 語音處理時間 < 45秒
  - 系統可用性 > 99.5%
  - 語音處理成功率 > 95%

AI品質:
  - 姓名識別準確率 > 95%
  - 評分識別準確率 > 90%
  - 整體置信度 > 0.85
  - 人工修改率 < 20%
```

### 10.2 業務指標

```yaml
使用者採用:
  - 語音評量使用率 > 60% (6個月內)
  - 教練滿意度 > 4.5/5
  - 評量完成時間減少 > 70%
  - 評量完成率 > 95%

成本效益:
  - 單次語音評量成本 < NT$2
  - 教練時間節省 > 8分鐘/次評量
  - ROI > 15倍 (6個月)
  - AI API成本控制在預算內
```

---

## 11. 部署與實施計劃

### 11.1 漸進式部署策略

```yaml
Phase 1: 基礎設施 (1週)
  - Redis佇列部署
  - Worker服務搭建
  - 資料庫遷移執行
  - API基礎介面開發

Phase 2: AI整合 (2週)
  - Whisper API整合測試
  - GPT-4解析邏輯開發
  - 錯誤處理與重試機制
  - 小規模功能測試

Phase 3: 前端整合 (1週)
  - 語音錄製界面
  - 即時進度顯示
  - 結果確認界面
  - 端到端流程測試

Phase 4: 生產部署 (1週)
  - 生產環境部署
  - 性能監控設置
  - 使用者培訓準備
  - 漸進式開放使用
```

---

## 12. 結論

滑雪學生評量系統v5通過集成AI語音評量功能，實現了教練工作流程的革命性改進。核心創新包括：

### 12.1 技術創新突破
- **異步佇列架構**: 解決AI處理時間長的使用者體驗問題
- **雙重AI解析**: Whisper + GPT-4提供高準確率的語音到結構化資料轉換
- **智能暱稱映射**: 解決"上課叫小名，評量填正名"的實際問題
- **智能詞彙轉譯**: AI自動將教練口語轉換為標準化能力項目
- **置信度評估**: AI自動評估結果可靠性，確保資料品質

### 12.2 實用價值體現
- **效率提升**: 評量時間從10-15分鐘減少到3-5分鐘 (70%時間節省)
- **準確性保證**: AI輔助 + 人工確認，確保評量品質不降低
- **規模支援**: 佇列機制支援多教練並發使用，系統可擴展
- **成本可控**: 月度AI成本約NT$1650，ROI達到15-30倍

### 12.3 設計哲學實踐
- **好品味**: 通過佇列統一處理，消除同步異步的複雜性
- **實用主義**: 解決教練真實痛點，不追求技術炫耀
- **簡潔執念**: 錄音→確認，最小化使用者認知負荷
- **向後兼容**: 傳統手動評量依然可用，漸進式升級

v5版本在保持v4核心功能穩定的基礎上，通過AI技術實現了質的飛躍，預期將顯著提升教練工作效率和系統使用者滿意度，為滑雪教育數位化轉型奠定堅實基礎。

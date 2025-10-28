# **🧩 軟體設計規格書（SSD）**

## **1️⃣ 封面頁**

* **專案名稱**：滑雪教學評量系統（Ski Teaching Evaluation Platform）

* **文件名稱**：軟體設計規格書（SSD）

* **版本號**：v1.0

* **編寫人**：James Chen（草稿）

* **日期**：2025/10/21

---

## **2️⃣ 文件修訂紀錄**

| 版本 | 日期 | 修訂人 | 變更內容 |
| ----- | ----- | ----- | ----- |
| 1.0 | 2025/10/21 | James Chen | 初版：依 SSD 範本重組並整併 T-SPEC 內容；建立修訂機制 |
|  |  | 1.1 | 2025/10/22 |
|  | 2025/10/23  | James Chen | 新增教練評量頁顯示學生自評功能；外框加粗、自評與教練評分顯示、API擴充 |

註：本 SSD 由 T-SPEC 最新版內容重構而成，保留向後相容原則與共享治理細節。

---

## **3️⃣ 目錄（自動生成）**

目錄將由檔案平台自動生成（或於最終發佈時以文件工具插入 TOC）。

---

## **4️⃣ 系統概述（System Overview）**

### **4.1 系統目標**

建立統一的滑雪教學評量平台，支援「教練教學過程記錄」「學生能力評量追蹤」「管理報表與共享治理」，同時維持對舊版（v4）資料與操作向後相容。

### **4.2 系統範圍**

* 課程與席位管理（Lesson / Seat / Invitation）

* 教學過程記錄（分析、練習、影片）與自動排序

* 能力評量（1–3 星）與繼承機制

* 學生自評與進度趨勢

* 共享治理（private / resort / all）與授權開關

* 監護人身份流程與認領前表單

* 字典維護（能力、分析、練習、雪場）

* 報表與匯出、審計與監控

* v4 → 新系統資料遷移與回滾

### **4.3 使用者角色**

* **教練（Instructor）**：建立/維護教學記錄、評量、共享設定

* **學生（Student）**：查看評量與建議、提交自評、追蹤進度

* **管理員（Admin）**：帳號審核、字典維護、共享權限控管、報表

* **監護人（Guardian）**：以邀請連結認領、檢視評量與建議

### **4.4 運行環境**

* **前端**：Web（Chrome/Edge/Safari 最新版）、可延伸到行動裝置

* **後端**：REST API、JWT 身分驗證、MFA（敏感操作）

* **資料庫**：PostgreSQL（RLS 啟用、Read Replica 報表）、WAL 備份

* **儲存/媒體**：物件儲存（簽名 URL，TTL 預設 24h，可調）

* **網路/安全**：TLS 1.3、WAF/Rate Limit

---

## **5️⃣ 系統架構（System Architecture）**

### **5.1 架構設計圖（文字化描述）**

**Client（Web）** ⇄ **API Gateway/Service 層** ⇄ **PostgreSQL（RLS）**

* 外掛：任務排程（逾期邀請回收、報表）、訊息佇列（通知/審計）、物件儲存（教學影片簽名 URL）

### **5.2 主要模組說明**

* **Accounts & Auth**：登入、刷新 Token、MFA

* **Lessons & Seats**：課程/席位/邀請碼、認領流程（樂觀鎖）

* **Lesson Records**：教學記錄主檔/學生詳情/分析/練習（排序後端賦值）

* **Evaluations**：教練評量（1–3 星）、學生自評、繼承鏈檢查（業務規則）

* **Sharing**：私有/雪場/全域可見性 \+ `can_view_shared_records` 權限旗標

* **Catalogs**：能力、分析、練習項目與雪場字典

* **Reports**：CSV/PDF 匯出、Read Replica 查詢

* **Migration**：v4 → 新模型的轉換與驗證

### **5.3 資料流程圖（DFD）/ 序列（簡述）**

1. 教練建立/更新教學記錄 → Service 層賦值 `display_order` → DB 寫入 → 審計

2. 評量繼承請求 → Service 檢查最大繼承層數/循環 → 允許/拒絕

3. 共享查詢（scope=shared）→ 驗證權限旗標 \+ 可見性 \+ 篩選 → 節流 & 審計

### **5.4 系統組成整合**

* **前端**：Dashboard / 課程頁 / 歷史 / 共享中心 / 學生專區 / 後台

* **後端**：Auth / Lessons / Records / Evaluations / Sharing / Catalog / Reports

* **資料庫**：RLS、索引策略、審計表 / 排程紀錄

* **第三方**：物件儲存（簽名 URL）、通知管道（Webhook/Slack）、備份（WAL+雲端）

---

## **6️⃣ 功能設計（Functional Design）**

代表性功能條目（可持續擴充）。

| 功能編號 | 功能名稱 | 功能描述 | 輸入 | 輸出 | 處理邏輯 | 例外處理 |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| F-001 | 使用者登入 | 驗證帳密、簽發 JWT | email, password | access/refresh token | 驗證 → 設定 claims/過期時間 | `UNAUTHORIZED`、`RATE_LIMITED` |
| F-010 | 課程清單 | 依教練與日期查詢 | role, date | 課程/席位摘要 | RLS \+ 索引查詢 | 無資料回空集合 |
| F-020 | 產生邀請碼 | 為席位建立 8 碼邀請 | seat\_id | code, expires\_at | 在交易內產生、碰撞重試 ≤5 | `INVITE_CODE_COLLISION`、`INVITE_EXPIRED` |
| F-030 | 認領席位 | 驗證邀請碼並認領 | code, identity | seat 狀態改為 claimed | 樂觀鎖 \+ 表單狀態檢查 | `SEAT_CLAIMED`、`IDENTITY_FORM_INCOMPLETE`、409 |
| F-040 | 建立教學記錄 | 建立主檔與學生詳情 | lesson\_id, students | record 物件 | 欄位驗證、審計 | `VALIDATION_ERROR` |
| F-050 | 拖拉排序 | 更新分析/練習順序 | id 陣列 | 成功/新序列 | Service 賦值 `display_order` | `ANALYSIS_SET_MISMATCH` |
| F-060 | 教練評量 | 1–3 星+評語，支援繼承 | detail\_id, ability\_id | rating 記錄 | 檢查繼承鏈/去重 | `INHERITANCE_DEPTH_EXCEEDED`、`INHERITANCE_INVALID_CHAIN` |
| F-070 | 共享可見性 | 設定 private/resort/all | detail\_id, visibility | 新狀態 | 驗證「擁有者/管理員」+ MFA | `ONLY_OWNER_CAN_SHARE`、`INVALID_VISIBILITY` |
| F-080 | 共享查詢 | 依條件查閱共享紀錄 | filters... | 去識別化清單 | 權限旗標 \+ Rate Limit \+ 審計 | `FORBIDDEN`、`RATE_LIMITED` |
| F-090 | 學生自評 | 提交 1–3 星自評 | stars, comment | 自評記錄 | 身分驗證 \+ RLS | `VALIDATION_ERROR` |
| F-100 | 報表匯出 | 完成率/使用統計 | filters | CSV/PDF | Read Replica 查詢 | 任務失敗 → 告警 |
| F-110 | v4 資料遷移 | 對照匯入與驗證 | source dumps | 匯入狀態 | 分段遷移/抽樣驗證 | 回滾策略啟用 |

可視化：Use Case / Activity Diagram 於設計審查會議附圖（此處留白）。

---

## **7️⃣ 資料設計（Data Design）**

### **7.1 資料庫 ER（摘要）**

* **核心**：accounts ↔ instructors ↔ lessons ↔ order\_seats ↔ seat\_invitations / seat\_identity\_forms

* **教學**：lesson\_records ↔ lesson\_record\_details ↔ (lesson\_detail\_analyses, lesson\_detail\_practices)

* **評量**：coach\_ability\_ratings（繼承引用 source\_rating\_id）↔ student\_self\_evaluations

* **學生**：global\_students ↔ student\_mappings ↔ guardian\_relationships

* **字典**：resorts / ability\_catalog / analysis\_items / practice\_drills

### **7.2 資料表（節錄）**

| 資料表 | 欄位名稱 | 型態 | 說明 | 必填 |
| ----- | ----- | ----- | ----- | ----- |
| accounts | id, email, role, mfa\_enabled, status | int/varchar/bool | 帳號/角色/MFA | Y |
| instructors | id, account\_id, can\_view\_shared\_records | int/bool | 教練與共享權限旗標 | Y |
| lessons | id, resort\_id, date, instructor\_id | int/date | 課程主檔 | Y |
| order\_seats | id, lesson\_id, seat\_number, status, version | uuid/int | 席位/狀態/樂觀鎖 | Y |
| seat\_invitations | code(8), seat\_id, expires\_at, claimed\_at | varchar/uuid | 邀請碼/期限 | Y |
| seat\_identity\_forms | seat\_id, status, contact\_email, guardian\_email, ... | uuid/enum | 認領前身份資料 | Y |
| lesson\_records | id, lesson\_id, summary, videos | uuid | 教學記錄主檔 | Y |
| lesson\_record\_details | id, record\_id, student\_mapping\_id, resort\_id, share\_visibility | uuid/enum | 學生明細/共享 | Y |
| lesson\_detail\_analyses | id, detail\_id, analysis\_id/custom, display\_order | uuid/int | 分析明細/排序 | Y |
| lesson\_detail\_practices | id, detail\_id, drill\_id/custom, display\_order | uuid/int | 練習明細/排序 | Y |
| ability\_catalog | id, name, category, sport\_type | int | 能力清單 | Y |
| coach\_ability\_ratings | id, detail\_id, ability\_id, rating(1–3), source\_rating\_id | uuid/int | 教練評量與繼承 | Y |
| student\_self\_evaluations | id, student\_mapping\_id, lesson\_id, self\_rating | uuid/int | 自評 | Y |

索引策略：共享可見性+雪場、排序欄位、繼承來源、自評/學生映射與邀請碼驗證等關鍵索引皆已定義。

---

## **8️⃣ 介面設計（Interface Design）**

### **8.1 使用者介面（UI）**

### **8.1.1 能力評量頁 — 自評顯示規則（2025-10-22 修訂）**

| 狀態 | 顯示模式 | ARIA 宣告 | 備註 |
| ----- | ----- | ----- | ----- |
| 已自評 | 星號外框加粗 (2.5px) 對應 1–3 顆 | 自評：★★☆ | 外框只讀 |
| 未自評 | 虛線外框 (1.5px) \+ Badge「未自評」 | 自評：無 | 文字 fallback：自評：★★☆ |
| 教練評 | 實心填滿 1–3 顆，可調整 | 教練評分：★★★ | 即時更新 |

* 外框（自評）為只讀，不受教練操作影響  
* 內填（教練評）可即時調整 1–3 顆，可使用滑鼠或方向鍵  
* Tooltip 顯示：「自評：★☆☆」「教練評分：★★★」  
* ARIA 朝出兩種星等值或「自評：無」  
* 效能 SLO：評量頁載入 P95 \< 400 ms

### **8.2 系統介面（API / 外部系統）**

| API 名稱 | 方法 | URL | 輸入參數（節錄） | 回傳 | 說明 |
| ----- | ----- | ----- | ----- | ----- | ----- |
| login | POST | /api/v1/auth/login | email, password | JWT | 登入/簽發 Token |
| lessons.list | GET | /api/v1/lessons | role, date | 課程清單 | 依角色與日期查詢 |
| seats.invite | POST | /api/v1/seats/{id}/invitations | seat\_id | code, expires\_at | 產生 8 碼邀請 |
| invitations.claim | POST | /api/v1/invitations/claim | code, identity | 狀態更新 | 樂觀鎖+表單檢查 |
| records.create | POST | /api/v1/lesson-records | lesson\_id, students | record | 建立教學記錄 |
| analyses.reorder | POST | /api/v1/lesson-records/{id}/analyses/reorder | analysis\_ids\[\] | 成功 | 後端賦值排序 |
| practices.reorder | POST | /api/v1/lesson-records/{id}/practices/reorder | practice\_ids\[\] | 成功 | 同上 |
| records.share | PATCH | /api/v1/lesson-records/{id}/share-visibility | detail\_id, visibility, reason | 成功 | 需 MFA \+ 審計 |
| records.query | GET | /api/v1/lesson-records | scope, filters, page... | 列表 | shared 須權限旗標+節流 |
| selfeval.create | POST | /api/v1/students/me/self-evaluations | stars, comment | 記錄 | 學生自評 |
| reports.export | GET | /api/v1/reports | filters | CSV/PDF | Read Replica |
| coach.lessons.detail	GET	/api/v1/coach/lessons/{id}	include=self\_eval	lesson 物件	各學生帶 self\_eval 欄位 | lessons.seats	GET	/api/v1/lessons/{id}/seats	include=self\_eval	seat 清單	同步學生自評至清單 |  |  |  |  |

---

## **9️⃣ 非功能需求（Non-functional Requirements）**

| 類別 | 說明 |
| ----- | ----- |
| 效能 | API P95 \< 400ms；同時在線 500 用戶；Read Replica 供報表 |
| 安全性 | TLS 1.3、JWT、MFA（共享/批次匯出/席位確認等敏感操作） |
| 可維護性 | 後端賦值排序、業務規則檢查、清晰錯誤碼、審計標準化 |
| 相容性 | 支援 Chrome/Edge/Safari 最新版 |
| 可觀測性 | 審計日誌、共享/私有查詢計數與失敗指標、排程執行情況 |
| 備份與復原 | 無障礙 (Accessibility)	Tooltip \+ ARIA 宣告；自評外框只讀；鍵盤操作僅影響教練評；符合 WCAG AA 對比度 |

---

## **🔟 錯誤處理與日誌紀錄（Error Handling & Logging）**

* **標準錯誤碼**：`VALIDATION_ERROR`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT`、`SEAT_CLAIMED`、`INVITE_EXPIRED`、`ANALYSIS_SET_MISMATCH`、`INHERITANCE_INVALID_CHAIN`、`INHERITANCE_DEPTH_EXCEEDED`、`INVITE_CODE_COLLISION`、`INVALID_VISIBILITY`、`IDENTITY_FORM_INCOMPLETE`、`ONLY_OWNER_CAN_SHARE`、`RATE_LIMITED`

* **日誌層級**：info / warn / error；寫入 audit\_logs（動作、條件、筆數、操作者、時間）

* **例外策略**：共享查詢節流；邀請碼產生在交易內重試；失敗告警（Webhook/Slack）

---

## **11️⃣ 測試考量（Testing Considerations）**

* **模組測試**：排序賦值、繼承鏈驗證、席位認領（樂觀鎖）、共享權限檢查

* **介面測試**：登入/刷新、課程/席位、記錄/評量、共享/查詢、匯出

* **整合測試**：v4 遷移抽樣核對（星等/評語/身份）、審計與監控指標

* **負載/節流**：shared 查詢節流、長清單分頁（最大 page\_size=100）

---

## **12️⃣ 安全性與權限設計（Security & Access Control）**

* **RBAC**：Admin / Instructor / Student / Guardian 分權；敏感操作需 MFA

* **RLS**：教練僅存取授課紀錄；學生/監護人僅存取自身；共享需同時滿足可見性與權限旗標 `can_view_shared_records`

* **加密**：靜態個資欄位 AES-256；傳輸 TLS 1.3；簽名 URL TTL（預設 24h，可調）

* **授權流程**：共享可見性變更需 MFA \+ 理由；寫入 audit\_logs；節流與告警

---

## **13️⃣ 附錄（Appendix）**

### **A. 參考文件**

* T-SPEC 最新版（本 SSD 依其內容重構）

### **B. 縮寫詞與定義**

* **Outcome**：能力評量結果資料

* **Process**：教學過程資料（分析/練習/影片/摘要）

* **Mapping**：全域學生與雪場域的關聯

* **RLS**：Row Level Security（行級安全）

* **P95**：95 百分位回應時間指標

### **C. 系統環境設定（摘要）**

* 環境變數：JWT 秘鑰、MFA/IdP、物件儲存簽名金鑰、Rate Limit、Feature Flags（媒體 TTL）

* 排程：邀請過期清理、報表匯出；記錄 job\_runs 與告警

* 命名與檔名規範：`SSD_<project>_YYYYMMDD_vX.Y.md`

---

備註：本 SSD 為唯一正式規格；其它文件僅作歷史參考。未來修訂請更新修訂紀錄並以 Pull Request 方式審核。


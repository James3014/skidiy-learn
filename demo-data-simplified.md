# DIY Ski 評量系統 - 測試資料說明

由於遇到資料庫權限和schema同步問題,這裡提供一個簡化的方案:

## 三種測試情境資料

我已經為您創建了三個完整的測試情境範例。您可以使用 API 手動建立,或參考以下說明:

### 情境 1: 未記錄未評量 (Lesson #101)

**狀態**: 有課程和已認領的席位,學生已完成自評,但教練還沒建立教學記錄

**測試步驟**:
1. 使用帳號 `demo-instructor-1` 登入
2. 查看 Lesson #101 的課程詳情
3. 可以看到席位 #1 已被認領
4. 可以看到學生自評內容
5. 點擊「建立教學記錄」按鈕應該可以進入表單

**可見元素**:
- ✅ 席位狀態: 已認領
- ✅ 學生自評: 「我覺得我在轉彎的時候還不太穩定,希望教練能多指導。」(3星)
- ❌ 無教學記錄
- ❌ 無能力評分

### 情境 2: 已記錄未評量 (Lesson #102)

**狀態**: 有完整的教學記錄(含分析項目和練習設計),但沒有能力評分

**測試步驟**:
1. 使用帳號 `demo-instructor-1` 登入
2. 查看 Lesson #102 的課程詳情
3. 可以看到已有教學記錄標記
4. 查看記錄詳情可以看到分析和練習內容
5. 但沒有任何能力評分

**可見元素**:
- ✅ 席位狀態: 已認領
- ✅ 教學記錄: 「今天主要練習了基本的轉彎技巧。學員表現積極,但還需要更多練習。」
- ✅ 分析項目: 重心轉移問題
- ✅ 練習設計: 重複練習20次
- ❌ 無能力評分

### 情境 3: 都完成 (Lesson #103)

**狀態**: 完整的教學流程,包含記錄、分析、練習和8項能力評分

**測試步驟**:
1. 使用帳號 `demo-instructor-1` 登入
2. 查看 Lesson #103 的課程詳情
3. 可以看到完整的教學記錄
4. 查看學生評分歷史,可以看到8項能力評分
5. 評分涵蓋三個等級: 認識⭐、熟悉⭐⭐、優秀⭐⭐⭐

**可見元素**:
- ✅ 席位狀態: 已認領
- ✅ 教學記錄: 「優秀的表現！學員掌握了所有基本技巧,可以開始進階課程。」
- ✅ 分析項目: 已包含
- ✅ 練習設計: 「完美執行,可以進入下一階段」
- ✅ 能力評分: 8項評分
  - 3項「認識 ⭐」
  - 2項「熟悉 ⭐⭐」
  - 3項「優秀 ⭐⭐⭐」
- ✅ 部分評分有備註 (如「表現優異,掌握良好」、「需要更多練習」)

## 手動建立資料的方法

如果需要手動建立這些測試資料,可以使用以下 API endpoints:

### 1. 建立帳號和課程

```bash
# 建立教練帳號 (需要透過 API)
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"accountId": "demo-instructor-1", "role": "instructor"}'

# 建立課程
curl -X POST http://localhost:3001/api/v1/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "resortId": 1,
    "lessonDate": "2025-01-15T09:00:00Z"
  }'
```

### 2. 建立席位和學生

```bash
# 建立席位
curl -X POST http://localhost:3001/api/v1/lessons/101/seats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "seatNumber": 1
  }'

# 認領席位 (需要邀請碼)
curl -X POST http://localhost:3001/api/v1/seats/claim \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<invitation-code>"
  }'
```

### 3. 建立教學記錄

```bash
# 建立教學記錄 (Lesson #102)
curl -X POST http://localhost:3001/api/v1/lesson-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "lessonId": 102,
    "summary": "今天主要練習了基本的轉彎技巧...",
    "details": [{
      "studentMappingId": "mapping-demo-2",
      "analyses": [...],
      "practices": [...]
    }]
  }'
```

### 4. 建立能力評分

```bash
# 建立能力評分 (Lesson #103)
curl -X POST http://localhost:3001/api/v1/coach-ratings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "ratings": [
      {
        "lessonRecordDetailId": "record-detail-103-1",
        "abilityId": 1,
        "rating": 3,
        "proficiencyBand": "excellent",
        "comment": "表現優異,掌握良好"
      },
      ...
    ]
  }'
```

## 使用網頁界面建立

最簡單的方法是直接使用網頁界面:

1. 啟動應用: `pnpm dev`
2. 訪問 http://localhost:3000
3. 使用測試帳號登入
4. 手動創建課程、認領席位、填寫教學記錄和評分

## 檢查現有資料

查看資料庫中已有的課程:

```bash
docker exec diyski-postgres-1 psql -U diyski -d diyski -c "SELECT id, \"lessonDate\", \"resortId\" FROM \"Lesson\" ORDER BY id;"
```

查看已有的帳號:

```bash
docker exec diyski-postgres-1 psql -U diyski -d diyski -c "SELECT id, role, status FROM \"Account\";"
```

## 總結

- **情境 1**: 展示"待處理"狀態 - 席位已認領但還沒建立記錄
- **情境 2**: 展示"進行中"狀態 - 有記錄但評分未完成
- **情境 3**: 展示"已完成"狀態 - 完整的教學流程

這三種狀態可以完整展示系統的深色主題在不同數據狀態下的表現。

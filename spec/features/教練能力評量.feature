Feature: 教練能力評量
  系統為教練提供 1-3 星能力評量與繼承機制，並需與 CSV 標籤對齊。

  Rule: 建立評量時同步寫入 proficiency_band
    Example: 教練以一顆星評量學生能力
      Given lesson_record_detail "LRD-001" 指向 ability_id 161
      When 教練提交評量 rating 為 1 且 comment 為 "雪板基本介紹"
      Then 評量記錄儲存如下
        | field              | value   |
        | lesson_record_detail_id | LRD-001 |
        | ability_id         | 161     |
        | rating             | 1       |
        | proficiency_band   | knew    |
      And 評量記錄的 rated_by 為該教練帳號

  Rule: 評量繼承最多僅允許兩層
    Example: 第三層繼承被拒絕
      Given 來源評量「R-002」已繼承自「R-001」
      When 教練以來源評量「R-002」建立新的繼承評量
      Then 操作失敗
      And 系統回傳錯誤代碼 "INHERITANCE_DEPTH_EXCEEDED"

  Rule: 發現循環引用時拒絕繼承
    Example: 循環來源鏈被阻擋
      Given 來源評量「R-010」的 source_rating_id 指向「R-011」
      And 評量「R-011」的 source_rating_id 指向「R-010」
      When 教練以來源評量「R-010」建立新的繼承評量
      Then 操作失敗
      And 系統回傳錯誤代碼 "INHERITANCE_INVALID_CHAIN"

  Rule: 未提供學生類型時沿用最近紀錄
    Example: 批次評量未帶 student_types
      Given lesson_record_detail "LRD-050" 對應學生映射 "SM-200"
      And 最近一筆課程紀錄的 student_types 為 ["doer","watcher"]
      When 教練提交批次評量，payload 未提供 student_types
      Then lesson_record_detail "LRD-050" 的 student_types 仍為 ["doer","watcher"]
      And 系統校驗 student_types 的值域皆位於 ENUM student_persona_enum

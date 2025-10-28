Feature: 能力清單查詢
  能力清單需支援依運動別與等級過濾並維持 CSV 序號排序。

  Rule: 依 sport_type 與 level 過濾能力項目
    Example: 查詢滑雪 level 3 能力
      Given ability_catalog 已載入 type=ski level=3 的 7 筆資料
      When 管理員呼叫 GET /api/v1/catalog/abilities?sport_type=ski&level=3
      Then 回應資料僅包含 sport_type 為 "ski" 且 skill_level 為 3 的項目
      And 回應依 sequence_in_level 由小到大排序

  Rule: CSV 匯入以 sport_type+skill_level+sequence_in_level 進行 UPSERT
    Example: 重新匯入相同能力更新說明
      Given ability_catalog 含有 sport_type=snowboard、skill_level=2、sequence_in_level=5 的項目
      When 系統執行 catalog.seed_abilities_from_csv 並載入同一索引且 description 更新為 "調整平衡"
      Then ability_catalog 中對應項目的 description 為 "調整平衡"
      And updated_at 欄位更新為最新時間

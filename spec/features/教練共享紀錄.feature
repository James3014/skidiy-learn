Feature: 教練共享紀錄
  教練可設定教學紀錄共享狀態，並受權限與審計約束。

  Rule: 查詢 shared scope 必須具備 can_view_shared_records
    Example: 未授權教練查詢共享紀錄
      Given 教練帳號 "coach-A" 的 can_view_shared_records 為 false
      When 教練以 scope=shared 呼叫 GET /api/v1/lesson-records
      Then 操作失敗
      And 系統回傳 HTTP 狀態碼 403

  Rule: 更新共享狀態需提供理由並寫入審計
    Example: 教練將紀錄改為 resort 共用
      Given 教練帳號 "coach-B" 擁有 lesson_record_detail "LRD-045"
      When 教練以 PATCH /api/v1/lesson-records/{id}/share-visibility 提交
        | field            | value        |
        | detail_id        | LRD-045      |
        | share_visibility | resort       |
        | reason           | 課後教研使用 |
      Then lesson_record_detail "LRD-045" 的 share_visibility 為 "resort"
      And audit log 新增紀錄
        | field      | value        |
        | action     | share_visibility_update |
        | detail_id  | LRD-045      |
        | reason     | 課後教研使用 |
        | shared_by  | coach-B      |

  Rule: scope=shared 查詢需寫入查詢條件與筆數
    Example: 管理員查詢共享紀錄
      Given 教練帳號 "coach-C" 的 can_view_shared_records 為 true
      When 教練以 scope=shared、visibility=all 呼叫 GET /api/v1/lesson-records
      Then 查詢成功
      And audit log 新增紀錄
        | field    | value       |
        | action   | lesson_lookup |
        | scope    | shared      |
        | filters  | visibility=all |

  Rule: 每分鐘查詢共享最多 30 次
    Example: 節流超量時回傳 429
      Given 教練帳號 "coach-D" 的 can_view_shared_records 為 true
      And coach-D 在 60 秒內已呼叫 GET /api/v1/lesson-records?scope=shared 30 次
      When 教練再度呼叫 GET /api/v1/lesson-records?scope=shared
      Then 操作失敗
      And 系統回傳 HTTP 狀態碼 429
      And audit log 新增紀錄
        | field  | value              |
        | action | shared_rate_limited |
        | scope  | shared             |
        | count  | 0                  |

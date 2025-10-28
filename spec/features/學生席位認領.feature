Feature: 學生席位認領
  席位認領流程需先完成身份表單並維護狀態轉換。

  Rule: 表單未提交時不得確認認領
    Example: 身份表單仍為草稿
      Given seat_identity_form "SIF-001" 的 status 為 draft
      When 監護人呼叫 POST /api/v1/invitations/ABCD1234/confirm
      Then 操作失敗
      And 系統回傳錯誤代碼 "IDENTITY_FORM_INCOMPLETE"

  Rule: 標記為未成年時必須填寫監護人 Email
    Example: 未成年成員缺少監護人 Email
      Given seat_identity_form "SIF-010" 的 status 為 submitted
      And seat_identity_form "SIF-010" 的 is_minor 為 true
      And seat_identity_form "SIF-010" 的 guardian_email 為空值
      When 監護人呼叫 POST /api/v1/invitations/ZXCV6789/confirm
      Then 操作失敗
      And 系統回傳錯誤代碼 "IDENTITY_FORM_INCOMPLETE"

    Example: 成年成員可省略監護人 Email
      Given seat_identity_form "SIF-011" 的 status 為 submitted
      And seat_identity_form "SIF-011" 的 is_minor 為 false
      And seat_identity_form "SIF-011" 的 guardian_email 為空值
      When 學生呼叫 POST /api/v1/invitations/QWER1357/confirm
      Then seat_identity_form "SIF-011" 的 status 為 confirmed
      And order_seat 對應席位的 status 為 claimed

  Rule: 認領成功後席位狀態轉為 claimed
    Example: 完成身份核對後認領席位
      Given seat_identity_form "SIF-002" 的 status 為 submitted
      And order_seat "OS-045" 的 status 為 invited
      When 監護人呼叫 POST /api/v1/invitations/EFGH5678/confirm
      Then order_seat "OS-045" 的 status 為 claimed
      And seat_identity_form "SIF-002" 的 status 為 confirmed
      And 系統寫入 audit log action "seat_claim_confirm"

  Rule: 邀請碼逾期後席位轉為 expired
    Example: 排程回收逾期邀請
      Given seat_invitations "ABCD1234" 的 expires_at 早於現在
      And order_seat "OS-010" 的 status 為 invited
      When 排程執行邀請碼回收作業
      Then order_seat "OS-010" 的 status 為 expired
      And seat_invitations "ABCD1234" 被標記為逾期

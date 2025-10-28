Feature: 學生自評
  學生可在課前提交 1-3 星自評並供教練對照。

  Rule: 自評僅接受 1-3 星並紀錄評論
    Example: 學生提交三顆星自評
      Given 學生映射 "SM-100" 對應課程 112
      When 學生呼叫 POST /api/v1/students/me/self-evaluations 提交
        | field       | value          |
        | lesson_id   | 112            |
        | self_rating | 3              |
        | self_comment| 這堂課充滿信心 |
      Then 系統新增 student_self_evaluations 記錄
        | field               | value   |
        | student_mapping_id  | SM-100  |
        | lesson_id           | 112     |
        | self_rating         | 3       |
        | self_comment        | 這堂課充滿信心 |

  Rule: include=self_eval 回傳教練評量與自評對照
    Example: 教練查詢課程詳情帶入自評
      Given lesson_record_detail "LRD-120" 已存在教練評量
      And 學生映射 "SM-100" 在課程 112 有自評
      When 教練呼叫 GET /api/v1/coach/lessons/112?include=self_eval
      Then 回應中的學生資料包含欄位 self_eval
        | field        | value |
        | self_rating  | 3     |
        | self_comment | 這堂課充滿信心 |
      And 回應中的學生資料包含欄位 student_types

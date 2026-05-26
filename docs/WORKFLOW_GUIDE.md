# Workflow 編寫指南

**版本**：v2.0-alpha  
**作者**：Claude Code + HR 自動化團隊  
**最後更新**：2026-05-26

---

## 📚 目錄

1. [基本概念](#基本概念)
2. [6 種執行模式](#6-種執行模式)
3. [編寫首個 Workflow](#編寫首個-workflow)
4. [最佳實踐](#最佳實踐)
5. [常見陷阱](#常見陷阱)
6. [調試和監控](#調試和監控)

---

## 基本概念

### 什麼是 Workflow？

Workflow 是一個結構化的 JavaScript 程序，定義業務流程的執行邏輯。在 Claude Code 中，使用 `phase()`、`log()`、`await agent()` 等函數來編排多個 Agent 的協作。

### 基本結構

```javascript
// 1. 定義元數據
export const meta = {
  name: 'Workflow 名稱',
  description: '簡短描述',
  phases: [
    { title: '階段1', detail: '說明' },
    { title: '階段2', detail: '說明' },
  ],
}

// 2. 第一個階段
phase('階段1名稱')
log('開始執行...')

// 3. 調用 Agent
const result1 = await agent(`你的提示詞...`, {
  label: 'Agent 名稱',
  phase: '階段1名稱',
  schema: { /* JSON Schema */ }
})

// 4. 返回結果
return {
  workflowName: 'Workflow 名稱',
  outputs: {
    stage1: result1,
    // ...
  }
}
```

---

## 6 種執行模式

### 1. Pipeline（線性管道）

**特點**：順序執行，前一步結果是後一步輸入  
**使用場景**：步驟必須依次完成

```javascript
// Stage 1: 收集數據
phase('收集數據')
const dataCollected = await agent(`收集員工請假申請...`, {
  label: 'DataCollector',
  phase: '收集數據',
  schema: {
    type: 'object',
    properties: {
      employee_id: { type: 'string' },
      start_date: { type: 'string' },
      days: { type: 'number' },
    }
  }
})

// Stage 2: 驗證數據（使用 Stage 1 的結果）
phase('驗證數據')
const dataValidated = await agent(
  `驗證以下數據：${JSON.stringify(dataCollected)}...`,
  {
    label: 'DataValidator',
    phase: '驗證數據',
    schema: { /* ... */ }
  }
)

// Stage 3: 執行（使用 Stage 2 的結果）
phase('執行')
const result = await agent(
  `執行批准，數據已驗證：${JSON.stringify(dataValidated)}...`,
  {
    label: 'Executor',
    phase: '執行',
    schema: { /* ... */ }
  }
)
```

---

### 2. SyncAgg（同步聚合）

**特點**：多個任務並行執行，最後聚合結果  
**使用場景**：獨立任務，可並行執行

```javascript
// 並行執行三個任務
phase('並行檢查')
log('同時執行策略檢查和法規檢查...')

const [policyCheck, complianceCheck, calculateVacation] = await Promise.all([
  agent(`檢查公司假期政策...`, {
    label: 'PolicyValidator',
    phase: '並行檢查',
    schema: { /* ... */ }
  }),
  
  agent(`檢查法規合規性...`, {
    label: 'ComplianceChecker',
    phase: '並行檢查',
    schema: { /* ... */ }
  }),
  
  agent(`計算假期天數...`, {
    label: 'VacationCalculator',
    phase: '並行檢查',
    schema: { /* ... */ }
  })
])

// 聚合結果
phase('聚合結果')
const aggregated = {
  policy_approved: policyCheck.approved,
  compliance_approved: complianceCheck.approved,
  vacation_days: calculateVacation.days,
  all_checks_passed: policyCheck.approved && complianceCheck.approved
}

log(`聚合完成：${JSON.stringify(aggregated)}`)
```

---

### 3. Adversarial（對抗驗證）

**特點**：兩個相反角色互相驗證，發現衝突  
**使用場景**：需要多角度驗證，並發現潛在衝突

```javascript
// 平行執行兩個相反的檢查
phase('對抗驗證')
log('PolicyValidator 和 ComplianceChecker 對立驗證...')

const policyResult = await agent(`從公司政策角度審批...`, {
  label: 'PolicyValidator',
  phase: '對抗驗證',
})

const complianceResult = await agent(`從法規角度審批...`, {
  label: 'ComplianceChecker',
  phase: '對抗驗證',
})

// 檢測衝突
const hasConflict = policyResult.approved !== complianceResult.approved
  || policyResult.notes.conflicts?.length > 0

if (hasConflict) {
  log('❌ 發現衝突，升級給 Reasoner...')
  
  phase('衝突分析')
  const reasonerResult = await agent(
    `PolicyValidator 說：${JSON.stringify(policyResult)}
     ComplianceChecker 說：${JSON.stringify(complianceResult)}
     請分析衝突並提出解決方案...`,
    {
      label: 'Reasoner',
      phase: '衝突分析',
    }
  )
  
  return { conflict: true, resolution: reasonerResult }
} else {
  log('✅ 無衝突，流程繼續')
}
```

---

### 4. Tail（篩選最優）

**特點**：多個 Agent 生成多個方案，選最優  
**使用場景**：衝突解決，需要多個備選方案

```javascript
// 生成多個調整方案
phase('生成解決方案')
const solutions = await Promise.all([
  agent(`生成方案 1：延遲請假時間...`, {
    label: 'SolutionGenerator_1',
  }),
  agent(`生成方案 2：縮短假期天數...`, {
    label: 'SolutionGenerator_2',
  }),
  agent(`生成方案 3：調整假期類型...`, {
    label: 'SolutionGenerator_3',
  })
])

// 篩選最優方案
phase('篩選最優')
const bestSolution = await agent(
  `從以下三個方案中選最優：
   ${solutions.map((s, i) => `方案 ${i+1}: ${JSON.stringify(s)}`).join('\n')}
   
   考慮員工滿意度和公司政策合規性，選出最佳方案。`,
  {
    label: 'SolutionSelector',
    schema: {
      type: 'object',
      properties: {
        selected_option: { type: 'number' },
        reason: { type: 'string' }
      }
    }
  }
)

log(`✅ 選定方案 ${bestSolution.selected_option}：${bestSolution.reason}`)
```

---

### 5. Cumulative（逐步累積）

**特點**：信息逐步累積，每步都加強結果  
**使用場景**：月度總結、歷史累積

```javascript
// 第一步：今年已使用假期
phase('計算累積假期（第一步）')
const currentYear = await agent(`統計 ${new Date().getFullYear()} 年已使用假期天數...`, {
  label: 'VacationAnalyzer',
})
log(`${new Date().getFullYear()} 年已使用：${currentYear.days_used} 天`)

// 第二步：上年結轉假期
phase('計算累積假期（第二步）')
const carryOver = await agent(
  `上年度結轉：${currentYear.carryover_days} 天，
   加上 ${new Date().getFullYear()} 年已使用 ${currentYear.days_used} 天...`,
  {
    label: 'VacationAccumulator',
  }
)

// 第三步：加上額外福利假期
phase('計算累積假期（第三步）')
const totalAvailable = await agent(
  `基本額度 ${currentYear.base_days} 天
   + 結轉 ${carryOver.carryover} 天
   + 額外假期（婚假、產假等）${carryOver.special} 天
   = 總共可用...`,
  {
    label: 'VacationAggregator',
  }
)

const finalResult = {
  total_available: totalAvailable.total,
  cumulative_details: {
    base: currentYear.base_days,
    carryover: carryOver.carryover,
    special: carryOver.special,
  }
}
```

---

### 6. Nested（嵌套調用）

**特點**：Workflow 調用其他 Workflow  
**使用場景**：複雜流程的模塊化

```javascript
// 主 Workflow：leave_approval
export const meta = {
  name: 'leave_approval',
  phases: [
    { title: '數據收集', detail: '...' },
    { title: '檢查政策', detail: '...' },
    { title: '計算假期', detail: '...' },
  ]
}

phase('數據收集')
const data = await agent(`收集請假申請...`, {...})

// 調用子 Workflow 1：check_policy
phase('檢查政策')
const policyCheck = await executeWorkflow('check_policy', {
  employee_id: data.employee_id,
  leave_type: data.leave_type,
  days: data.days,
})

if (!policyCheck.approved) {
  log('❌ 政策檢查失敗')
  return { approved: false, reason: policyCheck.reason }
}

// 調用子 Workflow 2：calculate_vacation
phase('計算假期')
const vacation = await executeWorkflow('calculate_vacation', {
  employee_id: data.employee_id,
  days: data.days,
  start_date: data.start_date,
})

// 調用子 Workflow 3：send_notification
phase('發送通知')
await executeWorkflow('send_notification', {
  employee_id: data.employee_id,
  approval: true,
  remaining_days: vacation.remaining,
})

// 輔助函數（在 utils/workflow-executor.js 中實現）
async function executeWorkflow(name, params) {
  const workflow = require(`../workflows/${name}.js`)
  return await workflow.execute(params)
}
```

---

## 編寫首個 Workflow

### 從零開始：leave_approval.js

這是一個完整的、生產就緒的請假審批 Workflow。

```javascript
// workflows/leave_approval.js

const { logger } = require('../utils/logger')
const { googleWorkspaceAPI } = require('../utils/googleWorkspaceAPI')

export const meta = {
  name: '請假審批工作流',
  description: '處理員工請假申請，包括政策檢查、法規驗證、衝突管理',
  phases: [
    { title: '數據收集', detail: '從 Google Form 收集並驗證申請數據' },
    { title: '政策檢查', detail: '檢查公司假期政策和額度' },
    { title: '法規檢查', detail: '驗證勞動法規合規性' },
    { title: '衝突分析', detail: '如有衝突，進行對抗驗證和衝突分析' },
    { title: '計算假期', detail: '計算剩餘假期和生成建議' },
    { title: '執行批准', detail: '更新系統、發送通知、記錄日誌' }
  ]
}

// 主流程
async function executeLeaveApproval() {
  const startTime = Date.now()
  const workflowId = `leave_${Date.now()}`
  
  try {
    // ========== Stage 1: 數據收集 ==========
    phase('數據收集')
    log('正在收集請假申請數據...')
    
    const dataCollected = await agent(
      `你是數據收集官。請從以下 Google Form 數據中提取和驗證員工請假申請信息：
       
       申請人：${getFormData('applicant_name')}
       申請日期：${getFormData('application_date')}
       請假類型：${getFormData('leave_type')}
       開始日期：${getFormData('start_date')}
       結束日期：${getFormData('end_date')}
       請假原因：${getFormData('reason')}
       
       請驗證：
       1. 所有必需欄位都已填寫
       2. 日期格式正確且合邏輯
       3. 日期沒有重複（無衝突）
       4. 請假類型有效
       
       返回驗證結果和清理後的數據。`,
      {
        label: 'DataCollector',
        phase: '數據收集',
        schema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            employee_id: { type: 'string' },
            employee_name: { type: 'string' },
            leave_type: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            days: { type: 'number' },
            reason: { type: 'string' },
            errors: { type: 'array' }
          }
        }
      }
    )
    
    if (!dataCollected.valid) {
      log(`❌ 數據驗證失敗：${dataCollected.errors.join(', ')}`)
      return {
        status: 'rejected',
        reason: `數據驗證失敗`,
        errors: dataCollected.errors
      }
    }
    
    // ========== Stage 2 & 3: 並行檢查（SyncAgg） ==========
    phase('並行檢查')
    log('並行執行政策檢查和法規檢查...')
    
    const [policyCheck, complianceCheck] = await Promise.all([
      // 政策檢查
      agent(
        `你是政策檢查官。檢查以下請假申請是否符合公司政策：
         
         員工：${dataCollected.employee_name}
         請假類型：${dataCollected.leave_type}
         天數：${dataCollected.days}
         日期：${dataCollected.start_date} 至 ${dataCollected.end_date}
         
         請檢查公司政策中的：
         1. 該假期類型的年度額度
         2. 該員工的已使用額度
         3. 提前通知要求（通常需提前 5 天）
         4. 是否有特殊限制
         
         返回：批准/拒絕、可用額度、不足時的差額。`,
        {
          label: 'PolicyValidator',
          phase: '並行檢查',
          schema: {
            type: 'object',
            properties: {
              approved: { type: 'boolean' },
              reason: { type: 'string' },
              quota_remaining: { type: 'number' },
              advance_notice_ok: { type: 'boolean' },
              notes: { type: 'object' }
            }
          }
        }
      ),
      
      // 法規檢查
      agent(
        `你是法規檢查官。驗證以下請假申請是否符合勞動法規：
         
         員工：${dataCollected.employee_name}
         位置：California（美國加州）
         請假類型：${dataCollected.leave_type}
         日期：${dataCollected.start_date} 至 ${dataCollected.end_date}
         
         請驗證：
         1. 該假期類型在該地區是否合法
         2. 是否涉及法定假期
         3. 是否滿足最小工作時長要求
         4. 是否有特殊法律保護（如生育假）
         
         返回：合規/不合規、相關法規、建議。`,
        {
          label: 'ComplianceChecker',
          phase: '並行檢查',
          schema: {
            type: 'object',
            properties: {
              approved: { type: 'boolean' },
              jurisdiction: { type: 'string' },
              legal_basis: { type: 'string' },
              conflicts: { type: 'array' },
              notes: { type: 'object' }
            }
          }
        }
      )
    ])
    
    logger.log(workflowId, '並行檢查完成', {
      policy_result: policyCheck,
      compliance_result: complianceCheck
    })
    
    // ========== Stage 4: 衝突檢測與分析（Adversarial） ==========
    const hasConflict = !policyCheck.approved || !complianceCheck.approved
    
    if (hasConflict) {
      log('⚠️ 發現衝突，進行對抗驗證...')
      
      phase('衝突分析')
      const reasonerResult = await agent(
        `你是衝突分析官（Reasoner）。兩個檢查官意見不一致：
         
         政策檢查官說：${JSON.stringify(policyCheck)}
         法規檢查官說：${JSON.stringify(complianceCheck)}
         
         請：
         1. 分析衝突根源
         2. 評估哪個檢查官的關注點更重要
         3. 生成 3 個可能的解決方案
         4. 提出最佳推薦方案
         5. 標註是否需要人工決策（管理層審核）
         
         返回完整的分析和建議。`,
        {
          label: 'Reasoner',
          phase: '衝突分析',
          schema: {
            type: 'object',
            properties: {
              conflict_type: { type: 'string' },
              root_cause: { type: 'string' },
              solutions: { type: 'array' },
              recommended: { type: 'object' },
              escalate_to_human: { type: 'boolean' },
              escalation_reason: { type: 'string' }
            }
          }
        }
      )
      
      if (reasonerResult.escalate_to_human) {
        log('🔔 升級給 HR 主任人工決策')
        return {
          status: 'pending_human_review',
          escalation_reason: reasonerResult.escalation_reason,
          reasoner_recommendation: reasonerResult
        }
      }
      
      // 採用 Reasoner 的建議方案
      log(`✅ 採用建議方案：${reasonerResult.recommended.action}`)
    } else {
      log('✅ 所有檢查通過，無衝突')
    }
    
    // ========== Stage 5: 計算假期 ==========
    phase('計算假期')
    const vacationCalc = await agent(
      `計算該員工的假期情況：
       
       員工：${dataCollected.employee_name}
       申請天數：${dataCollected.days}
       申請類型：${dataCollected.leave_type}
       
       基於公司紀錄，該員工：
       - 年度基本假期：20 天
       - 已使用：8 天
       - 結轉上年：2 天
       
       請計算：
       1. 批准後剩餘假期
       2. 假期在假期表中的分配
       3. 何時應更新系統
       
       返回計算詳情。`,
      {
        label: 'VacationCalculator',
        phase: '計算假期',
        schema: {
          type: 'object',
          properties: {
            quota_available: { type: 'number' },
            quota_used: { type: 'number' },
            quota_remaining: { type: 'number' },
            carryover_next_year: { type: 'number' }
          }
        }
      }
    )
    
    // ========== Stage 6: 執行批准 ==========
    phase('執行批准')
    const executor = await agent(
      `執行批准並更新所有系統。請求信息：
       
       ${JSON.stringify({
         employee: dataCollected.employee_name,
         days: dataCollected.days,
         dates: `${dataCollected.start_date} ~ ${dataCollected.end_date}`,
         remaining_after: vacationCalc.quota_remaining
       }, null, 2)}
       
       請執行以下操作：
       1. 更新 Google Sheets（審批狀態）
       2. 發送確認郵件給員工
       3. 發送提醒郵件給經理
       4. 更新 Google Calendar（休假日期）
       5. 記錄完整的審計日誌
       
       返回執行結果。`,
      {
        label: 'Executor',
        phase: '執行批准',
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            sheets_updated: { type: 'boolean' },
            emails_sent: { type: 'array' },
            calendar_updated: { type: 'boolean' },
            audit_log_id: { type: 'string' }
          }
        }
      }
    )
    
    // 記錄完整工作流日誌
    const duration = Date.now() - startTime
    logger.log(workflowId, '工作流完成', {
      duration_ms: duration,
      employee: dataCollected.employee_name,
      days: dataCollected.days,
      final_status: 'approved',
      stages_executed: 6
    })
    
    return {
      status: 'approved',
      workflow_id: workflowId,
      employee: dataCollected.employee_name,
      dates: { start: dataCollected.start_date, end: dataCollected.end_date },
      days: dataCollected.days,
      remaining_quota: vacationCalc.quota_remaining,
      duration_ms: duration,
      execution_result: executor
    }
    
  } catch (error) {
    logger.error(workflowId, '工作流執行失敗', {
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

// 輔助函數
function phase(name) {
  log(`\n═══ ${name} ═══`)
}

function getFormData(field) {
  // 從 Google Form 讀取數據（實現見 googleWorkspaceAPI.js）
  return googleWorkspaceAPI.getFormField(field)
}

export async function execute(params) {
  return await executeLeaveApproval()
}
```

---

## 最佳實踐

### 1. 清晰的 Phase 結構

✅ **好**：
```javascript
phase('數據收集')
phase('驗證')
phase('決策')
phase('執行')
```

❌ **不好**：
```javascript
// 沒有清晰的 phase 分隔
// 或 phase 數量過多（>10 個）
```

### 2. 充分的提示詞

✅ **好**：
```javascript
const result = await agent(
  `你是數據驗證官。你的任務是：
   1. 檢查以下數據的完整性
   2. 驗證日期邏輯
   3. 確保沒有重複
   
   數據：${JSON.stringify(data)}
   
   返回結果，包括是否有效和錯誤列表。`,
  { /* ... */ }
)
```

❌ **不好**：
```javascript
const result = await agent(`驗證數據`, { /* ... */ })
```

### 3. 結構化輸出

✅ **好**：
```javascript
schema: {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    reason: { type: 'string' },
    details: { type: 'object' }
  },
  required: ['approved', 'reason']
}
```

❌ **不好**：
```javascript
// 沒有 schema，輸出格式不確定
```

### 4. 充分的日誌記錄

✅ **好**：
```javascript
log(`✅ 數據驗證通過，共 ${count} 條記錄`)
log(`⚠️ 發現 ${warnings.length} 個警告`)
log(`❌ 執行失敗：${error.message}`)
logger.log(workflowId, '關鍵決策點', { decision, reason })
```

❌ **不好**：
```javascript
// 缺少日誌，難以調試
```

### 5. 錯誤處理

✅ **好**：
```javascript
try {
  const result = await agent(...)
  if (!result.valid) {
    log(`❌ 驗證失敗：${result.errors.join(', ')}`)
    return { status: 'failed', errors: result.errors }
  }
} catch (error) {
  logger.error(workflowId, '執行失敗', { error: error.message })
  throw error
}
```

❌ **不好**：
```javascript
// 沒有 try-catch，或錯誤消息不清楚
```

---

## 常見陷阱

### 陷阱 1：過於複雜的 Workflow

**問題**：一個 Workflow 做太多事情（>10 個 stage），難以維護

**解決**：拆分成多個 Workflow，使用 Nested 模式調用

```javascript
// ❌ 不好：一個 Workflow 做所有事情
// leave_approval.js（50+ 個 stage）

// ✅ 好：拆分成多個 Workflow
// leave_approval.js（6 個 stage）
//   ├─ check_policy.js（子 Workflow）
//   ├─ calculate_vacation.js（子 Workflow）
//   └─ send_notification.js（子 Workflow）
```

### 陷阱 2：不合理的 Promise.all 使用

**問題**：某些任務之間有依賴，但用 Promise.all 並行執行

**解決**：只在獨立任務間使用 Promise.all

```javascript
// ❌ 不好：calculateVacation 依賴 policyCheck 的結果
const [policyCheck, calcVacation] = await Promise.all([...])

// ✅ 好：順序執行
const policyCheck = await agent(...)
const calcVacation = await agent(
  `基於政策檢查結果（${policyCheck.approved}），計算假期...`
)
```

### 陷阱 3：Schema 設計不當

**問題**：Schema 過於寬鬆，導致輸出格式不一致

**解決**：明確定義必需欄位和類型

```javascript
// ❌ 不好
schema: {
  type: 'object',
  properties: { /* 很多可選欄位 */ }
}

// ✅ 好
schema: {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['approved', 'reason']
}
```

### 陷阱 4：沒有監控流程

**問題**：不知道 Workflow 執行的時間、Token 成本、失敗原因

**解決**：記錄每個 stage 的耗時、Token、API 調用

```javascript
// ✅ 好：記錄完整信息
const stageStart = Date.now()
const result = await agent(...)
logger.log(workflowId, stageName, {
  duration_ms: Date.now() - stageStart,
  tokens_used: result.usage?.total_tokens,
  api_calls: result.usage?.api_calls,
  status: result.status
})
```

---

## 調試和監控

### 本地調試

```bash
# 在 Claude Code 中運行
/run ./workflows/leave_approval.js

# 觀察控制台輸出
# 每個 phase 和 log 都會顯示
```

### 監控面板（`/workflows` 命令）

```bash
# 查看所有執行的 Workflow
/workflows status

# 查看特定 Workflow 的詳情
/workflows view <workflow_id>

# 查看實時執行進度
/workflows monitor leave_approval

# 查看性能統計
/workflows stats
```

### 審計日誌查詢

```bash
# 查看某員工的所有審批記錄
SELECT * FROM audit_logs WHERE employee_id = 'EMP001'

# 查看某日期的所有 Workflow
SELECT * FROM audit_logs WHERE DATE(timestamp) = '2026-06-05'

# 查看失敗的 Workflow
SELECT * FROM audit_logs WHERE status = 'failed'
```

---

## 下一步

✅ 已完成：架構設計、Workflow 編寫指南  
⏳ 待完成：
- 編寫完整的 leave_approval.js 實現
- 實現 Google Workspace API 集成
- 建立監控和日誌系統
- Phase 1 測試和驗證

---

**相關文檔**：
- [ARCHITECTURE.md](ARCHITECTURE.md) - 架構設計
- [API_REFERENCE.md](API_REFERENCE.md) - API 參考（待撰寫）
- [leave_approval.js](../src/workflows/leave_approval.js) - 完整實現（待撰寫）

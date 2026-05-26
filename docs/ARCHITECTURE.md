# v2.0 架構設計文檔

**版本**：v2.0-alpha  
**最後更新**：2026-05-26  
**狀態**：🚧 開發中

---

## 📐 整體架構

### 三層架構

```
┌─────────────────────────────────────────────────────────────┐
│                    表現層（Presentation）                     │
│         Google Forms / Sheets / Calendar / Gmail             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    業務層（Business Logic）                   │
│      Claude Code Workflow + Multi-Agent Orchestration        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 6 種執行模式                                         │    │
│  ├─ Pipeline：線性順序執行                             │    │
│  ├─ SyncAgg：並行 → 聚合                              │    │
│  ├─ Adversarial：對抗驗證                             │    │
│  ├─ Tail：篩選最優                                     │    │
│  ├─ Cumulative：逐步累積                              │    │
│  └─ Nested：Workflow 調用 Workflow                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 6 個 Agent 角色                                      │    │
│  ├─ DataCollector：數據收集與驗證                     │    │
│  ├─ PolicyValidator：公司政策檢查                     │    │
│  ├─ ComplianceChecker：法規合規檢查                   │    │
│  ├─ Reasoner：衝突分析與決策推理                      │    │
│  ├─ Executor：執行結果與通知                           │    │
│  └─ Logger：完整審計日誌                               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    數據層（Data Layer）                       │
│  Google Workspace API + Claude API + 知識庫                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 請假審批 Workflow 流程

### 完整流程圖

```
Start: 員工提交請假申請
       ↓
┌─────────────────────────────────────────┐
│ Stage 1：數據收集與驗證（Parallel）      │
├─ Task 1.1: 從 Google Form 收集數據      │
├─ Task 1.2: 驗證員工信息（完整性檢查）   │
├─ Task 1.3: 驗證日期有效性（無衝突）     │
└─ Task 1.4: 計算請假天數                 │
       ↓ 聚合結果
┌─────────────────────────────────────────┐
│ Stage 2：政策與法規檢查（Adversarial）   │
├─ Branch A: PolicyValidator              │
│  ├─ 檢查公司假期政策                    │
│  ├─ 驗證假期額度是否足夠                │
│  └─ 檢查請假時間是否符合提前通知要求    │
│                                         │
├─ Branch B: ComplianceChecker            │
│  ├─ 檢查勞動法規（地區相關）            │
│  ├─ 驗證假期類型（帶薪/無薪/特殊）      │
│  └─ 檢查法定假期衝突                    │
│                                         │
└─ 對抗驗證：若衝突 → 升級決策層           │
       ↓
┌─────────────────────────────────────────┐
│ Decision: 發現衝突？                     │
├─ YES → Stage 2.1: Reasoner 衝突分析     │
│  ├─ 分析衝突根源                        │
│  ├─ 生成調整方案（縮短天數/改期等）    │
│  └─ 升級給 HR 主任人工決策               │
│                                         │
└─ NO → 繼續到 Stage 3                    │
       ↓
┌─────────────────────────────────────────┐
│ Stage 3：假期計算與建議（SyncAgg）       │
├─ Task 3.1: 計算剩餘假期                 │
├─ Task 3.2: 生成日程提醒                 │
├─ Task 3.3: 生成批准建議                 │
└─ Task 3.4: 準備通知內容                 │
       ↓
┌─────────────────────────────────────────┐
│ Stage 4：執行與通知（Parallel）          │
├─ Task 4.1: 更新 Google Sheets 審批狀態  │
├─ Task 4.2: 發送郵件通知員工              │
├─ Task 4.3: 發送郵件通知主管              │
├─ Task 4.4: 更新 Google Calendar          │
└─ Task 4.5: 記錄審計日誌                 │
       ↓
End: 審批流程完成
```

---

## 🎬 6 種執行模式詳解

### 1. Pipeline（線性管道）
**使用場景**：步驟必須順序執行，前一步結果是後一步輸入

```
Stage 1 → Stage 2 → Stage 3 → Stage 4
(收集) → (檢查) → (計算) → (執行)
```

**請假流程中**：用於整體流程串聯

---

### 2. SyncAgg（同步聚合）
**使用場景**：多個任務並行執行，最後聚合結果

```
Task A ┐
Task B ├─→ Aggregator → 結果
Task C ┘
```

**請假流程中**：Stage 1 和 Stage 3、Stage 4 使用此模式

---

### 3. Adversarial（對抗驗證）
**使用場景**：兩個相反角色互相驗證，發現衝突

```
PolicyValidator ──┐
                 ├─→ ConflictDetector → 決策
ComplianceChecker┘
```

**請假流程中**：Stage 2 使用此模式（政策檢查 vs 法規檢查）

---

### 4. Tail（篩選最優）
**使用場景**：多個 Agent 生成多個方案，選最優

```
Agent A → Plan A ┐
Agent B → Plan B ├─→ Selector → 最優方案
Agent C → Plan C ┘
```

**請假流程中**：衝突解決時，生成多個調整方案並選最優

---

### 5. Cumulative（逐步累積）
**使用場景**：信息逐步累積，每步都加強結果

```
Data 1 ──────┐
Data 2 ──┬──┤
Data 3 ──┼──├─→ 累積結果
Data 4 ──┘  │
...         ┘
```

**請假流程中**：月度假期累計、歷史審批記錄累積

---

### 6. Nested（嵌套調用）
**使用場景**：Workflow 調用其他 Workflow

```
leave_approval.js
    ├─ 內部調用 check_policy.js
    ├─ 內部調用 calculate_vacation.js
    └─ 內部調用 send_notification.js
```

**請假流程中**：主 Workflow 調用子 Workflow 實現模塊化

---

## 🤖 6 個 Agent 角色詳解

### 1. DataCollector（數據收集官）
**責任**：
- 從 Google Form 收集原始數據
- 驗證數據完整性和有效性
- 補充缺失信息（員工檔案、日程等）
- 數據清洗和規範化

**使用的 AI 模型**：Claude Haiku（輕量級）

**輸出**：
```json
{
  "employee_id": "EMP001",
  "employee_name": "Johnson",
  "leave_type": "vacation",
  "start_date": "2026-06-10",
  "end_date": "2026-06-14",
  "days": 5,
  "reason": "Summer vacation",
  "status": "collected_and_validated"
}
```

---

### 2. PolicyValidator（政策檢查官）
**責任**：
- 查詢公司假期政策（從 NotebookLM 知識庫）
- 檢查員工假期額度
- 驗證請假時間提前通知要求
- 檢查特殊假期限制（懷孕假、緊急假等）

**使用的 AI 模型**：Claude Sonnet（複雜推理）

**輸出**：
```json
{
  "policy_check": {
    "vacation_quota": { "total": 20, "used": 8, "remaining": 12 },
    "requested_days": 5,
    "sufficient_quota": true,
    "advance_notice": true,
    "special_conditions": null,
    "policy_approved": true
  }
}
```

---

### 3. ComplianceChecker（法規檢查官）
**責任**：
- 驗證勞動法規合規性（地區相關）
- 檢查假期類型符合法定要求
- 驗證法定假期日期
- 檢查是否違反最少工作時長

**使用的 AI 模型**：Claude Sonnet（複雜推理）

**輸出**：
```json
{
  "compliance_check": {
    "jurisdiction": "California",
    "leave_type_legal": true,
    "no_holiday_conflict": true,
    "min_work_time_ok": true,
    "compliance_approved": true
  }
}
```

---

### 4. Reasoner（決策推理官）
**責任**：
- 當 Policy 和 Compliance 有衝突時介入
- 分析衝突根源
- 生成調整方案
- 提出人工決策建議

**使用的 AI 模型**：Claude Opus（最強推理）

**觸發條件**：
```javascript
if (!policy_approved || !compliance_approved) {
  await reasoner.analyzeConflict(policy_result, compliance_result)
}
```

**輸出**：
```json
{
  "conflict": {
    "type": "insufficient_advance_notice",
    "reason": "Request submitted 3 days before, company policy requires 5 days",
    "resolution_options": [
      {
        "option": 1,
        "action": "Delay leave to 2026-06-12 (7 days notice)",
        "impact": "Employee can take full 5-day leave"
      },
      {
        "option": 2,
        "action": "Reduce leave to 3 days (2026-06-10 to 2026-06-12)",
        "impact": "Approved without manager override"
      }
    ],
    "recommendation": "Option 1 - delay is better for employee"
  }
}
```

---

### 5. Executor（執行官）
**責任**：
- 批准或拒絕請假申請
- 更新 Google Sheets 系統
- 發送郵件通知
- 更新 Google Calendar
- 執行審計日誌

**使用的 AI 模型**：無（純執行層）

**執行步驟**：
```
1. 更新 Sheets（審批狀態）
2. 發送郵件（員工 + 主管）
3. 更新 Calendar（休假日期）
4. 記錄日誌（完整審計跟蹤）
```

---

### 6. Logger（審計官）
**責任**：
- 記錄每個 Stage 的執行時間
- 記錄 Token 消耗
- 記錄 API 調用
- 追蹤衝突和解決方案
- 生成完整審計報告

**日誌包含**：
```json
{
  "workflow_id": "leave_approval_001",
  "timestamp": "2026-05-26T10:30:00Z",
  "stages": [
    {
      "stage": 1,
      "duration_ms": 1250,
      "tokens_used": 1500,
      "api_calls": 3,
      "status": "completed"
    },
    ...
  ],
  "total_duration_ms": 5800,
  "total_tokens": 8300,
  "approval_decision": "approved",
  "escalations": 0
}
```

---

## 📊 版本對比

### v1.0 vs v2.0

| 維度 | v1.0 MVP | v2.0 Workflow |
|------|----------|---------------|
| **代碼組織** | 單一 Code.gs（850 行） | 多個 JS 文件（结构化） |
| **並行能力** | 有限（順序為主） | 原生支持 6 種模式 |
| **Agent 角色** | 隱含在代碼中 | 明確的 6 個 Agent |
| **可觀測性** | 基礎日誌 | `/workflows` 完整監控 |
| **可測試性** | 低（深度耦合） | 高（模塊化） |
| **複用性** | 低 | 高（跨部門） |
| **擴展性** | 困難 | 容易（新增 Workflow） |
| **企業級特性** | 無 | 審計日誌、衝突管理 |
| **適配規模** | 小企業（<50 人） | 中大企業（500+） |
| **維護成本** | 高 | 低（明確分工） |

---

## 🔌 與 Google Workspace 的集成點

```
Google Forms (輸入層)
  ↓
  ├─ 表單提交 → 觸發 Workflow
  └─ 存儲原始數據

Google Sheets (數據層)
  ├─ 員工檔案表
  ├─ 假期額度表
  ├─ 審批記錄表
  └─ 審計日誌表

Google Calendar (日程層)
  ├─ 員工休假日期
  ├─ 經理日程提醒
  └─ HR 工作日程

Gmail (通知層)
  ├─ 員工確認郵件
  ├─ 經理批准邀請
  └─ HR 異常告警
```

---

## 🚀 與 Claude API 的集成

### 使用的模型

| 任務 | 模型 | 原因 |
|------|------|------|
| 數據驗證 | Claude Haiku | 輕量、快速、成本低 |
| 政策檢查 | Claude Sonnet | 平衡推理能力和成本 |
| 法規檢查 | Claude Sonnet | 複雜規則推理 |
| 衝突決策 | Claude Opus | 最強推理能力 |

### API 調用模式

```javascript
// 批量調用優化
const results = await Promise.all([
  clauindexde.messages.create({...}),  // PolicyValidator
  claude.messages.create({...}),  // ComplianceChecker
])

// 動態模型選擇
const model = isComplexDecision ? "claude-opus" : "claude-sonnet"
```

---

## 📈 性能指標目標

### Phase 1 目標（2026-06-07）

| 指標 | 目標 | 備註 |
|------|------|------|
| **整體耗時** | <30 秒 | 端到端 |
| **Stage 1** | <3 秒 | 數據收集 |
| **Stage 2** | <10 秒 | 政策檢查（對抗驗證） |
| **Stage 3** | <5 秒 | 計算和建議 |
| **Stage 4** | <5 秒 | 執行和通知 |
| **Token 成本** | <10k tokens | 單次流程 |
| **可靠性** | 99.9% | 成功率 |
| **審計覆蓋** | 100% | 所有操作可追蹤 |

---

## 🔐 安全與合規

### 數據隱私
- 所有員工個人信息加密存儲
- API 調用使用環境變量（不硬編碼密鑰）
- 日誌中敏感信息脫敏

### 審計跟蹤
- 每個決策都有完整日誌
- 何人、何時、為何決策的記錄
- 支持合規審計和糾紛調查

### 存取控制
- 只有 HR 和管理層可訪問
- 員工只能看到自己的申請
- 系統管理員審計日誌

---

## 📅 階段性目標

### Phase 1（06-01 ~ 06-07）✅ 當前
- ✅ 驗證 Workflow 架構
- ✅ 編寫首個 leave_approval.js 腳本
- ✅ 實現與 Google Workspace 的基本集成
- ✅ 建立監控和日誌系統

### Phase 2（06-08 ~ 06-21）⏳
- 完整的請假審批測試
- 衝突管理和人工決策流程
- 性能優化

### Phase 3（06-22 ~ 07-05）⏳
- 報銷申請 Workflow
- 培訓請求 Workflow
- 多個 Workflow 的複用和集成

---

**下一文檔**：[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - 詳細的 Workflow 編寫指南

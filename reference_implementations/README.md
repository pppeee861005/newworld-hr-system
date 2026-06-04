---
name: reference-implementations-guide
title: 📚 參考實現 — 代碼示範和最佳實踐
description: 3 個核心場景的 JavaScript 參考實現和代碼說明
date: 2026-06-04
---

# 📚 參考實現 — 代碼示範和最佳實踐

**版本**：1.0
**發佈日期**：2026-06-04
**語言**：JavaScript（Node.js / Google Apps Script）

---

## 🎯 本目錄的目的

此目錄包含 3 個核心 HR 場景的 **JavaScript 參考實現代碼**。

### 這些代碼的角色

```
定義書（業務邏輯）
    ↓
參考實現代碼（一種可能的實現方式）
    ↓
你可以：
  ✅ 學習如何實現業務規則
  ✅ 基於此代碼進行修改
  ✅ 用其他語言（Python/Go）重新實現
  ✅ 複製到你的項目中
```

### 重要提醒

```
⚠️ 「參考」不是「生產級代碼」

這些代碼是示範性的，展示：
  - 決策規則的實現方式
  - 輸入驗證的邏輯
  - 異常處理的做法

在實際部署前，請：
  1️⃣ 根據企業需求調整
  2️⃣ 進行安全審查（特別是權限控制）
  3️⃣ 添加企業特定的集成邏輯
  4️⃣ 進行充分的測試
```

---

## 📁 文件清單

```
reference_implementations/
├── README.md                              ← 你在這裡
│
├── leave_approval_reference.js            ← 請假審批工作流
│   ├─ 場景 1：請假申請和審批
│   ├─ 決策規則：額度檢查、審批路徑、自動批准
│   └─ 大小：~17 KB，~500 行代碼
│
├── expense_report_reference.js            ← 報銷申請工作流
│   ├─ 場景 2：報銷申請和審批
│   ├─ 決策規則：收據驗證、預算檢查、多級審批
│   └─ 大小：~5 KB，~150 行代碼
│
├── training_request_reference.js          ← 培訓申請工作流
│   ├─ 場景 3：培訓申請和管理
│   ├─ 決策規則：資格檢查、預算監控、效果追蹤
│   └─ 大小：~7 KB，~210 行代碼
│
└── 說明文檔
    └─ 見下方
```

---

## 🎓 如何使用這些代碼

### 使用者類型 1：我想學習如何實現業務規則

**步驟**：

```
1️⃣ 打開定義書
   計劃1_企業HR自動化定義書.md
   ↓
   理解「場景 1：請假審批」的決策規則

2️⃣ 打開參考代碼
   leave_approval_reference.js
   ↓
   看代碼如何實現規則

3️⃣ 對比理解
   定義書的規則 ↔ 代碼的實現
   ↓
   理解映射關係

4️⃣ 學習要點
   □ 決策規則如何在代碼中表示
   □ 輸入驗證的做法
   □ 異常處理的方式
   □ 邏輯流程的組織
```

**關鍵部分**：

```javascript
// Rule 1：額度檢查
function checkLeaveBalance(employeeId, leaveType, dayCount) {
  const balance = getEmployeeBalance(employeeId, leaveType)
  return {
    sufficient: balance >= dayCount,
    remaining: balance - dayCount,
    message: balance >= dayCount ? '額度充足' : '額度不足'
  }
}

// Rule 2：審批路徑確定
function determineApprovalPath(dayCount, employeeRecord) {
  if (dayCount <= 2) return ['DirectManager']
  if (dayCount <= 5) return ['DirectManager', 'DepartmentHead']
  return ['DirectManager', 'DepartmentHead', 'HR']
}

// Rule 3：自動批准決策
function shouldAutoApprove(employeeRecord, dayCount) {
  return employeeRecord === 'excellent' && dayCount <= 2
}
```

### 使用者類型 2：我想基於此代碼修改

**步驟**：

```
1️⃣ 複製代碼到你的項目
   cp leave_approval_reference.js ../src/workflows/

2️⃣ 識別需要修改的地方
   □ 額度常數
   □ 審批層級
   □ 決策邏輯
   □ 集成接口

3️⃣ 進行修改
   修改配置參數（數字）
   修改決策邏輯（if/else）
   添加企業特定的檢查

4️⃣ 測試修改
   用測試用例驗證邏輯
   確保修改符合定義書

5️⃣ 部署和集成
   集成到 Google Sheets / 企業系統
   進行充分測試後上線
```

### 使用者類型 3：我想用其他語言重新實現

**步驟**：

```
1️⃣ 深入理解業務邏輯
   讀定義書 → 讀 JavaScript 代碼
   ↓
   完全理解所有決策規則

2️⃣ 用你熟悉的語言重新寫
   Python：
     def check_leave_balance(employee_id, leave_type, day_count):
       ...

   Go：
     func checkLeaveBalance(employeeId, leaveType, dayCount) {...}

   Rust：
     fn check_leave_balance(...) -> LeaveCheckResult {...}

3️⃣ 確保邏輯完全一致
   每條規則都要對應實現
   輸入輸出格式要一致

4️⃣ 測試和驗證
   用同樣的測試用例
   確保結果完全相同

5️⃣ 提交到社群
   分享你的實現
   幫助其他人選擇語言
```

---

## 🔍 每個場景的代碼構成

### 場景 1：leave_approval_reference.js

**關鍵函數**：

```javascript
// 主函數
async executeLeaveApproval(params) {
  // Stage 1：數據收集和驗證
  // Stage 2：並行檢查（額度、政策）
  // Stage 3：對抗驗證（衝突檢測）
  // Stage 4：計算和決策
  // Stage 5：執行和通知
}

// 決策規則實現
checkLeaveBalance() {}        // Rule 1：額度檢查
determineApprovalPath() {}    // Rule 2：審批路徑
checkAutoApproval() {}        // Rule 3：自動批准
sendNotifications() {}        // Rule 4：通知機制
```

**代碼難度**：⭐⭐⭐ 中等

**學習重點**：
- 如何實現多級決策規則
- 如何處理並行檢查
- 如何檢測和解決衝突
- 如何集成多個系統

### 場景 2：expense_report_reference.js

**關鍵函數**：

```javascript
// 主函數
async executeExpenseApproval(params) {
  // 收據驗證
  // 金額檢查
  // 預算監控
  // 審批路由
  // 財務系統推送
}

// 決策規則實現
validateReceipts() {}         // Rule 1：收據合規性
checkAmountLimits() {}        // Rule 2：金額限額
checkBudget() {}              // Rule 3：預算檢查
routeApproval() {}            // Rule 4：審批路由
generatePaymentOrder() {}     // Rule 5：生成付款指令
```

**代碼難度**：⭐⭐ 簡單

**學習重點**：
- 如何驗證多種輸入格式
- 如何實現級聯檢查
- 如何與財務系統集成
- 如何追蹤審批狀態

### 場景 3：training_request_reference.js

**關鍵函數**：

```javascript
// 主函數
async executeTrainingApproval(params) {
  // 資格檢查
  // 預算檢查
  // 審批流程
  // 日程管理
  // 效果追蹤
}

// 決策規則實現
checkEligibility() {}         // Rule 1：資格檢查
checkTrainingBudget() {}      // Rule 2：預算檢查
routeByLevel() {}             // Rule 3：按級別路由
scheduleReminders() {}        // Rule 4：日程提醒
collectFeedback() {}          // Rule 5：效果追蹤
```

**代碼難度**：⭐⭐⭐ 中等

**學習重點**：
- 如何實現多維度資格檢查
- 如何進行複雜的預算計算
- 如何自動化日程管理
- 如何收集和分析反饋

---

## 📝 代碼質量說明

### ✅ 這些代碼的優勢

```
✓ 邏輯清晰
  - 每個決策規則都單獨實現
  - 函數職責明確
  - 易於理解和修改

✓ 有充分註解
  - 中文註解解釋業務邏輯
  - 代碼塊標題清晰
  - 決策樹明確

✓ 有完整的錯誤處理
  - 輸入驗證完善
  - 邊界情況有覆蓋
  - 異常情況有備案

✓ 易於擴展
  - 參數化設計
  - 易於添加新規則
  - 易於修改現有規則
```

### ⚠️ 這些代碼的限制

```
⚠ 這是示範代碼，不是生產級代碼

在以下方面可能需要加強：

✗ 安全性
  - 沒有企業級的權限控制
  - 沒有加密敏感信息
  - 需要進行安全審查

✗ 性能
  - 沒有緩存機制
  - 沒有批量處理優化
  - 需要進行性能測試

✗ 可靠性
  - 沒有重試機制
  - 沒有超時控制
  - 需要進行生產驗證

✗ 監控
  - 日誌記錄較簡單
  - 沒有性能指標
  - 需要添加監控告警
```

---

## 🚀 如何在企業中使用

### 部署方案 A：Google Apps Script（最簡單）

```javascript
// 1️⃣ 複製代碼到 Google Apps Script 編輯器
// 2️⃣ 適配 Google Sheets API

// 修改示例：
const sheet = SpreadsheetApp.getActiveSheet()
const employee = sheet.getRange('A2:E100').getValues()

// 3️⃣ 設置觸發器
function onFormSubmit(e) {
  executeLeaveApproval(e.response)
}

// 4️⃣ 部署
```

### 部署方案 B：Node.js（更靈活）

```bash
# 1️⃣ 創建項目
mkdir hr-workflow
cd hr-workflow

# 2️⃣ 複製代碼
cp ../reference_implementations/*.js src/

# 3️⃣ 安裝依賴
npm install express axios dotenv

# 4️⃣ 創建 API 服務器
# src/server.js

# 5️⃣ 運行
npm start
```

### 部署方案 C：企業內網（最安全）

```
1️⃣ 代碼通過企業 IT 審核
2️⃣ 部署在企業內部服務器
3️⃣ 集成企業 Active Directory / SSO
4️⃣ 連接企業系統（HR、財務、郵件等）
5️⃣ 進行完全測試後上線
```

---

## ✅ 部署前檢查清單

在將參考代碼部署到企業環境前，確保完成以下項目：

- [ ] **代碼審查**
  - [ ] 邏輯是否符合定義書？
  - [ ] 是否有明顯的安全漏洞？
  - [ ] 是否需要修改來適應企業現況？

- [ ] **安全性審查**
  - [ ] 是否需要添加權限控制？
  - [ ] 敏感信息是否需要加密？
  - [ ] 是否有日誌記錄敏感操作？

- [ ] **測試**
  - [ ] 單元測試通過？
  - [ ] 集成測試通過？
  - [ ] 邊界情況和異常情況都測試了？
  - [ ] 性能測試達到要求？

- [ ] **文檔**
  - [ ] 代碼文檔完整？
  - [ ] 部署文檔完整？
  - [ ] 故障排查指南完整？

- [ ] **監控準備**
  - [ ] 是否有日誌收集機制？
  - [ ] 是否有告警規則設置？
  - [ ] 是否有運維文檔？

---

## 🤝 貢獻指南

如果你基於參考代碼進行了改進或優化，歡迎貢獻：

### 提交改進的代碼

```
1️⃣ Fork 此倉庫

2️⃣ 基於參考實現創建新版本
   例：leave_approval_extended.js
       expense_report_optimized.js

3️⃣ 在代碼中清楚地說明改進
   // 基於 leave_approval_reference.js 改進
   // 新增功能：支持遠程辦公的假期計算
   // 改進日期：2026-06-15
   // 作者：[你的名字]

4️⃣ 提交 PR，說明：
   - 改進的內容
   - 修改的原因
   - 測試結果
   - 適用場景

5️⃣ 社群審查和反饋
   → 可能被合併到主倉庫
   → 你的名字被添加到貢獻者名單
```

### 提交多語言實現

```
1️⃣ 用你熟悉的語言重新實現
   leave_approval_python.py
   leave_approval_go.go
   leave_approval_rust.rs
   leave_approval_csharp.cs

2️⃣ 確保邏輯完全一致
   用相同的測試用例驗證
   結果應該完全相同

3️⃣ 提交 PR，說明：
   - 使用的語言和版本
   - 框架和依賴
   - 部署方式
   - 測試結果

4️⃣ 社群審查
   → 如果通過，添加到多語言實現列表
```

---

## 📚 相關文檔

| 文檔 | 內容 |
|------|------|
| **計劃1_企業HR自動化定義書.md** | 業務邏輯和決策規則 |
| **計劃1_如何用Claude Code自動生成Workflow.md** | 自動生成教學 |
| **notes/與定義書的映射.md** | 代碼和定義書的對應關係 |
| **notes/為什麼採用這個架構.md** | 架構設計決策 |

---

## 🎯 學習路徑建議

### 路徑 1：快速瀏覽（30 分鐘）
```
1. 讀 README（本文件）   ← 現在
2. 掃一遍代碼結構
3. 理解主要函數
```

### 路徑 2：深入學習（2 小時）
```
1. 讀定義書（理解業務邏輯）
2. 讀參考代碼（理解實現方式）
3. 對比理解（映射關係）
4. 嘗試修改小部分
5. 自己重新寫一遍簡化版本
```

### 路徑 3：完整掌握（4-6 小時）
```
1. 完整學習路徑 2
2. 詳細代碼審查
3. 安全和性能審查
4. 自己進行改進或優化
5. 基於此代碼創建企業版本
6. 提交社群或內部發佈
```

---

## 📞 問題和支持

- **有代碼問題？** → 查看代碼中的註解
- **不理解邏輯？** → 看定義書中的決策規則
- **想修改代碼？** → 先改定義書再改代碼
- **想提交改進？** → 見「貢獻指南」部分

---

**下一步**：打開某個參考代碼文件（例如 `leave_approval_reference.js`），開始學習！


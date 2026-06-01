# 腳本開發所需文件清單

**項目名稱**：新世界 HR 系統 v2.0
**最後更新**：2026-06-01
**文件總數**：38 個（已完成 8 個，待建立 30 個）

---

## 📊 文件狀態概覽

| 類別 | 已完成 | 待建立 | 總計 | 完成率 |
|------|--------|--------|------|--------|
| **核心文檔** | 3 | 0 | 3 | 100% |
| **管理文檔** | 3 | 1 | 4 | 75% |
| **技術文檔** | 2 | 4 | 6 | 33% |
| **核心 Workflow** | 1 | 0 | 1 | 100% |
| **子 Workflow** | 0 | 2 | 2 | 0% |
| **工具函數** | 0 | 3 | 3 | 0% |
| **測試文件** | 0 | 6 | 6 | 0% |
| **配置文件** | 0 | 4 | 4 | 0% |
| **擴展 Workflow** | 0 | 3 | 3 | 0% |
| **部署文件** | 0 | 3 | 3 | 0% |
| **其他** | 0 | 3 | 3 | 0% |
| **總計** | **9** | **29** | **38** | **24%** |

---

## 🔴 A 類：核心文檔（必需，已完成）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `README.md` | ✅ 完成 | P0 | 項目說明書 |
| `docs/ARCHITECTURE.md` | ✅ 完成 | P0 | 架構設計文檔（488行） |
| `docs/WORKFLOW_GUIDE.md` | ✅ 完成 | P0 | Workflow 編寫指南（911行） |

---

## 🟡 B 類：管理文檔（已完成 3/4）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `DEVELOPMENT_PROGRESS.md` | ✅ 完成 | P0 | 開發進度表 |
| `DEVELOPMENT_BUDGET.md` | ✅ 完成 | P0 | 開發預算表（200 單位） |
| `ENTERPRISE_DEPLOYMENT_BUDGET.md` | ✅ 完成 | P1 | 企業落地預算（三種規模） |
| `CHANGELOG.md` | ❌ 待建立 | P1 | 版本變更日誌 |

---

## 🔴 C 類：技術文檔（必需，待完成）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `docs/DEPLOYMENT.md` | ❌ 待建立 | P0 | 部署指南（如何安裝和配置） |
| `docs/API_REFERENCE.md` | ❌ 待建立 | P1 | API 參考文檔 |
| `docs/BEST_PRACTICES.md` | ❌ 待建立 | P1 | 最佳實踐指南 |
| `docs/MIGRATION_GUIDE.md` | ❌ 待建立 | P2 | v1 → v2 遷移指南 |
| `docs/TROUBLESHOOTING.md` | ❌ 待建立 | P2 | 故障排除指南 |
| `docs/CONTRIBUTING.md` | ❌ 待建立 | P2 | 貢獻指南 |

---

## 🟢 D 類：核心 Workflow（已完成）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `src/workflows/leave_approval.js` | ✅ 完成 | P0 | 請假審批主 Workflow（480行） |

---

## 🔴 E 類：子 Workflow（必需，待建立）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `src/workflows/checkPolicy.js` | ❌ 待建立 | P0 | 政策檢查子 Workflow |
| `src/workflows/checkCompliance.js` | ❌ 待建立 | P0 | 法規檢查子 Workflow |

**預估工作量**：每個 100-150 行，共 2-3 小時

---

## 🔴 F 類：工具函數（必需，阻塞項）⚠️

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `src/utils/googleWorkspaceAPI.js` | ❌ 待建立 | P0 | Google Workspace API 封裝 |
| `src/utils/logger.js` | ❌ 待建立 | P0 | 日誌系統 |
| `src/utils/claudeAPI.js` | ❌ 待建立 | P1 | Claude API 封裝（可選） |

**預估工作量**：3-4 小時
**注意**：這些是 **阻塞項**，沒有它們無法測試 leave_approval.js

---

## 🟡 G 類：測試文件（待建立）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `tests/unit/leave_approval.test.js` | ❌ 待建立 | P0 | leave_approval 單元測試 |
| `tests/unit/utils.test.js` | ❌ 待建立 | P1 | 工具函數單元測試 |
| `tests/integration/workflow.test.js` | ❌ 待建立 | P1 | Workflow 整合測試 |
| `tests/integration/google_api.test.js` | ❌ 待建立 | P1 | Google API 整合測試 |
| `tests/e2e/leave_approval.e2e.test.js` | ❌ 待建立 | P2 | 端到端測試 |
| `tests/fixtures/sample_data.json` | ❌ 待建立 | P1 | 測試數據 |

**預估工作量**：4-6 小時

---

## 🟡 H 類：配置文件（待建立）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `.env.example` | ❌ 待建立 | P0 | 環境變量範本 |
| `.env` | ❌ 待建立 | P0 | 環境變量（本地，不提交 Git） |
| `package.json` | ❌ 待建立 | P0 | Node.js 項目配置 |
| `.gitignore` | ❌ 待建立 | P0 | Git 忽略文件清單 |

**預估工作量**：30 分鐘

---

## 🟢 I 類：擴展 Workflow（Phase 3）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `src/workflows/expense_report.js` | ❌ 待建立 | P2 | 報銷申請 Workflow |
| `src/workflows/training_request.js` | ❌ 待建立 | P2 | 培訓申請 Workflow |
| `src/workflows/department_transfer.js` | ❌ 待建立 | P2 | 部門調動 Workflow |

**預估工作量**：每個 4-6 小時（Phase 3 才開始）

---

## 🟢 J 類：部署文件（Phase 4-5）

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `Dockerfile` | ❌ 待建立 | P2 | Docker 容器配置 |
| `docker-compose.yml` | ❌ 待建立 | P2 | Docker Compose 配置 |
| `deploy.sh` | ❌ 待建立 | P2 | 部署腳本 |

**預估工作量**：2-3 小時（Phase 4-5）

---

## 🟢 K 類：其他文件

| 文件名 | 狀態 | 優先級 | 說明 |
|--------|------|--------|------|
| `LICENSE` | ❌ 待建立 | P1 | 開源許可證（MIT） |
| `CODE_OF_CONDUCT.md` | ❌ 待建立 | P2 | 行為準則 |
| `.github/ISSUE_TEMPLATE.md` | ❌ 待建立 | P2 | Issue 範本 |

**預估工作量**：1 小時

---

## 📅 按 Phase 組織的開發清單

### Phase 1（本週：06-01 ~ 06-07）

#### 🔴 P0：立即建立（今天）
- [ ] `src/utils/googleWorkspaceAPI.js`（工具函數）
- [ ] `src/utils/logger.js`（工具函數）
- [ ] `.env.example`（配置範本）
- [ ] `.env`（本地配置）
- [ ] `package.json`（項目配置）
- [ ] `.gitignore`（Git 配置）

#### 🟡 P1：本週完成
- [ ] `src/workflows/checkPolicy.js`（子 Workflow）
- [ ] `src/workflows/checkCompliance.js`（子 Workflow）
- [ ] `tests/unit/leave_approval.test.js`（單元測試）
- [ ] `docs/DEPLOYMENT.md`（部署指南）
- [ ] `CHANGELOG.md`（版本日誌）

#### 🟢 P2：Phase 1 結束前
- [ ] `tests/integration/workflow.test.js`（整合測試）
- [ ] `docs/API_REFERENCE.md`（API 參考）
- [ ] `docs/BEST_PRACTICES.md`（最佳實踐）

---

### Phase 2（06-08 ~ 06-21）

- [ ] 完善 `leave_approval.js`（根據測試結果優化）
- [ ] `src/utils/claudeAPI.js`（如需要）
- [ ] `tests/unit/utils.test.js`（工具測試）
- [ ] `tests/integration/google_api.test.js`（API 測試）
- [ ] `tests/fixtures/sample_data.json`（測試數據）

---

### Phase 3（06-22 ~ 07-05）

- [ ] `src/workflows/expense_report.js`（報銷 Workflow）
- [ ] `src/workflows/training_request.js`（培訓 Workflow）
- [ ] `src/workflows/department_transfer.js`（調動 Workflow）
- [ ] `workflows/templates/workflow_template.js`（範本）

---

### Phase 4（07-06 ~ 07-12）

- [ ] `tests/e2e/leave_approval.e2e.test.js`（端到端測試）
- [ ] `docs/TROUBLESHOOTING.md`（故障排除）
- [ ] `Dockerfile`（容器化）
- [ ] `docker-compose.yml`（容器編排）

---

### Phase 5（07-13 ~ 07-19）

- [ ] `docs/MIGRATION_GUIDE.md`（遷移指南）
- [ ] `docs/CONTRIBUTING.md`（貢獻指南）
- [ ] `LICENSE`（許可證）
- [ ] `CODE_OF_CONDUCT.md`（行為準則）
- [ ] `.github/ISSUE_TEMPLATE.md`（Issue 範本）
- [ ] `deploy.sh`（部署腳本）

---

## 📊 優先級定義

| 優先級 | 說明 | 時間要求 |
|--------|------|----------|
| **P0** | 阻塞項，必須立即完成 | 今天 |
| **P1** | 重要，本週內完成 | 本週 |
| **P2** | 次要，可延後到下個 Phase | 下週+ |

---

## 🎯 快速行動清單（今天必做）

### 第一批：配置文件（30 分鐘）
1. [ ] `.env.example`
2. [ ] `.gitignore`
3. [ ] `package.json`

### 第二批：工具函數（3-4 小時）
4. [ ] `src/utils/logger.js`
5. [ ] `src/utils/googleWorkspaceAPI.js`
6. [ ] `src/utils/claudeAPI.js`（可選）

### 第三批：子 Workflow（2-3 小時）
7. [ ] `src/workflows/checkPolicy.js`
8. [ ] `src/workflows/checkCompliance.js`

### 第四批：測試（1-2 小時）
9. [ ] `tests/unit/leave_approval.test.js`（基礎版本）

### 第五批：文檔（1 小時）
10. [ ] `docs/DEPLOYMENT.md`（基礎版本）

---

## 📈 完成度追蹤

### 今日目標（06-01）
- [ ] 完成 6 個 P0 文件（配置 + 工具函數）
- [ ] 完成 2 個子 Workflow
- [ ] 完成 1 個測試文件
- [ ] 完成 1 個部署文檔

**目標完成度**：24% → 50%（新增 10 個文件）

### 本週目標（06-01 ~ 06-07）
**目標完成度**：24% → 65%（新增 15 個文件）

### Phase 1 結束（06-07）
**目標完成度**：65% → 75%（新增 4 個文件）

---

## 🔄 文件依賴關係

```
leave_approval.js (已完成)
    ↓ 依賴
├─ googleWorkspaceAPI.js (P0 阻塞)
├─ logger.js (P0 阻塞)
├─ checkPolicy.js (P1)
└─ checkCompliance.js (P1)

測試文件
    ↓ 依賴
├─ leave_approval.js (已完成)
├─ 工具函數 (P0)
└─ sample_data.json (P1)

部署
    ↓ 依賴
├─ .env.example (P0)
├─ package.json (P0)
└─ DEPLOYMENT.md (P1)
```

---

## 💡 開發建議

### 按順序建立（避免阻塞）
1. **先配置**：`.env.example`、`package.json`、`.gitignore`
2. **再工具**：`logger.js`、`googleWorkspaceAPI.js`
3. **後 Workflow**：`checkPolicy.js`、`checkCompliance.js`
4. **最後測試**：`leave_approval.test.js`

### 並行開發（如有多人）
- **人員 A**：工具函數（`logger.js`、`googleWorkspaceAPI.js`）
- **人員 B**：子 Workflow（`checkPolicy.js`、`checkCompliance.js`）
- **人員 C**：測試和文檔（`test.js`、`DEPLOYMENT.md`）

---

## 📞 問題與支持

**清單負責人**：AI Agent Commander
**最後更新**：2026-06-01
**下次更新**：2026-06-03（或完成 10 個文件後）

---

**總計**：38 個文件，已完成 9 個（24%），待建立 29 個（76%）

**今日目標**：建立 10 個 P0/P1 文件，完成度達到 50%

# 計劃 5：企業級 AI HR 自動化系統

**計劃代碼**：Plan-5-EnterpriseHR-Workflow
**版本**：v2.0（Workflow-First Architecture）
**基礎**：計劃 1 v1.0（Google Workspace + Apps Script）
**啟動日期**：2026-06-01
**框架**：Antigravity 2.0 + Claude Code Workflow

---

## 🎯 計劃 5 是什麼？

計劃 5 是基於計劃 1 v1.0 的升級項目，從「Google Workspace MVP」升級為「Workflow 驅動的企業級系統」。

### 計劃 5 的核心改變

```
計劃 1 v1.0: Google Forms → Apps Script → Google Workspace
計劃 5 v2.0: Google Forms → Claude Workflow → Multi-Agent Orchestration
```

**特點**：
- ✅ 結構化的 Workflow 編排（JavaScript）
- ✅ 多 Agent 並行協作（6 種執行模式）
- ✅ 完全可觀測（`/workflows` 監控）
- ✅ 高度可複用（Workflow 腳本可跨部門共用）
- ✅ 企業級合規（完整審計日誌）

---

## 📁 目錄結構

```
newworld-hr-system-v2/
├── src/                          # 源代碼
│   ├── workflows/               # Workflow 腳本
│   │   ├── leave_approval.js
│   │   ├── expense_report.js
│   │   ├── training_request.js
│   │   └── ...
│   ├── agents/                  # Agent 定義
│   │   ├── DataCollector.js
│   │   ├── PolicyValidator.js
│   │   ├── Reasoner.js
│   │   └── Executor.js
│   └── utils/                   # 工具函數
│       ├── googleWorkspaceAPI.js
│       ├── claudeAPI.js
│       └── logger.js
│
├── workflows/                   # Workflow 運行日誌 & 配置
│   ├── config.json             # Workflow 全局配置
│   ├── templates/              # Workflow 範本庫
│   └── executed/               # 執行歷史記錄
│
├── docs/                        # 文檔
│   ├── ARCHITECTURE.md          # v2 架構設計
│   ├── MIGRATION_GUIDE.md       # v1 → v2 遷移指南
│   ├── WORKFLOW_GUIDE.md        # Workflow 編寫指南
│   ├── API_REFERENCE.md         # API 參考
│   ├── BEST_PRACTICES.md        # 最佳實踐
│   └── DEPLOYMENT.md            # 部署指南
│
├── tests/                       # 測試
│   ├── unit/                    # 單元測試
│   ├── integration/             # 整合測試
│   └── e2e/                     # 端到端測試
│
├── README.md                    # 本文件
├── package.json                 # 項目配置
├── CHANGELOG.md                 # 版本變更日誌
└── LICENSE                      # 許可證

```

---

## 🚀 快速開始

### 前置條件

- Claude Code 2.1.47+ （支持 Workflow）
- Google Workspace 帳號
- Node.js 18+

### 1. 啟用 Workflow

```bash
export CLAUDE_CODE_WORKFLOWS_ENABLED=1
claude
```

### 2. 複製本倉庫

```bash
git clone https://github.com/pppeee861005/newworld-hr-system.git
cd newworld-hr-system
```

### 3. 配置環境

```bash
cp .env.example .env
# 編輯 .env，填入 Google Workspace ID、Claude API Key 等
```

### 4. 執行首個 Workflow

```bash
ultraWork 執行請假審批 Workflow
```

詳細步驟見 [部署指南](./docs/DEPLOYMENT.md)

---

## 📚 核心文檔

| 文檔 | 內容 |
|------|------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | v2 整體架構設計、三層結構、Workflow 流程 |
| [WORKFLOW_GUIDE.md](./docs/WORKFLOW_GUIDE.md) | 如何編寫 Workflow 腳本、6 種執行模式詳解 |
| [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) | v1.0 升級到 v2.0 的完整步驟 |
| [BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) | Workflow 編寫最佳實踐、常見陷阱 |
| [API_REFERENCE.md](./docs/API_REFERENCE.md) | Workflow API、Agent 接口、工具函數參考 |

---

## 🎬 Workflow 示例

### 請假審批流程

```javascript
// 查看完整範本
// src/workflows/leave_approval.js
```

### 執行流程

```
員工提交 Google Form
    ↓
Stage 1（並行）：資料收集 + 驗證
    ↓
Stage 2（對抗驗證）：政策檢查 vs 法規檢查
    ├─ 衝突 → 升級給 HR 主任
    └─ 通過 → 繼續
    ↓
Stage 3（同步聚合）：假期計算 + 生成建議
    ↓
Stage 4（並行）：通知主管 + 更新表格 + 發郵件

監控：/workflows 查看每個 Stage 的耗時、Token、調用的 API
```

### 執行命令

```bash
ultraWork 為員工 Johnson 審批 2026-06-10 的 5 天請假申請
```

---

## 🔄 版本對比

### v1.0 vs v2.0

| 特性 | v1.0 MVP | v2.0 Workflow |
|------|----------|---------------|
| 代碼組織 | 單一 Code.gs（850 行） | 多 Stage（結構化） |
| 並行能力 | 有限 | 原生 6 種模式 |
| Agent 協作 | 單一腳本 | 多 Agent 分工 |
| 可觀測性 | 日誌查看 | `/workflows` 完整監控 |
| 複用性 | 低 | 高（跨部門） |
| 適配企業規模 | 小企業、試驗 | 中大企業、生產級 |

詳見 [版本對比表](./docs/ARCHITECTURE.md#版本對比)

---

## 📊 六種 Workflow 執行模式

v2.0 支持 6 種執行模式，應對不同場景：

| 模式 | 場景 | 例子 |
|------|------|------|
| **Pipeline** | 線性順序 | 請假：表單 → 檢查 → 建議 → 通知 |
| **SyncAgg** | 多 Agent 並行 → 聚合 | 並行檢查多個政策 |
| **Adversarial** | 互相驗證，發現衝突 | 政策 vs 法規 |
| **Tail** | 篩選最優結果 | 從多方案中選最好的 |
| **Cumulative** | 逐步累積信息 | 月度假期累計 |
| **Nested** | Workflow 調用 Workflow | 請假 → 內部調用政策查詢 |

詳見 [Workflow 指南](./docs/WORKFLOW_GUIDE.md)

---

## 🔌 與 Google Workspace 的整合

v2.0 保留 v1.0 的 Google Workspace 基礎，並增強了能力：

```
Google Forms      ← 員工申請入口
    ↓
Claude Workflow   ← 多 Agent 協作編排（新）
    ↓
Google Workspace  ← 執行層（升級）
├─ Sheets        → 總控台 + 日誌
├─ Drive         → 檔案管理
├─ Calendar      → 期限提醒
└─ Gmail         → 通知
    ↓
Claude API       ← 知識和推理層（新）
├─ Claude Sonnet → 複雜推理
├─ Claude Haiku  → 輕量檢查
└─ Claude Opus   → 衝突決策
    ↓
NotebookLM       ← 政策知識庫（新）
├─ 員工手冊
├─ 公司政策
└─ 法規資料庫
```

---

## 🚀 開發路線圖

| Phase | 時間 | 目標 |
|-------|------|------|
| **Phase 1** | 06-01 ~ 06-07 | 驗證 Workflow，編寫首個腳本 |
| **Phase 2** | 06-08 ~ 06-21 | 請假審批完整實現 |
| **Phase 3** | 06-22 ~ 07-05 | 報銷、培訓等場景擴展 |
| **Phase 4** | 07-06 ~ 07-12 | 生產驗證 + 性能優化 |
| **Phase 5** | 07-13 ~ 07-19 | v2.0 正式發布 |

詳見 [PLAN1_v2_Workflow架構升級_plan.md](../PLAN1_v2_Workflow架構升級_plan.md)

---

## 📝 與文章系列的連動

v2.0 實現與 Substack 文章系列聯動：

| 文章 | 日期 | 內容 |
|------|------|------|
| Agent 系列 E04 | 06-01 | Workflow 理論 |
| Human in the Loop E01 | 05-27 | 設計哲學 |
| GitHub Release v2.0 | 07-01 | 技術交付 |

更多信息見 [相關文章清單](../../出版管理/系列文章清單.md)

---

## 🤝 貢獻指南

v2.0 歡迎社群貢獻：

- 🐛 **Bug Report**：提交 Issue
- 💡 **功能建議**：開 Discussion
- 📝 **文檔改進**：提 PR
- 🔧 **Workflow 範本**：分享你的 Workflow 腳本

詳見 [CONTRIBUTING.md](./docs/CONTRIBUTING.md)（待撰寫）

---

## 📞 支持與聯繫

- **GitHub Issues**：https://github.com/pppeee861005/newworld-hr-system/issues
- **Discussions**：https://github.com/pppeee861005/newworld-hr-system/discussions
- **Substack**：https://substack.com/@aiagentcommander

---

## 📄 許可證

MIT License - 詳見 [LICENSE](./LICENSE)

---

## 🙏 致謝

v2.0 構建在以下基礎上：

- **彭智標老師**：Google Workspace 行政專案工作流原始設計
- **Anthropic 團隊**：Claude Code Workflow 功能
- **社群貢獻者**：測試和反饋

---

**最後更新**：2026-05-25
**版本**：v2.0-alpha
**狀態**：🚧 開發中（Phase 1 準備啟動）

🚀 **v2.0：從 MVP 到企業級 HR 自動化系統**

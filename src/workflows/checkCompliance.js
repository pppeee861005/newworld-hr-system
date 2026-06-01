/**
 * 法規檢查子 Workflow
 *
 * 功能：檢查員工請假申請是否符合當地勞動法規
 * 調用方：leave_approval.js（Nested 模式）
 * 版本：v2.0-alpha
 */

const { logger } = require('../utils/logger')

const meta = {
  name: '法規檢查',
  description: '驗證請假申請是否符合當地勞動法規和政府規定',
  version: 'v2.0-alpha',
  phases: [
    { title: '定位法規', detail: '根據員工位置確定適用的法規' },
    { title: '檢索法規', detail: '從法規知識庫檢索相關條款' },
    { title: '合規驗證', detail: '驗證申請是否符合法規' }
  ]
}

/**
 * 輸出日誌（帶格式）
 * @param {string} message - 日誌消息
 */
function log(message) {
  console.log(message)
}

/**
 * 輸出階段標題
 * @param {string} name - 階段名稱
 */
function phase(name) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${name}`)
  console.log(`${'═'.repeat(60)}`)
}

/**
 * 執行法規檢查
 * @param {Object} params - 檢查參數
 * @param {Object} params.leaveData - 請假申請數據
 * @param {string} params.employeeId - 員工 ID
 * @param {string} params.employeeLocation - 員工所在地（國家/省份）
 * @returns {Object} 法規檢查結果
 */
async function checkCompliance(params = {}) {
  const { leaveData, employeeId, employeeLocation = 'Taiwan' } = params
  const workflowId = `compliance_${Date.now()}`

  logger.info(workflowId, '法規檢查開始', {
    employee_id: employeeId,
    location: employeeLocation,
    leave_type: leaveData.leave_type
  })

  try {
    // 第一階段：定位法規
    phase('定位法規')
    log('🌍 定位適用的勞動法規...')

    const jurisdictionData = await agent(
      `你是勞動法律顧問。根據員工位置 "${employeeLocation}" 確定適用的勞動法規：

1. 確定適用的法律框架：
   - 當地勞動法
   - 國家級假期法規
   - 行業特殊規定（如適用）

2. 識別與請假相關的法規條款：
   - 法定帶薪假（例如：年假、病假）
   - 特殊假期（例如：產假、喪假、婚假）
   - 休假通知期要求
   - 最大連續休假限制

3. 列出所有相關的法律條文參考。

員工位置：${employeeLocation}
請假類型：${leaveData.leave_type}`,
      {
        label: 'JurisdictionIdentifier',
        phase: '定位法規',
        schema: {
          type: 'object',
          properties: {
            jurisdiction: { type: 'string' },
            applicable_laws: {
              type: 'array',
              items: { type: 'string' }
            },
            legal_framework: { type: 'string' }
          }
        }
      }
    )

    // 第二階段：檢索法規
    phase('檢索法規')
    log('📚 檢索相關法規條款...')

    const regulationData = await agent(
      `基於 ${jurisdictionData.jurisdiction} 的法律框架，檢索以下假期相關的法規：

申請詳情：
- 請假類型：${leaveData.leave_type}
- 請假天數：${leaveData.days} 天
- 連續天數：${leaveData.days} 天
- 申請日期：${leaveData.application_date}
- 開始日期：${leaveData.start_date}

請檢索：
1. ${leaveData.leave_type} 在 ${jurisdictionData.jurisdiction} 的法定規定
2. 最大連續休假的法律限制
3. 雇主必須提供的最小假期額度
4. 休假通知期要求
5. 任何特殊保護（例如：產假、喪假的法定保護）

返回相關的法律條文、引用和解釋。`,
      {
        label: 'RegulationRetriever',
        phase: '檢索法規',
        schema: {
          type: 'object',
          properties: {
            legal_entitlements: {
              type: 'array',
              items: { type: 'string' },
              description: '法定假期權利'
            },
            max_consecutive_days: {
              type: 'number',
              description: '法律允許的最大連續天數'
            },
            notice_requirement_days: {
              type: 'number',
              description: '必要的提前通知天數'
            },
            special_protections: {
              type: 'array',
              items: { type: 'string' },
              description: '特殊法律保護'
            },
            legal_references: {
              type: 'array',
              items: { type: 'string' },
              description: '相關的法律條文參考'
            }
          }
        }
      }
    )

    // 第三階段：合規驗證
    phase('合規驗證')
    log('✅ 驗證法規合規性...')

    const complianceResult = await agent(
      `基於以下法律要求，驗證這份請假申請的合規性：

法律要求（${jurisdictionData.jurisdiction}）：
- 最大連續天數：${regulationData.max_consecutive_days} 天
- 法定假期權利：${regulationData.legal_entitlements?.join(', ')}
- 提前通知要求：${regulationData.notice_requirement_days} 天
- 特殊保護：${regulationData.special_protections?.join(', ')}

申請詳情：
- 請假類型：${leaveData.leave_type}
- 請假天數：${leaveData.days} 天
- 連續天數：${leaveData.days} 天
- 申請日期：${leaveData.application_date}
- 開始日期：${leaveData.start_date}

檢查清單：
1. ✓ 申請的假期類型是否受法律保護
2. ✓ 申請天數是否超過法律允許的最大值
3. ✓ 連續天數是否合法
4. ✓ 是否滿足通知期要求
5. ✓ 是否涉及法律禁止的條件

返回合規性判斷、任何違法風險、以及建議。`,
      {
        label: 'ComplianceValidator',
        phase: '合規驗證',
        schema: {
          type: 'object',
          properties: {
            legal_compliant: { type: 'boolean', description: '是否符合法規' },
            legal_risks: {
              type: 'array',
              items: { type: 'string' },
              description: '法律風險'
            },
            legal_warnings: {
              type: 'array',
              items: { type: 'string' },
              description: '法律警告'
            },
            legal_recommendations: {
              type: 'array',
              items: { type: 'string' },
              description: '建議'
            }
          }
        }
      }
    )

    logger.info(workflowId, '法規檢查完成', {
      legal_compliant: complianceResult.legal_compliant,
      risk_count: complianceResult.legal_risks?.length || 0
    })

    return {
      workflow_id: workflowId,
      approved: complianceResult.legal_compliant,
      legal_compliant: complianceResult.legal_compliant,
      jurisdiction: jurisdictionData.jurisdiction,
      legal_risks: complianceResult.legal_risks,
      legal_warnings: complianceResult.legal_warnings,
      legal_recommendations: complianceResult.legal_recommendations,
      regulations_applied: regulationData.legal_references
    }
  } catch (error) {
    logger.error(workflowId, '法規檢查失敗', { error: error.message })
    return {
      workflow_id: workflowId,
      error: error.message,
      approved: false,
      legal_compliant: false
    }
  }
}

async function execute(params = {}) {
  return await checkCompliance(params)
}

module.exports = { execute, meta, checkCompliance }

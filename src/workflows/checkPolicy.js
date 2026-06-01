/**
 * 政策檢查子 Workflow
 *
 * 功能：檢查員工請假申請是否符合公司政策
 * 調用方：leave_approval.js（Nested 模式）
 * 版本：v2.0-alpha
 */

const { logger } = require('../utils/logger')

const meta = {
  name: '政策檢查',
  description: '驗證請假申請是否符合公司人力資源政策',
  version: 'v2.0-alpha',
  phases: [
    { title: '載入政策', detail: '從知識庫載入相關政策' },
    { title: '比對驗證', detail: '對比請假申請與政策規則' },
    { title: '生成結果', detail: '輸出檢查結果和建議' }
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
 * 執行政策檢查
 * @param {Object} params - 檢查參數
 * @param {Object} params.leaveData - 請假申請數據
 * @param {string} params.employeeId - 員工 ID
 * @returns {Object} 政策檢查結果
 */
async function checkPolicy(params = {}) {
  const { leaveData, employeeId } = params
  const workflowId = `policy_${Date.now()}`

  logger.info(workflowId, '政策檢查開始', {
    employee_id: employeeId,
    leave_type: leaveData.leave_type
  })

  try {
    // 第一階段：從知識庫載入政策
    phase('載入政策')
    log('⏳ 載入公司人力資源政策...')

    const policyData = await agent(
      `你是人力資源政策顧問。從公司人力資源政策庫中檢索以下信息：

1. ${leaveData.leave_type} 假期的政策規定：
   - 最大連續休假天數
   - 年度額度
   - 提前通知要求（天數）
   - 核批權限
   - 特殊限制

2. 员工 ${employeeId} 的具體情況：
   - 員工級別和部門
   - 當年已用假期天數
   - 待批准的申請

請從公司政策庫（NotebookLM）中提取相關規則。`,
      {
        label: 'PolicyLoader',
        phase: '載入政策',
        schema: {
          type: 'object',
          properties: {
            leave_type: { type: 'string' },
            max_consecutive_days: { type: 'number' },
            annual_quota: { type: 'number' },
            advance_notice_days: { type: 'number' },
            approval_authority: { type: 'string' },
            employee_used_days: { type: 'number' },
            policy_source: { type: 'string' }
          }
        }
      }
    )

    // 第二階段：比對驗證
    phase('比對驗證')
    log('🔍 比對政策規則...')

    const validationResult = await agent(
      `基於以下政策規則，驗證這份請假申請：

政策規則：
- 最大連續天數：${policyData.max_consecutive_days} 天
- 年度額度：${policyData.annual_quota} 天
- 已使用：${policyData.employee_used_days} 天
- 提前通知要求：${policyData.advance_notice_days} 天

申請詳情：
- 請假天數：${leaveData.days} 天
- 申請日期：${leaveData.application_date}
- 開始日期：${leaveData.start_date}
- 請假原因：${leaveData.reason}

請檢查：
1. ✓ 申請天數是否超過年度額度
2. ✓ 連續天數是否超過政策限制
3. ✓ 提前通知是否足夠
4. ✓ 是否有其他政策衝突

返回檢查結果、任何違規情況、以及建議。`,
      {
        label: 'PolicyValidator',
        phase: '比對驗證',
        schema: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean', description: '是否符合政策' },
            issues: {
              type: 'array',
              items: { type: 'string' },
              description: '政策違規項'
            },
            warnings: {
              type: 'array',
              items: { type: 'string' },
              description: '政策警告'
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
              description: '建議'
            }
          }
        }
      }
    )

    // 第三階段：生成結果
    phase('生成結果')
    log('📝 生成政策檢查結果...')

    logger.info(workflowId, '政策檢查完成', {
      compliant: validationResult.compliant,
      issue_count: validationResult.issues?.length || 0
    })

    return {
      workflow_id: workflowId,
      approved: validationResult.compliant,
      policy_compliant: validationResult.compliant,
      policy_issues: validationResult.issues,
      policy_warnings: validationResult.warnings,
      policy_recommendations: validationResult.recommendations,
      policy_rules_applied: policyData
    }
  } catch (error) {
    logger.error(workflowId, '政策檢查失敗', { error: error.message })
    return {
      workflow_id: workflowId,
      error: error.message,
      approved: false,
      policy_compliant: false
    }
  }
}

async function execute(params = {}) {
  return await checkPolicy(params)
}

module.exports = { execute, meta, checkPolicy }

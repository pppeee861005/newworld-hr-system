/**
 * 請假審批 Workflow
 *
 * 功能：處理員工請假申請，包括政策檢查、法規驗證、衝突管理
 * 執行模式：Pipeline + SyncAgg + Adversarial + Nested
 * 版本：v2.0-alpha
 * 最後更新：2026-05-26
 */

const { logger } = require('../utils/logger')
const { googleWorkspaceAPI } = require('../utils/googleWorkspaceAPI')

// ============================================================================
// Workflow 元數據
// ============================================================================

export const meta = {
  name: '請假審批工作流',
  description: '處理員工請假申請，包括政策檢查、法規驗證、衝突管理',
  version: 'v2.0-alpha',
  phases: [
    { title: '數據收集', detail: '從 Google Form 收集並驗證申請數據' },
    { title: '並行檢查', detail: '並行執行政策和法規檢查' },
    { title: '衝突分析', detail: '如有衝突，進行對抗驗證和分析' },
    { title: '假期計算', detail: '計算剩餘假期和生成建議' },
    { title: '執行批准', detail: '更新系統、發送通知、記錄日誌' }
  ]
}

// ============================================================================
// 主流程函數
// ============================================================================

/**
 * 執行請假審批工作流
 * @param {Object} params - 工作流參數
 * @param {string} params.form_response_id - Google Form 響應 ID
 * @returns {Object} 工作流執行結果
 */
async function executeLeaveApproval(params = {}) {
  const startTime = Date.now()
  const workflowId = `leave_${Date.now()}`

  logger.info(workflowId, '工作流開始', {
    version: meta.version,
    phases: meta.phases.length
  })

  try {
    // ========== Stage 1: 數據收集 ==========
    phase('數據收集')
    log('⏳ 正在收集請假申請數據...')

    const dataCollected = await agent(
      `你是數據收集官（DataCollector）。你的任務是從 Google Form 響應中提取和驗證員工請假申請。

請檢查以下信息：
- 申請人姓名：${getFormField('applicant_name')}
- 申請日期：${getFormField('application_date')}
- 請假類型：${getFormField('leave_type')}  # 例如：vacation, sick, personal
- 開始日期：${getFormField('start_date')}
- 結束日期：${getFormField('end_date')}
- 請假原因：${getFormField('reason')}
- 聯繫電話：${getFormField('contact_phone')}

請驗證：
1. ✓ 所有必需欄位都已填寫（申請人、日期、類型）
2. ✓ 日期格式正確（YYYY-MM-DD）且邏輯合理（開始日期 < 結束日期）
3. ✓ 日期沒有與現有休假衝突
4. ✓ 請假類型在允許清單中
5. ✓ 請假天數合理（不超過 180 天）

返回驗證結果：
- 有效性標記（valid: true/false）
- 員工 ID（需要從員工資料庫中查詢）
- 清理後的日期和數據
- 任何驗證錯誤`,
      {
        label: 'DataCollector',
        phase: '數據收集',
        schema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', description: '數據是否通過驗證' },
            employee_id: { type: 'string', description: '員工 ID' },
            employee_name: { type: 'string' },
            leave_type: { type: 'string', enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity'] },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            days: { type: 'number', minimum: 1 },
            reason: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: '驗證失敗的錯誤信息'
            },
            warnings: {
              type: 'array',
              items: { type: 'string' },
              description: '警告信息（但不阻止審批）'
            }
          },
          required: ['valid', 'employee_id', 'employee_name', 'leave_type', 'start_date', 'end_date', 'days']
        }
      }
    )

    // 檢查數據驗證結果
    if (!dataCollected.valid) {
      log(`❌ 數據驗證失敗：${dataCollected.errors.join(', ')}`)
      logger.error(workflowId, '數據驗證失敗', dataCollected)
      return {
        status: 'rejected',
        reason: '提交的申請數據不完整或不有效',
        errors: dataCollected.errors,
        employee_id: dataCollected.employee_id
      }
    }

    log(`✅ 數據驗證通過：${dataCollected.employee_name} 申請 ${dataCollected.days} 天 ${dataCollected.leave_type}`)

    // ========== Stage 2: 並行檢查（SyncAgg 模式） ==========
    phase('並行檢查')
    log('⏳ 並行執行政策檢查和法規檢查...')

    const [policyCheck, complianceCheck] = await Promise.all([
      // 子任務 A：政策檢查
      executeSubWorkflow('checkPolicy', {
        employee_id: dataCollected.employee_id,
        leave_type: dataCollected.leave_type,
        days: dataCollected.days,
        start_date: dataCollected.start_date,
        end_date: dataCollected.end_date,
        workflowId
      }),

      // 子任務 B：法規檢查
      executeSubWorkflow('checkCompliance', {
        employee_id: dataCollected.employee_id,
        leave_type: dataCollected.leave_type,
        days: dataCollected.days,
        location: getFormField('employee_location') || 'California',
        workflowId
      })
    ])

    log(`✅ 並行檢查完成`)
    logger.debug(workflowId, '並行檢查結果', {
      policy_approved: policyCheck.approved,
      compliance_approved: complianceCheck.approved,
      policy_quota_remaining: policyCheck.quota_remaining,
      compliance_conflicts: complianceCheck.conflicts?.length || 0
    })

    // ========== Stage 3: 衝突檢測與分析（Adversarial 模式） ==========
    const hasConflict = !policyCheck.approved || !complianceCheck.approved

    if (hasConflict) {
      log(`⚠️ 發現衝突！進行對抗驗證...`)

      phase('衝突分析')

      const reasonerResult = await agent(
        `你是衝突分析官（Reasoner）。兩個檢查官的意見不一致：

政策檢查官的意見：
${JSON.stringify(policyCheck, null, 2)}

法規檢查官的意見：
${JSON.stringify(complianceCheck, null, 2)}

你需要：
1. 分析衝突的根本原因
2. 評估哪個檢查官的關注點更重要（公司政策 vs 法律要求）
3. 生成 3 個可能的解決方案：
   - 方案 A：調整日期以符合公司通知要求
   - 方案 B：縮短請假天數
   - 方案 C：改變請假類型（如從假期改為個人假）
4. 對每個方案進行評估（可行性、員工影響、合規性）
5. 推薦最佳方案
6. 判斷是否需要人工決策（escalate_to_human）

返回完整分析。`,
        {
          label: 'Reasoner',
          phase: '衝突分析',
          schema: {
            type: 'object',
            properties: {
              conflict_type: {
                type: 'string',
                enum: ['policy_conflict', 'compliance_conflict', 'both']
              },
              root_cause: { type: 'string' },
              analysis: { type: 'string' },
              solutions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    option_number: { type: 'number' },
                    action: { type: 'string' },
                    feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
                    employee_impact: { type: 'string' },
                    compliance_impact: { type: 'string' }
                  }
                }
              },
              recommended_option: { type: 'number' },
              escalate_to_human: { type: 'boolean' },
              escalation_reason: { type: 'string' }
            },
            required: ['conflict_type', 'root_cause', 'solutions', 'recommended_option', 'escalate_to_human']
          }
        }
      )

      if (reasonerResult.escalate_to_human) {
        log(`🔔 衝突無法自動解決，升級給 HR 主任人工決策`)
        log(`原因：${reasonerResult.escalation_reason}`)
        logger.warning(workflowId, '已升級給人工決策', reasonerResult)

        return {
          status: 'pending_human_review',
          workflow_id: workflowId,
          employee_id: dataCollected.employee_id,
          escalation_reason: reasonerResult.escalation_reason,
          conflict_analysis: reasonerResult,
          recommended_solution: reasonerResult.solutions[reasonerResult.recommended_option - 1]
        }
      }

      log(`✅ 衝突已解決：採用方案 ${reasonerResult.recommended_option}`)
    } else {
      log(`✅ 政策和法規檢查都通過，無衝突`)
    }

    // ========== Stage 4: 假期計算 ==========
    phase('假期計算')
    log(`⏳ 計算員工假期...`)

    const vacationCalc = await agent(
      `計算員工 ${dataCollected.employee_name}(${dataCollected.employee_id}) 的假期狀況：

申請信息：
- 請假類型：${dataCollected.leave_type}
- 申請天數：${dataCollected.days}
- 日期：${dataCollected.start_date} 至 ${dataCollected.end_date}

已知信息：
- 年度基本假期：20 天
- 已使用假期：8 天
- 結轉上年假期：2 天
- 已申請但未使用的假期：1 天

計算：
1. 批准此申請後，該員工還剩多少假期？
2. 假期是否足夠（是否會透支）？
3. 哪些假期會被扣除（按優先級）？
4. 何時應更新系統（立即還是在假期開始前）？

返回詳細計算。`,
      {
        label: 'VacationCalculator',
        phase: '假期計算',
        schema: {
          type: 'object',
          properties: {
            quota_total: { type: 'number', description: '總假期額度' },
            quota_used: { type: 'number', description: '已使用天數' },
            quota_pending: { type: 'number', description: '已申請未使用' },
            quota_available: { type: 'number', description: '可用天數' },
            quota_after_approval: { type: 'number', description: '批准後剩餘' },
            sufficient: { type: 'boolean', description: '額度是否足夠' },
            deductions: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['quota_total', 'quota_used', 'quota_available', 'quota_after_approval', 'sufficient']
        }
      }
    )

    if (!vacationCalc.sufficient) {
      log(`⚠️ 假期額度不足！`)
      log(`可用：${vacationCalc.quota_available} 天，申請：${dataCollected.days} 天`)
      return {
        status: 'rejected',
        reason: '員工假期額度不足',
        quota_shortfall: dataCollected.days - vacationCalc.quota_available,
        employee_id: dataCollected.employee_id
      }
    }

    log(`✅ 假期計算完成：批准後剩餘 ${vacationCalc.quota_after_approval} 天`)

    // ========== Stage 5: 執行批准 ==========
    phase('執行批准')
    log(`⏳ 執行批准並更新所有系統...`)

    const executor = await agent(
      `執行批准並更新所有系統。執行以下操作：

申請信息：
${JSON.stringify({
  employee_name: dataCollected.employee_name,
  employee_id: dataCollected.employee_id,
  leave_type: dataCollected.leave_type,
  days: dataCollected.days,
  dates: { start: dataCollected.start_date, end: dataCollected.end_date },
  remaining_after: vacationCalc.quota_after_approval
}, null, 2)}

執行步驟：
1. ✓ 更新 Google Sheets 中的審批狀態表（標記為已批准）
2. ✓ 發送確認郵件給員工（包含假期詳情和剩餘額度）
3. ✓ 發送提醒郵件給員工的直屬經理
4. ✓ 更新 Google Calendar（員工日曆、經理日曆）
5. ✓ 記錄完整的審計日誌（時間戳、決策人、完整流程記錄）

對於每個操作，返回：
- 是否成功（true/false）
- 完成時間
- 任何錯誤信息

批准信號：審批已完成，系統已更新。`,
      {
        label: 'Executor',
        phase: '執行批准',
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'partial_failure', 'failure'] },
            sheets_updated: { type: 'boolean' },
            email_to_employee_sent: { type: 'boolean' },
            email_to_manager_sent: { type: 'boolean' },
            calendar_updated: { type: 'boolean' },
            audit_log_created: { type: 'boolean' },
            audit_log_id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            errors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'audit_log_id']
        }
      }
    )

    if (executor.status === 'failure') {
      log(`❌ 執行批准失敗：${executor.errors.join(', ')}`)
      throw new Error(`Executor 失敗：${executor.errors[0]}`)
    }

    log(`✅ 批准執行完成`)

    // ========== 記錄工作流完成 ==========
    const duration = Date.now() - startTime

    logger.info(workflowId, '工作流完成', {
      duration_ms: duration,
      employee_id: dataCollected.employee_id,
      employee_name: dataCollected.employee_name,
      days: dataCollected.days,
      final_status: 'approved',
      stages_executed: 5,
      audit_log_id: executor.audit_log_id
    })

    return {
      status: 'approved',
      workflow_id: workflowId,
      audit_log_id: executor.audit_log_id,
      employee: {
        id: dataCollected.employee_id,
        name: dataCollected.employee_name
      },
      approval: {
        leave_type: dataCollected.leave_type,
        dates: { start: dataCollected.start_date, end: dataCollected.end_date },
        days: dataCollected.days,
        approved_at: executor.timestamp
      },
      quota: {
        remaining_after_approval: vacationCalc.quota_after_approval
      },
      execution: {
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
        all_systems_updated: executor.status === 'success'
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(workflowId, '工作流執行失敗', {
      error_message: error.message,
      error_stack: error.stack,
      duration_ms: duration
    })

    return {
      status: 'failed',
      workflow_id: workflowId,
      error: error.message,
      duration_ms: duration
    }
  }
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 執行子 Workflow（Nested 模式）
 * @param {string} workflowName - 子 Workflow 名稱
 * @param {Object} params - 參數
 * @returns {Promise<Object>} 執行結果
 */
async function executeSubWorkflow(workflowName, params) {
  try {
    const workflowModule = require(`./${workflowName}.js`)
    return await workflowModule.execute(params)
  } catch (error) {
    logger.error(params.workflowId, `子 Workflow 執行失敗：${workflowName}`, {
      error: error.message
    })
    throw error
  }
}

/**
 * 獲取 Google Form 欄位值
 * @param {string} fieldName - 欄位名稱
 * @returns {string} 欄位值
 */
function getFormField(fieldName) {
  return googleWorkspaceAPI.getFormField(fieldName) || '（未提供）'
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

// ============================================================================
// 匯出
// ============================================================================

export async function execute(params = {}) {
  return await executeLeaveApproval(params)
}

// 當直接運行此文件時（用於測試）
if (require.main === module) {
  executeLeaveApproval()
    .then(result => {
      console.log('\n✅ 工作流完成')
      console.log(JSON.stringify(result, null, 2))
    })
    .catch(error => {
      console.error('\n❌ 工作流失敗')
      console.error(error.message)
      process.exit(1)
    })
}

/**
 * 日誌系統 - 記錄 Workflow 執行過程
 */

const fs = require('fs')
const path = require('path')

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs')
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  log(level, workflowId, message, context = {}) {
    const timestamp = new Date().toISOString()
    const entry = JSON.stringify({
      timestamp,
      level,
      workflow_id: workflowId,
      message,
      ...context
    })

    console.log(`[${level}] [${workflowId}] ${message}`, context)

    const logFile = path.join(this.logDir, `workflow_${new Date().toISOString().split('T')[0]}.log`)
    fs.appendFileSync(logFile, entry + '\n')
  }

  info(workflowId, message, context) {
    this.log('INFO', workflowId, message, context)
  }

  warn(workflowId, message, context) {
    this.log('WARN', workflowId, message, context)
  }

  warning(workflowId, message, context) {
    this.log('WARN', workflowId, message, context)
  }

  debug(workflowId, message, context) {
    this.log('DEBUG', workflowId, message, context)
  }

  error(workflowId, message, context) {
    this.log('ERROR', workflowId, message, context)
  }

  logPerformance(workflowId, phase, metrics) {
    this.log('PERF', workflowId, `Phase: ${phase}`, metrics)
  }

  logAgentExecution(workflowId, agentName, result) {
    this.log('AGENT', workflowId, `Agent: ${agentName}`, result)
  }

  logDecision(workflowId, point, decision, reason) {
    this.log('DECISION', workflowId, point, { decision, reason })
  }

  logAPICall(workflowId, method, params, statusCode) {
    this.log('API', workflowId, `${method}`, { status_code: statusCode })
  }
}

module.exports = { logger: new Logger() }

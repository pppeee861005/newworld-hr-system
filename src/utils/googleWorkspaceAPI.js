/**
 * Google Workspace API 封裝
 *
 * 提供與 Google Forms、Sheets、Calendar、Gmail 的整合
 */

const { google } = require('googleapis')
const { logger } = require('./logger')

class GoogleWorkspaceAPI {
  constructor() {
    this.projectId = process.env.GOOGLE_PROJECT_ID
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY
    this.clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    this.domain = process.env.GOOGLE_WORKSPACE_DOMAIN

    this.auth = new google.auth.GoogleAuth({
      projectId: this.projectId,
      credentials: {
        type: 'service_account',
        project_id: this.projectId,
        private_key: this.privateKey,
        client_email: this.clientEmail
      },
      scopes: [
        'https://www.googleapis.com/auth/forms',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/directory.readonly'
      ]
    })

    this.forms = google.forms({ version: 'v1', auth: this.auth })
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
    this.calendar = google.calendar({ version: 'v3', auth: this.auth })
    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
    this.admin = google.admin({ version: 'directory_v1', auth: this.auth })
  }

  /**
   * 從 Google Form 讀取響應
   */
  async getFormResponse(formId, responseId, workflowId) {
    try {
      const response = await this.forms.forms.responses.get({
        formId,
        responseId
      })
      logger.logAPICall(workflowId, 'getFormResponse', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to get form response', { error: error.message })
      throw error
    }
  }

  /**
   * 從 Google Sheets 讀取數據
   */
  async readSheet(spreadsheetId, range, workflowId) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      })
      logger.logAPICall(workflowId, 'readSheet', {}, 200)
      return response.data.values || []
    } catch (error) {
      logger.error(workflowId, 'Failed to read sheet', { error: error.message })
      throw error
    }
  }

  /**
   * 寫入數據到 Google Sheets
   */
  async appendSheet(spreadsheetId, range, values, workflowId) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [values]
        }
      })
      logger.logAPICall(workflowId, 'appendSheet', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to append to sheet', { error: error.message })
      throw error
    }
  }

  /**
   * 更新 Google Sheets 的特定單元格
   */
  async updateSheet(spreadsheetId, range, values, workflowId) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [values]
        }
      })
      logger.logAPICall(workflowId, 'updateSheet', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to update sheet', { error: error.message })
      throw error
    }
  }

  /**
   * 在 Google Calendar 中創建事件
   */
  async createCalendarEvent(calendarId, event, workflowId) {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event
      })
      logger.logAPICall(workflowId, 'createCalendarEvent', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to create calendar event', { error: error.message })
      throw error
    }
  }

  /**
   * 發送 Gmail 郵件
   */
  async sendEmail(to, subject, body, workflowId) {
    try {
      const message = Buffer.from(
        `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
      ).toString('base64')

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      })
      logger.logAPICall(workflowId, 'sendEmail', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to send email', { error: error.message })
      throw error
    }
  }

  /**
   * 獲取員工資訊
   */
  async getEmployeeInfo(email, workflowId) {
    try {
      const response = await this.admin.users.get({
        userKey: email,
        projection: 'full'
      })
      logger.logAPICall(workflowId, 'getEmployeeInfo', {}, 200)
      return response.data
    } catch (error) {
      logger.error(workflowId, 'Failed to get employee info', { error: error.message })
      throw error
    }
  }

  /**
   * 列出部門員工
   */
  async listEmployeesByDepartment(departmentName, workflowId) {
    try {
      const response = await this.admin.users.list({
        domain: this.domain,
        orgUnitPath: `/${departmentName}`,
        maxResults: 500
      })
      logger.logAPICall(workflowId, 'listEmployeesByDepartment', {}, 200)
      return response.data.users || []
    } catch (error) {
      logger.error(workflowId, 'Failed to list employees', { error: error.message })
      throw error
    }
  }
}

module.exports = { googleWorkspaceAPI: new GoogleWorkspaceAPI() }

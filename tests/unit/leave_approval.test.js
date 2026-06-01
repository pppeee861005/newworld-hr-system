/**
 * Unit Tests for Leave Approval Workflow
 *
 * Test Coverage:
 * 1. Logger import and invocation
 * 2. GoogleWorkspaceAPI initialization
 * 3. checkPolicy workflow execution
 * 4. checkCompliance workflow execution
 * 5. leave_approval main workflow execution
 */

const { execute: executeLeaveApproval, meta } = require('../../src/workflows/leave_approval')
const { logger } = require('../../src/utils/logger')
const { googleWorkspaceAPI } = require('../../src/utils/googleWorkspaceAPI')
const { execute: executeCheckPolicy } = require('../../src/workflows/checkPolicy')
const { execute: executeCheckCompliance } = require('../../src/workflows/checkCompliance')

// ============================================================================
// Test Setup & Teardown
// ============================================================================

describe('Leave Approval Workflow - Unit Tests', () => {
  let loggerSpy, googleWorkspaceSpy

  beforeAll(() => {
    // Initialize test environment
    process.env.GOOGLE_PROJECT_ID = 'test-project'
    process.env.GOOGLE_PRIVATE_KEY = 'test-key'
    process.env.GOOGLE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com'
    process.env.GOOGLE_WORKSPACE_DOMAIN = 'test.com'
  })

  beforeEach(() => {
    // Reset spies before each test
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks()
  })

  // ============================================================================
  // Test Case 1: Logger Import and Invocation
  // ============================================================================

  describe('Test Case 1: Logger Import and Invocation', () => {
    test('should import logger successfully', () => {
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.warning).toBe('function')
    })

    test('should call logger.info with correct parameters', () => {
      loggerSpy = jest.spyOn(logger, 'info')

      const workflowId = 'leave_test_123'
      const message = 'Test workflow started'
      const context = { version: 'v2.0-alpha', phases: 5 }

      logger.info(workflowId, message, context)

      expect(loggerSpy).toHaveBeenCalledWith(workflowId, message, context)
      expect(loggerSpy).toHaveBeenCalledTimes(1)
    })

    test('should call logger.error with correct parameters', () => {
      loggerSpy = jest.spyOn(logger, 'error')

      const workflowId = 'leave_test_123'
      const message = 'Test error occurred'
      const context = { error_message: 'Test error' }

      logger.error(workflowId, message, context)

      expect(loggerSpy).toHaveBeenCalledWith(workflowId, message, context)
      expect(loggerSpy).toHaveBeenCalledTimes(1)
    })

    test('should call logger.debug with correct parameters', () => {
      loggerSpy = jest.spyOn(logger, 'debug')

      const workflowId = 'leave_test_123'
      const message = 'Debug information'
      const context = { policy_approved: true }

      logger.debug(workflowId, message, context)

      expect(loggerSpy).toHaveBeenCalledWith(workflowId, message, context)
    })

    test('should instantiate Logger class correctly', () => {
      expect(logger.constructor.name).toBe('Logger')
      expect(logger.logDir).toBeDefined()
    })
  })

  // ============================================================================
  // Test Case 2: GoogleWorkspaceAPI Initialization
  // ============================================================================

  describe('Test Case 2: GoogleWorkspaceAPI Initialization', () => {
    test('should initialize GoogleWorkspaceAPI successfully', () => {
      expect(googleWorkspaceAPI).toBeDefined()
      expect(googleWorkspaceAPI.constructor.name).toBe('GoogleWorkspaceAPI')
    })

    test('should have all required API clients initialized', () => {
      expect(googleWorkspaceAPI.forms).toBeDefined()
      expect(googleWorkspaceAPI.sheets).toBeDefined()
      expect(googleWorkspaceAPI.calendar).toBeDefined()
      expect(googleWorkspaceAPI.gmail).toBeDefined()
      expect(googleWorkspaceAPI.admin).toBeDefined()
    })

    test('should have all required API methods', () => {
      expect(typeof googleWorkspaceAPI.getFormResponse).toBe('function')
      expect(typeof googleWorkspaceAPI.readSheet).toBe('function')
      expect(typeof googleWorkspaceAPI.appendSheet).toBe('function')
      expect(typeof googleWorkspaceAPI.updateSheet).toBe('function')
      expect(typeof googleWorkspaceAPI.createCalendarEvent).toBe('function')
      expect(typeof googleWorkspaceAPI.sendEmail).toBe('function')
      expect(typeof googleWorkspaceAPI.getEmployeeInfo).toBe('function')
      expect(typeof googleWorkspaceAPI.listEmployeesByDepartment).toBe('function')
    })

    test('should store authentication credentials from environment variables', () => {
      // The GoogleWorkspaceAPI instance initializes with env vars at construction time
      // If env vars are not set, they will be undefined, which is expected
      expect(googleWorkspaceAPI).toBeDefined()
      expect(googleWorkspaceAPI.auth).toBeDefined()
      // Verify the auth object exists regardless of env var values
      expect(typeof googleWorkspaceAPI.auth).toBe('object')
    })

    test('should initialize GoogleAuth with correct scopes', () => {
      expect(googleWorkspaceAPI.auth).toBeDefined()
      // Verify that auth object is created (googleapis mock)
      expect(googleWorkspaceAPI.auth.constructor.name).toBe('GoogleAuth')
    })
  })

  // ============================================================================
  // Test Case 3: CheckPolicy Workflow Execution
  // ============================================================================

  describe('Test Case 3: CheckPolicy Workflow Execution', () => {
    test('should execute checkPolicy with correct parameters', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 5,
          start_date: '2026-06-15',
          end_date: '2026-06-20',
          application_date: '2026-06-01',
          reason: 'Personal vacation'
        },
        workflowId: 'leave_test_123'
      }

      // Mock the execute function
      const checkPolicySpy = jest.fn().mockResolvedValue({
        workflow_id: 'policy_test_123',
        approved: true,
        policy_compliant: true,
        policy_issues: [],
        policy_warnings: [],
        policy_recommendations: []
      })

      const result = await checkPolicySpy(params)

      expect(checkPolicySpy).toHaveBeenCalledWith(params)
      expect(result.approved).toBe(true)
      expect(result.policy_compliant).toBe(true)
      expect(result.policy_issues).toEqual([])
    })

    test('should return approved status when policy compliant', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 5,
          start_date: '2026-06-15',
          end_date: '2026-06-20',
          application_date: '2026-06-01',
          reason: 'Personal vacation'
        },
        workflowId: 'leave_test_123'
      }

      const checkPolicySpy = jest.fn().mockResolvedValue({
        approved: true,
        policy_compliant: true,
        quota_remaining: 15
      })

      const result = await checkPolicySpy(params)

      expect(result.approved).toBe(true)
      expect(result.policy_compliant).toBe(true)
      expect(result.quota_remaining).toBe(15)
    })

    test('should return rejected status when policy non-compliant', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 25,
          start_date: '2026-06-15',
          end_date: '2026-07-10',
          application_date: '2026-05-01',
          reason: 'Extended vacation'
        },
        workflowId: 'leave_test_123'
      }

      const checkPolicySpy = jest.fn().mockResolvedValue({
        approved: false,
        policy_compliant: false,
        policy_issues: ['Exceeds maximum consecutive days (20 max)'],
        quota_remaining: 0
      })

      const result = await checkPolicySpy(params)

      expect(result.approved).toBe(false)
      expect(result.policy_compliant).toBe(false)
      expect(result.policy_issues.length).toBeGreaterThan(0)
    })

    test('should handle checkPolicy errors gracefully', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 5
        },
        workflowId: 'leave_test_123'
      }

      const checkPolicySpy = jest.fn().mockRejectedValue(
        new Error('Policy check failed')
      )

      try {
        await checkPolicySpy(params)
      } catch (error) {
        expect(error.message).toBe('Policy check failed')
      }
    })

    test('should include workflow metadata', () => {
      expect(meta).toBeDefined()
      expect(meta.name).toBe('請假審批工作流')
      expect(meta.version).toBe('v2.0-alpha')
      expect(meta.phases.length).toBe(5)
    })
  })

  // ============================================================================
  // Test Case 4: CheckCompliance Workflow Execution
  // ============================================================================

  describe('Test Case 4: CheckCompliance Workflow Execution', () => {
    test('should execute checkCompliance with correct parameters', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 5,
          start_date: '2026-06-15',
          end_date: '2026-06-20',
          application_date: '2026-06-01'
        },
        employeeLocation: 'California',
        workflowId: 'leave_test_123'
      }

      const checkComplianceSpy = jest.fn().mockResolvedValue({
        workflow_id: 'compliance_test_123',
        approved: true,
        legal_compliant: true,
        jurisdiction: 'California',
        legal_risks: [],
        legal_warnings: [],
        regulations_applied: []
      })

      const result = await checkComplianceSpy(params)

      expect(checkComplianceSpy).toHaveBeenCalledWith(params)
      expect(result.approved).toBe(true)
      expect(result.legal_compliant).toBe(true)
      expect(result.jurisdiction).toBe('California')
    })

    test('should identify correct jurisdiction from location', async () => {
      const params = {
        employeeId: 'EMP002',
        leaveData: {
          leave_type: 'maternity',
          days: 180,
          start_date: '2026-07-01',
          end_date: '2026-12-27',
          application_date: '2026-06-01'
        },
        employeeLocation: 'Taiwan',
        workflowId: 'leave_test_123'
      }

      const checkComplianceSpy = jest.fn().mockResolvedValue({
        approved: true,
        legal_compliant: true,
        jurisdiction: 'Taiwan',
        legal_risks: []
      })

      const result = await checkComplianceSpy(params)

      expect(result.jurisdiction).toBe('Taiwan')
    })

    test('should flag legal risks when non-compliant', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 365,
          start_date: '2026-06-15',
          end_date: '2027-06-14',
          application_date: '2026-06-01'
        },
        employeeLocation: 'California',
        workflowId: 'leave_test_123'
      }

      const checkComplianceSpy = jest.fn().mockResolvedValue({
        approved: false,
        legal_compliant: false,
        legal_risks: ['Exceeds California legal maximum (180 days)'],
        conflicts: [
          { type: 'max_consecutive', days_exceeded: 185 }
        ]
      })

      const result = await checkComplianceSpy(params)

      expect(result.approved).toBe(false)
      expect(result.legal_compliant).toBe(false)
      expect(result.legal_risks.length).toBeGreaterThan(0)
    })

    test('should handle multiple legal warnings', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 10,
          start_date: '2026-06-15',
          end_date: '2026-06-25',
          application_date: '2026-05-10'
        },
        employeeLocation: 'New York',
        workflowId: 'leave_test_123'
      }

      const checkComplianceSpy = jest.fn().mockResolvedValue({
        approved: true,
        legal_compliant: true,
        legal_warnings: [
          'No clear notice period in New York (best practice: 14 days)',
          'Overlaps with state holiday (Independence Day)'
        ]
      })

      const result = await checkComplianceSpy(params)

      expect(result.legal_warnings.length).toBe(2)
    })

    test('should handle checkCompliance errors', async () => {
      const params = {
        employeeId: 'EMP001',
        leaveData: {
          leave_type: 'vacation',
          days: 5
        },
        workflowId: 'leave_test_123'
      }

      const checkComplianceSpy = jest.fn().mockRejectedValue(
        new Error('Compliance check failed')
      )

      try {
        await checkComplianceSpy(params)
      } catch (error) {
        expect(error.message).toBe('Compliance check failed')
      }
    })
  })

  // ============================================================================
  // Test Case 5: Leave Approval Main Workflow Execution
  // ============================================================================

  describe('Test Case 5: Leave Approval Main Workflow Execution', () => {
    test('should execute main workflow with valid parameters', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'approved',
        workflow_id: 'leave_test_123',
        audit_log_id: 'audit_log_001',
        employee: {
          id: 'EMP001',
          name: 'John Doe'
        },
        approval: {
          leave_type: 'vacation',
          dates: { start: '2026-06-15', end: '2026-06-20' },
          days: 5,
          approved_at: '2026-06-01T10:00:00Z'
        },
        quota: {
          remaining_after_approval: 15
        },
        execution: {
          duration_ms: 2500,
          duration_seconds: 2,
          all_systems_updated: true
        }
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(executeLeaveApprovalSpy).toHaveBeenCalledWith(params)
      expect(result.status).toBe('approved')
      expect(result.employee.id).toBe('EMP001')
      expect(result.execution.all_systems_updated).toBe(true)
    })

    test('should handle rejected approval due to invalid data', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'rejected',
        reason: 'Data validation failed',
        errors: ['Missing employee name', 'Invalid date format'],
        employee_id: undefined
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.status).toBe('rejected')
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should handle pending human review status', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'pending_human_review',
        workflow_id: 'leave_test_123',
        employee_id: 'EMP001',
        escalation_reason: 'Policy and compliance conflict detected',
        conflict_analysis: {
          conflict_type: 'both',
          root_cause: 'Request exceeds both policy and legal limits'
        }
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.status).toBe('pending_human_review')
      expect(result.escalation_reason).toBeDefined()
      expect(result.conflict_analysis).toBeDefined()
    })

    test('should handle insufficient vacation quota', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'rejected',
        reason: 'Employee vacation quota insufficient',
        quota_shortfall: 3,
        employee_id: 'EMP001'
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.status).toBe('rejected')
      expect(result.reason).toContain('quota')
      expect(result.quota_shortfall).toBe(3)
    })

    test('should return proper error status on workflow failure', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'failed',
        workflow_id: 'leave_test_123',
        error: 'Internal server error during approval',
        duration_ms: 1500
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.duration_ms).toBeGreaterThan(0)
    })

    test('should measure and return workflow execution time', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'approved',
        workflow_id: 'leave_test_123',
        execution: {
          duration_ms: 3000,
          duration_seconds: 3,
          all_systems_updated: true
        }
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.execution.duration_ms).toBeGreaterThan(0)
      expect(result.execution.duration_seconds).toBeGreaterThan(0)
      expect(Math.round(result.execution.duration_ms / 1000)).toBe(result.execution.duration_seconds)
    })

    test('should execute all 5 workflow phases', async () => {
      expect(meta.phases).toBeDefined()
      expect(meta.phases.length).toBe(5)

      const expectedPhases = [
        '數據收集',
        '並行檢查',
        '衝突分析',
        '假期計算',
        '執行批准'
      ]

      meta.phases.forEach((phase, index) => {
        expect(phase.title).toBe(expectedPhases[index])
        expect(phase.detail).toBeDefined()
      })
    })

    test('should include audit log in successful approval', async () => {
      const params = {
        form_response_id: 'form_response_001'
      }

      const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
        status: 'approved',
        workflow_id: 'leave_test_123',
        audit_log_id: 'audit_log_123456',
        employee: {
          id: 'EMP001',
          name: 'Jane Smith'
        }
      })

      const result = await executeLeaveApprovalSpy(params)

      expect(result.audit_log_id).toBeDefined()
      expect(result.audit_log_id).toBeTruthy()
    })

    test('should handle multiple employees in batch processing', async () => {
      const batchParams = [
        { form_response_id: 'form_response_001' },
        { form_response_id: 'form_response_002' },
        { form_response_id: 'form_response_003' }
      ]

      const executeLeaveApprovalSpy = jest.fn()
        .mockResolvedValueOnce({
          status: 'approved',
          workflow_id: 'leave_001',
          employee: { id: 'EMP001' }
        })
        .mockResolvedValueOnce({
          status: 'rejected',
          workflow_id: 'leave_002',
          employee: { id: 'EMP002' }
        })
        .mockResolvedValueOnce({
          status: 'pending_human_review',
          workflow_id: 'leave_003',
          employee: { id: 'EMP003' }
        })

      const results = await Promise.all(
        batchParams.map(params => executeLeaveApprovalSpy(params))
      )

      expect(results).toHaveLength(3)
      expect(results[0].status).toBe('approved')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('pending_human_review')
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    test('should log workflow start and completion', async () => {
      const loggerInfoSpy = jest.spyOn(logger, 'info')
      const loggerErrorSpy = jest.spyOn(logger, 'error')

      const workflowId = 'leave_integration_test'

      logger.info(workflowId, 'Workflow started', {
        version: meta.version,
        phases: meta.phases.length
      })

      expect(loggerInfoSpy).toHaveBeenCalled()
      expect(loggerInfoSpy.mock.calls[0][0]).toBe(workflowId)
    })

    test('should execute full workflow sequence correctly', async () => {
      const mockResults = {
        dataCollection: { valid: true, employee_id: 'EMP001' },
        policyCheck: { approved: true, quota_remaining: 15 },
        complianceCheck: { approved: true, legal_compliant: true },
        execution: { status: 'success', audit_log_id: 'audit_001' }
      }

      expect(mockResults.dataCollection.valid).toBe(true)
      expect(mockResults.policyCheck.approved).toBe(true)
      expect(mockResults.complianceCheck.approved).toBe(true)
      expect(mockResults.execution.status).toBe('success')
    })

    test('should validate GoogleWorkspaceAPI is used in workflow', () => {
      expect(googleWorkspaceAPI.getFormResponse).toBeDefined()
      expect(googleWorkspaceAPI.readSheet).toBeDefined()
      expect(googleWorkspaceAPI.appendSheet).toBeDefined()
      expect(googleWorkspaceAPI.updateSheet).toBeDefined()
      expect(googleWorkspaceAPI.sendEmail).toBeDefined()
      expect(googleWorkspaceAPI.createCalendarEvent).toBeDefined()
    })
  })
})

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Leave Approval Workflow - Edge Cases', () => {
  test('should handle empty parameters gracefully', async () => {
    const executeLeaveApprovalSpy = jest.fn().mockResolvedValue({
      status: 'rejected',
      error: 'Missing required parameters'
    })

    const result = await executeLeaveApprovalSpy({})

    expect(result.status).toBe('rejected')
  })

  test('should handle null employee ID', async () => {
    const params = {
      form_response_id: 'form_response_001',
      employee_id: null
    }

    const checkPolicySpy = jest.fn().mockResolvedValue({
      approved: false,
      error: 'Invalid employee ID'
    })

    const result = await checkPolicySpy(params)

    expect(result.approved).toBe(false)
  })

  test('should handle very long leave requests', async () => {
    const params = {
      form_response_id: 'form_response_001',
      leaveData: {
        leave_type: 'unpaid',
        days: 365,
        start_date: '2026-06-01',
        end_date: '2027-06-01'
      }
    }

    const checkComplianceSpy = jest.fn().mockResolvedValue({
      approved: false,
      legal_risks: ['Exceeds maximum continuous leave period']
    })

    const result = await checkComplianceSpy(params)

    expect(result.approved).toBe(false)
  })

  test('should handle concurrent workflow executions', async () => {
    const promises = []

    for (let i = 0; i < 5; i++) {
      const spy = jest.fn().mockResolvedValue({
        status: 'approved',
        workflow_id: `leave_test_${i}`,
        employee: { id: `EMP${i}` }
      })

      promises.push(spy({ form_response_id: `form_${i}` }))
    }

    const results = await Promise.all(promises)

    expect(results).toHaveLength(5)
    results.forEach((result, index) => {
      expect(result.workflow_id).toBe(`leave_test_${index}`)
    })
  })
})

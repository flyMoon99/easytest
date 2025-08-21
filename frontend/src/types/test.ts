export interface TestRecord {
  id: string
  title: string
  entryUrl: string
  description: string
  directoryId: string
  level?: string // 用例等级：高、中、低
  createdAt: string
  updatedAt?: string
  playwrightScripts: PlaywrightScript[]
  videoUrl?: string
  screenshotUrl?: string
  aiAnalysis?: {
    analysis: string
    aiModel: string
    testType: string
    analyzedAt: string
  }
}

// 与后端 /api/testcases/:id/analyze 返回结构保持一致
export interface AnalyzeResponsePayload {
  testCase: TestRecord
  analysis: string | any
  scripts: PlaywrightScript[]
  aiModel: string
  testType: string
}

export interface PlaywrightScript {
  id: string
  testRecordId: string
  step: number
  action: string
  selector?: string
  value?: string
  description?: string
  explanation?: string
  videoSegmentUrl?: string
  timestamp?: number
  screenshot?: string
}

export interface TestForm {
  title: string
  entryUrl: string
  description: string
  directoryId: string
  level?: string // 用例等级：高、中、低
}

export interface TestStatistics {
  total: number
}

export interface TestState {
  testRecords: TestRecord[]
  currentTest: TestRecord | null
  statistics: TestStatistics
  loading: boolean
  error: string | null
}

// 新增：测试计划用例关联类型
export interface TestPlanTestCase {
  id: string
  testPlanId: string
  testCaseId: string
  memberId: string
  status: 'pending' | 'screened' | 'analyzed' | 'completed' | 'failed'
  result: 'pass' | 'fail' | 'blocked' | 'skipped' | 'notExecuted'
  executionCount: number
  relatedBugs: number
  lastExecutionTime?: string
  lastExecutor: string
  createdAt: string
  updatedAt: string
}

// 新增：测试计划用例详情类型（包含用例信息）
export interface TestPlanTestCaseDetail {
  id: string
  testCaseId: string
  title: string
  entryUrl: string
  description: string
  level: string
  directoryPath: string[] // 后端现在返回数组格式
  status: string
  result: string
  executionCount: number
  relatedBugs: number
  lastExecutionTime?: string
  lastExecutor: string
  executionDescription?: string
  createdAt: string
  updatedAt: string
}

// 新增：更新用例执行结果的请求类型
export interface UpdateTestCaseResultRequest {
  result: 'pass' | 'fail' | 'blocked' | 'skipped' | 'notExecuted'
  executionDescription?: string
}

// 测试计划状态
export type TestPlanStatus = 'draft' | 'active' | 'completed' | 'cancelled'

// 测试计划统计信息
export interface TestPlanStatistics {
  total: number
  draft: number
  active: number
  completed: number
  cancelled: number
}

// 测试计划统计详情
export interface TestPlanStatisticsDetail {
  totalCases: number
  completedCases: number
  failedCases: number
  successRate: number
}

// 测试计划基础信息
export interface TestPlan {
  id: string
  memberId: string
  name: string
  description: string
  status: TestPlanStatus
  testType: string
  assignee: string
  startTime: string
  endTime: string
  testCaseCount: number
  completedTestCaseCount: number
  statistics: TestPlanStatisticsDetail
  createdAt: string
  updatedAt: string
}

// 创建测试计划表单
export interface CreateTestPlanForm {
  name: string
  description: string
  status: TestPlanStatus
  testType: string
  assignee: string
  startTime: string
  endTime: string
}

// 更新测试计划表单
export interface UpdateTestPlanForm {
  name?: string
  description?: string
  status?: TestPlanStatus
  testType?: string
  assignee?: string
  startTime?: string
  endTime?: string
}

// 测试计划查询参数
export interface TestPlanQueryParams {
  page?: number
  limit?: number
  status?: TestPlanStatus
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 测试计划列表响应
export interface TestPlanListResponse {
  testPlans: TestPlan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  statistics: TestPlanStatistics
}

// 测试计划详情响应
export interface TestPlanDetailResponse {
  testPlan: TestPlan
}

// API响应格式
export interface TestPlanResponse {
  success: boolean
  message: string
  data: TestPlan
}

export interface TestPlanListAPIResponse {
  success: boolean
  message: string
  data: {
    testPlans: TestPlan[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    statistics: TestPlanStatistics
  }
}

// 状态显示配置
export const TEST_PLAN_STATUS_CONFIG = {
  draft: {
    label: '草稿',
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-400'
  },
  active: {
    label: '进行中',
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-400'
  },
  completed: {
    label: '已完成',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-400'
  },
  cancelled: {
    label: '已取消',
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-400'
  }
} as const

// 测试类型选项
export const TEST_TYPE_OPTIONS = [
  { value: '功能测试', label: '功能测试' },
  { value: '性能测试', label: '性能测试' },
  { value: '安全测试', label: '安全测试' },
  { value: '兼容性测试', label: '兼容性测试' },
  { value: '用户体验测试', label: '用户体验测试' },
  { value: '回归测试', label: '回归测试' },
  { value: '集成测试', label: '集成测试' },
  { value: '单元测试', label: '单元测试' },
  { value: '其他', label: '其他' }
] as const

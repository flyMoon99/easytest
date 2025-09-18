import api from './api'
import type {
  TestPlan,
  CreateTestPlanForm,
  UpdateTestPlanForm,
  TestPlanQueryParams,
  TestPlanListResponse,
  TestPlanStatistics
} from '@/types/testPlan'

/**
 * 测试计划管理API服务
 */
export const testPlanAPI = {
  /**
   * 获取测试计划列表
   * @param params 查询参数
   */
  getList: (params: TestPlanQueryParams = {}): Promise<{
    success: boolean;
    message: string;
    data: TestPlanListResponse;
    timestamp: string;
  }> => {
    const queryParams = new URLSearchParams()
    
    if (params.page) {
      queryParams.append('page', params.page.toString())
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params.status) {
      queryParams.append('status', params.status)
    }
    if (params.search) {
      queryParams.append('search', params.search)
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy)
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder)
    }
    
    const url = `/test-plans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return api.get(url)
  },

  /**
   * 获取测试计划详情
   * @param id 测试计划ID
   */
  getDetail: (id: string): Promise<{
    success: boolean;
    message: string;
    data: TestPlan;
    timestamp: string;
  }> => 
    api.get(`/test-plans/${id}`),

  /**
   * 创建测试计划
   * @param data 测试计划数据
   */
  create: (data: CreateTestPlanForm): Promise<TestPlan> => 
    api.post('/test-plans', data),

  /**
   * 更新测试计划
   * @param id 测试计划ID
   * @param data 更新数据
   */
  update: (id: string, data: UpdateTestPlanForm): Promise<TestPlan> => 
    api.put(`/test-plans/${id}`, data),

  /**
   * 删除测试计划
   * @param id 测试计划ID
   */
  delete: (id: string): Promise<{ success: boolean; message: string }> => 
    api.delete(`/test-plans/${id}`),

  /**
   * 获取测试计划统计信息
   */
  getStatistics: (): Promise<{ success: boolean; message: string; data: TestPlanStatistics }> => 
    api.get('/test-plans/statistics'),

  /**
   * 获取测试计划关联的测试用例
   * @param id 测试计划ID
   * @param params 查询参数
   */
  getRelatedCases: (id: string, params: { page?: number; limit?: number } = {}): Promise<{ success: boolean; message: string; data: { testCases: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }> => {
    const queryParams = new URLSearchParams()
    
    if (params.page) {
      queryParams.append('page', params.page.toString())
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    
    const url = `/test-plans/${id}/related-cases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return api.get(url)
  },

  /**
   * 关联测试用例到测试计划
   * @param id 测试计划ID
   * @param caseIds 测试用例ID数组
   */
  associateCases: (id: string, caseIds: string[]): Promise<{ success: boolean; message: string; data: { associatedCount: number } }> => 
    api.post(`/test-plans/${id}/associate-cases`, { caseIds }),

  /**
   * 更新测试计划用例的执行结果
   * @param testPlanId 测试计划ID
   * @param caseId 测试用例ID
   * @param data 执行结果数据
   */
  updateTestCaseResult: (testPlanId: string, caseId: string, data: { result: string; executionDescription?: string }): Promise<{ success: boolean; message: string; data: unknown }> => 
    api.put(`/test-plans/${testPlanId}/cases/${caseId}/result`, data)
}

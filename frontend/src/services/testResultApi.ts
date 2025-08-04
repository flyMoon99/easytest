import api from './api'
import type { 
  TestResultListResponse,
  TestResultStatistics,
  TestResultQueryParams,
  CreateTestResultRequest,
  UpdateTestResultStatusRequest,
  UpdateTestResultRequest,
  BatchCreateTestResultRequest
} from '@/types/testResult'

/**
 * 获取测试结果列表
 */
export const getTestResults = async (params: TestResultQueryParams = {}): Promise<TestResultListResponse> => {
  const response = await api.get('/test-results', { params })
  return response.data
}

/**
 * 获取单个测试结果详情
 */
export const getTestResult = async (id: string) => {
  const response = await api.get(`/test-results/${id}`)
  return response.data
}

/**
 * 创建测试结果
 */
export const createTestResult = async (data: CreateTestResultRequest) => {
  const response = await api.post('/test-results', data)
  return response.data
}

/**
 * 批量创建测试结果
 */
export const createTestResultsBatch = async (data: BatchCreateTestResultRequest) => {
  const response = await api.post('/test-results/batch', data)
  return response.data
}

/**
 * 更新测试结果状态
 */
export const updateTestResultStatus = async (id: string, data: UpdateTestResultStatusRequest) => {
  const response = await api.put(`/test-results/${id}/status`, data)
  return response.data
}

/**
 * 更新测试结果
 */
export const updateTestResult = async (id: string, data: UpdateTestResultRequest) => {
  const response = await api.put(`/test-results/${id}`, data)
  return response.data
}

/**
 * 删除测试结果
 */
export const deleteTestResult = async (id: string) => {
  const response = await api.delete(`/test-results/${id}`)
  return response.data
}

/**
 * 获取测试结果统计信息
 */
export const getStatistics = async (): Promise<{ statistics: TestResultStatistics }> => {
  const response = await api.get('/test-results/statistics/summary')
  return response.data
}

/**
 * 根据视频ID获取测试结果
 */
export const getTestResultsByVideo = async (videoId: string) => {
  const response = await api.get('/test-results', {
    params: { videoId }
  })
  return response.data
}

// 导出API对象
export const testResultApi = {
  getTestResults,
  getTestResult,
  createTestResult,
  createTestResultsBatch,
  updateTestResultStatus,
  updateTestResult,
  deleteTestResult,
  getStatistics,
  getTestResultsByVideo
} 
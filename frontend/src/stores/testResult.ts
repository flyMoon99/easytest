import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TestResult, 
  TestResultListResponse, 
  TestResultStatistics,
  TestResultQueryParams,
  CreateTestResultRequest,
  UpdateTestResultStatusRequest,
  UpdateTestResultRequest
} from '@/types/testResult'
import { testResultApi } from '@/services/testResultApi'

export const useTestResultStore = defineStore('testResult', () => {
  // 状态
  const testResults = ref<TestResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const statistics = ref<TestResultStatistics>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    completionRate: 0
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // 计算属性
  const hasTestResults = computed(() => testResults.value.length > 0)
  const pendingCount = computed(() => statistics.value.pending)
  const processingCount = computed(() => statistics.value.processing)
  const completedCount = computed(() => statistics.value.completed)
  const completionRate = computed(() => statistics.value.completionRate)

  // 获取测试结果列表
  const getTestResults = async (params: TestResultQueryParams = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.getTestResults(params)
      testResults.value = response.testResults
      pagination.value = response.pagination
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取测试结果列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取单个测试结果
  const getTestResult = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.getTestResult(id)
      return response.testResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取测试结果详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建测试结果
  const createTestResult = async (data: CreateTestResultRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.createTestResult(data)
      
      // 重新获取列表以更新数据
      await getTestResults()
      
      return response.testResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建测试结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 批量创建测试结果
  const createTestResultsBatch = async (videoId: string, testResults: CreateTestResultRequest[]) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.createTestResultsBatch({ videoId, testResults })
      
      // 重新获取列表以更新数据
      await getTestResults()
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量创建测试结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新测试结果状态
  const updateTestResultStatus = async (id: string, data: UpdateTestResultStatusRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.updateTestResultStatus(id, data)
      
      // 更新本地数据
      const index = testResults.value.findIndex(result => result.id === id)
      if (index !== -1) {
        testResults.value[index] = response.testResult
      }
      
      // 重新获取统计信息
      await getStatistics()
      
      return response.testResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新测试结果状态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新测试结果
  const updateTestResult = async (id: string, data: UpdateTestResultRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.updateTestResult(id, data)
      
      // 更新本地数据
      const index = testResults.value.findIndex(result => result.id === id)
      if (index !== -1) {
        testResults.value[index] = response.testResult
      }
      
      return response.testResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新测试结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除测试结果
  const deleteTestResult = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      await testResultApi.deleteTestResult(id)
      
      // 从本地列表中移除
      testResults.value = testResults.value.filter(result => result.id !== id)
      
      // 重新获取统计信息
      await getStatistics()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除测试结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取统计信息
  const getStatistics = async () => {
    try {
      const response = await testResultApi.getStatistics()
      statistics.value = response.statistics
    } catch (err) {
      console.error('获取统计信息失败:', err)
    }
  }

  // 根据视频ID获取测试结果
  const getTestResultsByVideo = async (videoId: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testResultApi.getTestResultsByVideo(videoId)
      return response.testResults
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取视频测试结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 重置状态
  const reset = () => {
    testResults.value = []
    loading.value = false
    error.value = null
    statistics.value = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      completionRate: 0
    }
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // 状态
    testResults,
    loading,
    error,
    statistics,
    pagination,
    
    // 计算属性
    hasTestResults,
    pendingCount,
    processingCount,
    completedCount,
    completionRate,
    
    // 方法
    getTestResults,
    getTestResult,
    createTestResult,
    createTestResultsBatch,
    updateTestResultStatus,
    updateTestResult,
    deleteTestResult,
    getStatistics,
    getTestResultsByVideo,
    clearError,
    reset
  }
}) 
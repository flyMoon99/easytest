import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  TestPlan,
  CreateTestPlanForm,
  UpdateTestPlanForm,
  TestPlanQueryParams,
  TestPlanStatistics
} from '@/types/testPlan'
import { testPlanAPI } from '@/services/testPlanApi'

export const useTestPlanStore = defineStore('testPlan', () => {
  // ===== 状态 =====
  const testPlans = ref<TestPlan[]>([])
  const currentTestPlan = ref<TestPlan | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const statistics = ref<TestPlanStatistics>({
    total: 0,
    draft: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // ===== 计算属性 =====
  const hasTestPlans = computed(() => testPlans.value.length > 0)
  const draftCount = computed(() => statistics.value.draft)
  const activeCount = computed(() => statistics.value.active)
  const completedCount = computed(() => statistics.value.completed)
  const cancelledCount = computed(() => statistics.value.cancelled)

  // ===== 操作方法 =====

  /**
   * 获取测试计划列表
   */
  const getTestPlans = async (params: TestPlanQueryParams = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.getList(params)
      
      // 添加安全检查
      if (!response) {
        throw new Error('API响应格式错误')
      }
      
      // 确保testPlans是数组并且触发响应式更新
      const testPlansArray = response.data && response.data.testPlans ? response.data.testPlans : []
      
      // 验证和清理数据
      const validatedTestPlans = testPlansArray.map((plan: TestPlan) => {
        // 确保每个计划都有id字段
        if (!plan.id) {
          console.warn('测试计划缺少id字段:', plan)
        }
        return plan
      })
      
      // 清空数组然后重新赋值，确保响应式更新
      testPlans.value = []
      testPlans.value = [...validatedTestPlans]
      
      pagination.value = response.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
      statistics.value = response.data?.statistics || {
        total: 0,
        draft: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      }
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取测试计划列表失败'
      // 设置默认值
      testPlans.value = []
      pagination.value = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
      statistics.value = {
        total: 0,
        draft: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单个测试计划详情
   */
  const getTestPlanDetail = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.getDetail(id)
      
      // 添加安全检查
      if (!response || !response.success || !response.data) {
        throw new Error('API响应格式错误或数据为空')
      }
      
      // 验证必要字段
      const testPlan = response.data
      if (!testPlan.id || !testPlan.status) {
        throw new Error('测试计划数据不完整')
      }
      
      // 确保statistics字段存在
      if (!testPlan.statistics) {
        testPlan.statistics = {
          totalCases: 0,
          completedCases: 0,
          failedCases: 0,
          successRate: 0
        }
      }
      
      currentTestPlan.value = testPlan
      
      return testPlan
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取测试计划详情失败'
      currentTestPlan.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建测试计划
   */
  const createTestPlan = async (data: CreateTestPlanForm) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.create(data)
      const newTestPlan = response
      
      // 添加到列表开头
      testPlans.value.unshift(newTestPlan)
      
      // 更新统计信息
      await updateStatistics()
      
      return newTestPlan
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建测试计划失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新测试计划
   */
  const updateTestPlan = async (id: string, data: UpdateTestPlanForm) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.update(id, data)
      const updatedTestPlan = response
      
      // 更新列表中的数据
      const index = testPlans.value.findIndex(plan => plan.id === id)
      if (index !== -1) {
        testPlans.value[index] = updatedTestPlan
      }
      
      // 更新当前选中的测试计划
      if (currentTestPlan.value?.id === id) {
        currentTestPlan.value = updatedTestPlan
      }
      
      return updatedTestPlan
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新测试计划失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除测试计划
   */
  const deleteTestPlan = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      await testPlanAPI.delete(id)
      
      // 从列表中移除
      const index = testPlans.value.findIndex(plan => plan.id === id)
      if (index !== -1) {
        testPlans.value.splice(index, 1)
      }
      
      // 如果删除的是当前选中的测试计划，清空选中
      if (currentTestPlan.value?.id === id) {
        currentTestPlan.value = null
      }
      
      // 更新统计信息
      await updateStatistics()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除测试计划失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新统计信息
   */
  const updateStatistics = async () => {
    try {
      const response = await testPlanAPI.getStatistics()
      statistics.value = response.data
    } catch (err) {
      console.error('更新统计信息失败:', err)
    }
  }

  /**
   * 获取测试计划关联的测试用例
   */
  const getRelatedCases = async (testPlanId: string, params: { page?: number; limit?: number } = {}) => {
    try {
      loading.value = true
      error.value = null
      
      console.log('Store: 开始获取关联用例，参数:', { testPlanId, params })
      const response = await testPlanAPI.getRelatedCases(testPlanId, params)
      console.log('Store: API原始响应:', response)
      return response.data
    } catch (err) {
      console.error('Store: 获取关联用例失败:', err)
      error.value = err instanceof Error ? err.message : '获取关联测试用例失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 关联测试用例到测试计划
   */
  const associateCases = async (testPlanId: string, caseIds: string[]) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.associateCases(testPlanId, caseIds)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '关联测试用例失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新测试计划用例的执行结果
   */
  const updateTestCaseResult = async (testPlanId: string, caseId: string, data: { result: string; executionDescription?: string }) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await testPlanAPI.updateTestCaseResult(testPlanId, caseId, data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用例执行结果失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空状态
   */
  const clearState = () => {
    testPlans.value = []
    currentTestPlan.value = null
    error.value = null
    statistics.value = {
      total: 0,
      draft: 0,
      active: 0,
      completed: 0,
      cancelled: 0
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
    testPlans,
    currentTestPlan,
    loading,
    error,
    statistics,
    pagination,
    
    // 计算属性
    hasTestPlans,
    draftCount,
    activeCount,
    completedCount,
    cancelledCount,
    
    // 方法
    getTestPlans,
    getTestPlanDetail,
    createTestPlan,
    updateTestPlan,
    deleteTestPlan,
    updateStatistics,
    getRelatedCases,
    associateCases,
    updateTestCaseResult,
    clearState
  }
})

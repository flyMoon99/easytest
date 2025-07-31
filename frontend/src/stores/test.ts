import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { testCaseAPI } from '@/services/api'
import type { TestRecord, TestForm, TestStatistics, PlaywrightScript } from '@/types'

export const useTestStore = defineStore('test', () => {
  // 状态
  const testRecords = ref<TestRecord[]>([])
  const currentTest = ref<TestRecord | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性 - 统计数据
  const statistics = computed((): TestStatistics => {
    const total = testRecords.value.length
    const pending = testRecords.value.filter(t => t.status === 'pending').length
    const screened = testRecords.value.filter(t => t.status === 'screened').length
    const analyzed = testRecords.value.filter(t => t.status === 'analyzed').length
    const completed = testRecords.value.filter(t => t.status === 'completed').length
    const failed = testRecords.value.filter(t => t.status === 'failed').length
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, pending, screened, analyzed, completed, failed, successRate }
  })

  // 创建测试
  const createTest = async (testData: TestForm) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.create(testData)
      const newTest = response.data
      
      testRecords.value.unshift(newTest)
      
      // 注意：移除了自动的状态更新，让用户手动控制测试执行
      // 如果需要自动执行，可以在特定条件下启用
      
      return newTest
    } catch (err: any) {
      error.value = err.message || '创建测试失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取测试记录列表
  const getTestRecords = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.getList()
      testRecords.value = response.data.testCases
    } catch (err: any) {
      error.value = err.message || '获取测试记录失败'
      // 如果API调用失败，使用模拟数据
      if (testRecords.value.length === 0) {
        initMockData()
      }
    } finally {
      loading.value = false
    }
  }

  // 获取测试详情
  const getTestDetail = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.getDetail(id)
      currentTest.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取测试详情失败'
      // 如果API调用失败，从本地数据中查找（但不使用模拟数据）
      const test = testRecords.value.find(t => t.id === id)
      if (test && test.id !== '1' && test.id !== '2' && test.id !== '3') {
        // 只使用真实的测试数据，不使用模拟数据
        currentTest.value = test
        return test
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除测试
  const deleteTest = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await testCaseAPI.delete(id)
      
      const index = testRecords.value.findIndex(t => t.id === id)
      if (index > -1) {
        testRecords.value.splice(index, 1)
      }
      
      if (currentTest.value?.id === id) {
        currentTest.value = null
      }
    } catch (err: any) {
      error.value = err.message || '删除测试失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新测试状态
  const updateTestStatus = async (id: string, status: TestRecord['status'], additionalData?: any) => {
    try {
      const statusData = { status, ...additionalData }
      const response = await testCaseAPI.updateStatus(id, statusData)
      
      // 更新本地数据
      const test = testRecords.value.find(t => t.id === id)
      if (test) {
        Object.assign(test, response.data)
      }
      
      if (currentTest.value?.id === id) {
        currentTest.value = response.data
      }
      
      return response.data
    } catch (err: any) {
      // 如果API调用失败，仍然更新本地状态
      const test = testRecords.value.find(t => t.id === id)
      if (test) {
        test.status = status
        test.updatedAt = new Date().toISOString()
        if (status === 'completed' || status === 'failed') {
          test.completedAt = new Date().toISOString()
        }
        if (additionalData) {
          Object.assign(test, additionalData)
        }
      }
      console.warn('更新测试状态API调用失败，使用本地更新:', err)
    }
  }

  // 生成模拟的Playwright脚本
  const generateMockScripts = (testId: string) => {
    const test = testRecords.value.find(t => t.id === testId)
    if (!test) return

    const mockScripts: PlaywrightScript[] = [
      {
        id: '1',
        testRecordId: testId,
        step: 1,
        action: 'page.goto',
        value: test.entryUrl,
        description: '访问测试页面',
        videoSegmentUrl: `/mock-video/${testId}-step1.mp4`,
        timestamp: 0
      },
      {
        id: '2',
        testRecordId: testId,
        step: 2,
        action: 'page.click',
        selector: '#login-button',
        description: '点击登录按钮',
        videoSegmentUrl: `/mock-video/${testId}-step2.mp4`,
        timestamp: 2000
      },
      {
        id: '3',
        testRecordId: testId,
        step: 3,
        action: 'page.fill',
        selector: '#email',
        value: 'test@example.com',
        description: '填写邮箱',
        videoSegmentUrl: `/mock-video/${testId}-step3.mp4`,
        timestamp: 5000
      },
      {
        id: '4',
        testRecordId: testId,
        step: 4,
        action: 'page.fill',
        selector: '#password',
        value: '••••••••',
        description: '填写密码',
        videoSegmentUrl: `/mock-video/${testId}-step4.mp4`,
        timestamp: 8000
      },
      {
        id: '5',
        testRecordId: testId,
        step: 5,
        action: 'page.click',
        selector: '#submit',
        description: '提交登录',
        videoSegmentUrl: `/mock-video/${testId}-step5.mp4`,
        timestamp: 12000
      }
    ]

    test.playwrightScripts = mockScripts
    test.videoUrl = `/mock-video/${testId}-full.mp4`
    test.duration = 15000

    // 注意：移除了自动的状态更新，让用户手动控制测试执行
    // 如果需要自动执行，可以在特定条件下启用
  }

  // 初始化模拟数据
  const initMockData = () => {
    const mockTests: TestRecord[] = [
      {
        id: '1',
        title: '用户登录功能测试',
        entryUrl: 'https://example.com/login',
        description: '测试用户登录流程，包括邮箱验证、密码验证和登录状态检查',
        status: 'pending',
        createdAt: '2025-01-13T10:30:00Z',
        playwrightScripts: [],
        userId: '1'
      },
      {
        id: '2',
        title: '商品搜索功能测试',
        entryUrl: 'https://example.com/products',
        description: '测试商品搜索、筛选和排序功能',
        status: 'pending',
        createdAt: '2025-01-13T14:20:00Z',
        playwrightScripts: [],
        userId: '1'
      },
      {
        id: '3',
        title: '购物车操作测试',
        entryUrl: 'https://example.com/cart',
        description: '测试添加商品到购物车、修改数量、删除商品等操作',
        status: 'pending',
        createdAt: '2025-01-14T09:15:00Z',
        playwrightScripts: [],
        userId: '1'
      }
    ]
    
    testRecords.value = mockTests
  }

  // 更新测试用例
  const updateTest = async (id: string, testData: Partial<TestForm>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.update(id, testData)
      
      // 更新本地数据
      const index = testRecords.value.findIndex(t => t.id === id)
      if (index > -1) {
        testRecords.value[index] = response.data
      }
      
      if (currentTest.value?.id === id) {
        currentTest.value = response.data
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.message || '更新测试失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 执行测试
  const executeTest = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.execute(id)
      
      // 更新本地数据
      const index = testRecords.value.findIndex(t => t.id === id)
      if (index > -1) {
        testRecords.value[index] = response.data
      }
      
      if (currentTest.value?.id === id) {
        currentTest.value = response.data
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.message || '执行测试失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // AI分析
  const analyzeTest = async (id: string, options: { aiModel: string; testType: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await testCaseAPI.analyze(id, options)
      
      // 更新本地数据
      const index = testRecords.value.findIndex(t => t.id === id)
      if (index > -1) {
        testRecords.value[index] = response.data
      }
      
      if (currentTest.value?.id === id) {
        currentTest.value = response.data
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'AI分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    testRecords,
    currentTest,
    loading,
    error,
    
    // 计算属性
    statistics,
    
    // 方法
    createTest,
    getTestRecords,
    getTestDetail,
    updateTest,
    deleteTest,
    updateTestStatus,
    executeTest,
    analyzeTest,
    clearError
  }
})
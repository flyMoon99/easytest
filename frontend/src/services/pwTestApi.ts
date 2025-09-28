import api from './api'

// PW测试相关API接口
export const pwTestApi = {
  /**
   * 执行完整的PW测试流程
   * @param testCaseId 测试用例ID
   * @param options 执行选项
   */
  runCompleteTest: (testCaseId: string, options: any = {}) => 
    api.post(`/pw-test/run/${testCaseId}`, { options }),

  /**
   * 仅执行已生成的PW测试代码
   * @param testCaseId 测试用例ID
   * @param options 执行选项
   */
  executeTest: (testCaseId: string, options: any = {}) => 
    api.post(`/pw-test/execute/${testCaseId}`, { options }),

  /**
   * 自然语言理解分析
   * @param testCaseId 测试用例ID
   */
  analyzeTest: (testCaseId: string) => 
    api.post(`/pw-test/analyze/${testCaseId}`),

  /**
   * 生成Playwright代码
   * @param testCaseId 测试用例ID
   * @param nluResult 自然语言理解结果
   */
  generateCode: (testCaseId: string, nluResult: any) => 
    api.post(`/pw-test/generate/${testCaseId}`, { nluResult }),

  /**
   * 验证和优化代码
   * @param testCaseId 测试用例ID
   * @param generatedCode 生成的代码
   */
  optimizeCode: (testCaseId: string, generatedCode: any) => 
    api.post(`/pw-test/optimize/${testCaseId}`, { generatedCode }),

  /**
   * 获取测试用例的PW测试状态
   * @param testCaseId 测试用例ID
   */
  getStatus: (testCaseId: string) => 
    api.get(`/pw-test/status/${testCaseId}`),

  /**
   * 获取测试用例的执行历史
   * @param testCaseId 测试用例ID
   * @param params 查询参数
   */
  getHistory: (testCaseId: string, params: any = {}) => 
    api.get(`/pw-test/history/${testCaseId}`, { params }),


  /**
   * 更新PW测试配置
   * @param testCaseId 测试用例ID
   * @param pwTestConfig 配置信息
   */
  updateConfig: (testCaseId: string, pwTestConfig: any) => 
    api.put(`/pw-test/config/${testCaseId}`, { pwTestConfig }),

  /**
   * 流式执行PW测试
   * @param testCaseId 测试用例ID
   * @param options 执行选项
   */
  runStreamingTest: (testCaseId: string, options: any = {}): EventSource => {
    const params = new URLSearchParams({
      executionMode: options.executionMode || 'headless',
      browserType: options.browserType || 'chromium'
    });
    
    // 获取认证令牌
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 使用正确的API URL
    const baseURL = api.defaults.baseURL;
    let url = `${baseURL}/pw-test/stream/${testCaseId}?${params.toString()}`;
    
    // 如果使用token认证，将token添加到URL参数中
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    console.log('创建SSE连接:', url);
    
    // 创建EventSource连接
    const eventSource = new EventSource(url, {
      withCredentials: true
    });
    
    return eventSource;
  }
}



// 类型定义
export interface PWTestStatus {
  testCaseId: string
  pwTestEnabled: boolean
  hasGeneratedCode: boolean
  codeVersion: string | null
  lastGeneratedAt: string | null
  qualityScore: number
  latestExecution: {
    executionId: string
    status: string
    result: string
    startedAt: string
    completedAt: string
    duration: number
  } | null
  statistics: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    minExecutionTime: number
    maxExecutionTime: number
    successRate: number
    lastExecutedAt: string | null
    codeGenerationCount: number
  }
  codeHistory: Array<{
    version: string
    qualityScore: number
    status: string
    createdAt: string
  }>
  nluResult: any
}

export interface PWTestExecutionResult {
  executionId: string
  result: {
    success: boolean
    duration: number
    logs: Array<{
      level: string
      message: string
      timestamp: string
      step: number
    }>
    screenshots: Array<{
      step: number
      path: string
      timestamp: string
      description: string
    }>
    error?: {
      message: string
      stack: string
      step: number
    }
  }
  testCase: any
}

export interface PWTestCompleteResult {
  nluResult: any
  generatedCode: {
    fullScript: string
    testFunction: string
    setupCode: string
    teardownCode: string
    dependencies: string[]
    version: string
    generatedAt: string
    aiModel: string
    qualityScore: number
  }
  optimizationResult: {
    code: any
    qualityScore: number
    suggestions: Array<{
      type: string
      priority: string
      description: string
    }>
  }
  executionResult: PWTestExecutionResult
}

export interface PWTestConfig {
  enabled: boolean
  executionMode: 'headless' | 'headed' | 'debug'
  browserType: 'chromium' | 'firefox' | 'webkit'
  viewport: {
    width: number
    height: number
  }
  timeouts: {
    navigation: number
    action: number
    assertion: number
  }
  retries: {
    count: number
    delay: number
  }
  recording: {
    enabled: boolean
    video: boolean
    screenshots: boolean
  }
}

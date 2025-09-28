import api from './api'
import config from '@/config'

// 单例测试相关API接口
export const singletonTestAPI = {
  /**
   * 执行单例测试
   * @param testCase 测试用例数据
   * @param callbacks 回调函数
   */
  executeTest: async (
    testCase: {
      title: string
      entryUrl: string
      description: string
      level: string
    },
    callbacks?: {
      onLog?: (message: string) => void
      onProgress?: (step: string, progress: number) => void
      onError?: (error: string) => void
      onSuccess?: (message: string) => void
    }
  ): Promise<{
    success: boolean
    error?: string
    summary?: {
      totalSteps: number
      successfulSteps: number
      failedSteps: number
      successRate: number
    }
    executionSteps?: Array<unknown>
  }> => {
    return new Promise((resolve, reject) => {
      try {
        callbacks?.onLog?.('正在建立实时连接...')

        // 获取认证令牌
        const token =
          localStorage.getItem('token') || sessionStorage.getItem('token')

        // 构建SSE URL
        const params = new URLSearchParams({
          title: testCase.title,
          entryUrl: testCase.entryUrl,
          description: testCase.description,
          level: testCase.level,
        })

        let url = `${config.api.apiURL}/singleton-test/stream?${params.toString()}`

        // 如果使用token认证，将token添加到URL参数中
        if (token) {
          url += `&token=${encodeURIComponent(token)}`
        }

        console.log('创建SSE连接:', url)

        // 创建EventSource连接
        const eventSource = new EventSource(url)

        let finalResult: {
          success: boolean
          error?: string
          summary?: {
            totalSteps: number
            successfulSteps: number
            failedSteps: number
            successRate: number
          }
        } | null = null

        eventSource.onopen = () => {
          console.log('SSE连接已建立')
          callbacks?.onLog?.('实时连接已建立')
        }

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data)
            console.log('收到SSE消息:', data)

            switch (data.type) {
              case 'connection':
                callbacks?.onLog?.(data.message)
                break

              case 'start':
                callbacks?.onLog?.(data.message)
                callbacks?.onProgress?.('开始执行测试...', 5)
                break

              case 'log':
                callbacks?.onLog?.(data.message)
                break

              case 'complete':
                callbacks?.onProgress?.('测试执行完成', 100)
                if (data.success) {
                  callbacks?.onSuccess?.('测试执行成功')
                } else {
                  callbacks?.onError?.(data.error || '测试执行失败')
                }

                finalResult = {
                  success: data.success,
                  error: data.error,
                  summary: data.summary,
                }

                eventSource.close()
                resolve(finalResult)
                break

              case 'error':
                callbacks?.onError?.(data.message)
                eventSource.close()
                resolve({
                  success: false,
                  error: data.message,
                })
                break
            }
          } catch (parseError) {
            console.error('解析SSE消息失败:', parseError)
            callbacks?.onError?.('解析服务器消息失败')
          }
        }

        eventSource.onerror = error => {
          console.error('SSE连接错误:', error)
          callbacks?.onError?.('连接错误，请检查网络连接')
          eventSource.close()

          resolve({
            success: false,
            error: '连接错误，请检查网络连接',
          })
        }
      } catch (error) {
        console.error('创建SSE连接失败:', error)
        callbacks?.onError?.('创建连接失败')
        reject(error)
      }
    })
  },

  /**
   * 检查MCP服务器健康状态
   */
  healthCheck: async (): Promise<{
    success: boolean
    message: string
    data?: {
      isConnected: boolean
      toolsCount: number
    }
  }> => {
    const response = await api.get('/singleton-test/health')
    return response.data
  },
}

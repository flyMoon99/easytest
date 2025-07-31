import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useAiChatStore = defineStore('aiChat', () => {
  // 状态
  const isStreaming = ref(false)
  const currentMessage = ref('')

  // 获取认证store
  const authStore = useAuthStore()

  // 创建axios实例
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器 - 添加认证令牌
  api.interceptors.request.use(
    (config) => {
      const token = authStore.token || localStorage.getItem('token') || sessionStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器 - 处理错误和令牌过期
  api.interceptors.response.use(
    (response) => {
      return response.data
    },
    (error) => {
      if (error.response?.status === 401) {
        // 令牌过期，清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error.response?.data || error)
    }
  )

  // 发送消息（非流式）
  const sendMessage = async (message: string, model: string): Promise<string> => {
    try {
      const response = await api.post('/ai-chat/send', {
        message,
        model
      })
      
      return response.data.response
    } catch (error) {
      console.error('AI对话失败:', error)
      throw new Error('AI对话失败，请稍后再试')
    }
  }

  // 流式发送消息
  const sendMessageStream = async (
    message: string,
    model: string,
    onMessage?: (content: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void
  ): Promise<void> => {
    isStreaming.value = true
    currentMessage.value = ''

    try {
      const token = authStore.token || localStorage.getItem('token') || sessionStorage.getItem('token')
      
      const response = await fetch('http://localhost:3001/api/ai-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          model
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'message':
                  currentMessage.value += data.content
                  onMessage?.(data.content)
                  break
                  
                case 'complete':
                  fullResponse = data.response
                  onComplete?.(fullResponse)
                  break
                  
                case 'error':
                  throw new Error(data.message)
              }
            } catch (parseError) {
              console.error('解析SSE数据失败:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('流式AI对话失败:', error)
      onError?.(error instanceof Error ? error.message : '未知错误')
    } finally {
      isStreaming.value = false
    }
  }

  // 清空状态
  const clearState = () => {
    isStreaming.value = false
    currentMessage.value = ''
  }

  return {
    // 状态
    isStreaming,
    currentMessage,
    
    // 方法
    sendMessage,
    sendMessageStream,
    clearState
  }
}) 
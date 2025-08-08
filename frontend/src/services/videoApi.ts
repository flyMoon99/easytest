import api from './api'
import type { 
  VideoRecord, 
  VideoForm, 
  VideoListResponse, 
  VideoUploadResponse,
  VideoStatusUpdateRequest,
  GeminiParseResponse
} from '@/types/video'

// 视频API服务
export const videoAPI = {
  // 上传视频
  upload: async (formData: FormData): Promise<VideoUploadResponse> => {
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 获取视频列表
  getList: async (params?: {
    page?: number
    limit?: number
    parseStatus?: string
    search?: string
  }): Promise<VideoListResponse> => {
    const response = await api.get('/videos', { params })
    return response.data
  },

  // 获取视频详情
  getDetail: async (id: string): Promise<{ data: VideoRecord }> => {
    const response = await api.get(`/videos/${id}`)
    return response.data
  },

  // 更新视频信息
  update: async (id: string, data: Partial<VideoForm>): Promise<{ data: VideoRecord }> => {
    const response = await api.put(`/videos/${id}`, data)
    return response.data
  },

  // 删除视频
  delete: async (id: string): Promise<void> => {
    await api.delete(`/videos/${id}`)
  },

  // 更新视频解析状态
  updateParseStatus: async (id: string, data: VideoStatusUpdateRequest): Promise<{ data: VideoRecord }> => {
    const response = await api.patch(`/videos/${id}/parse-status`, data)
    return response.data
  },

  // 使用Gemini解析视频
  parseWithGemini: async (id: string): Promise<GeminiParseResponse> => {
    const response = await api.post(`/videos/${id}/parse-with-gemini`)
    return response.data
  },

  // 流式解析视频（使用Server-Sent Events）
  parseWithGeminiStream: async (
    id: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void,
    onComplete?: () => void
  ): Promise<void> => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10061'
      
      if (!token) {
        throw new Error('未找到认证令牌，请重新登录')
      }
      
      let response = await fetch(`${baseURL}/api/videos/${id}/parse-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // 如果是401错误，尝试刷新token并重试
      if (response.status === 401) {
        try {
          const refreshResponse = await fetch(`${baseURL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            const newToken = refreshData.data.token
            
            // 更新存储的token
            const storage = localStorage.getItem('token') ? localStorage : sessionStorage
            storage.setItem('token', newToken)
            
            // 重新发送请求
            response = await fetch(`${baseURL}/api/videos/${id}/parse-stream`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            })
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('认证失败，请重新登录')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        
        // 处理SSE消息
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
              
              // 检查是否结束
              if (data.type === 'end') {
                onComplete?.()
                return
              }
            } catch (error) {
              console.error('解析SSE消息失败:', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('流式解析失败:', error)
      onError?.(error)
    }
  },

  // 获取视频统计信息
  getStatistics: async (): Promise<{ data: any }> => {
    const response = await api.get('/videos/statistics')
    return response.data
  }
}
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { videoAPI } from '@/services/videoApi'
import type { VideoRecord, VideoForm, VideoStatistics, VideoParseResult } from '@/types/video'

export const useVideoStore = defineStore('video', () => {
  // 状态
  const videoRecords = ref<VideoRecord[]>([])
  const currentVideo = ref<VideoRecord | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const statistics = ref<VideoStatistics>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    successRate: 0
  })

  // 流式解析相关状态
  const isStreaming = ref(false)
  const streamProgress = ref(0)
  const streamStep = ref('')
  const streamLogs = ref<string[]>([])

  // 计算属性
  const hasVideos = computed(() => videoRecords.value.length > 0)

  // 获取视频列表
  const getVideoRecords = async (params?: {
    page?: number
    limit?: number
    parseStatus?: string
    search?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('开始获取视频列表，参数:', params)
      const response = await videoAPI.getList(params)
      console.log('API响应:', response)
      
      // 检查响应结构
      if (response && response.videos && Array.isArray(response.videos)) {
        videoRecords.value = response.videos
        statistics.value = response.statistics || {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          successRate: 0
        }
        console.log('成功获取视频列表，数量:', response.videos.length)
      } else {
        console.log('响应格式不正确或没有视频数据:', response)
        videoRecords.value = []
        statistics.value = {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          successRate: 0
        }
      }
      return response
    } catch (err: unknown) {
      console.error('获取视频列表失败:', err)
      error.value = err instanceof Error ? err.message : '获取视频列表失败'
      // 出错时清空数据
      videoRecords.value = []
      statistics.value = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        successRate: 0
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取视频详情
  const getVideoDetail = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await videoAPI.getDetail(id)
      currentVideo.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '获取视频详情失败'
      // 如果API调用失败，从本地数据中查找
      const video = videoRecords.value.find(v => v.id === id)
      if (video) {
        currentVideo.value = video
        return video
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 上传视频
  const uploadVideo = async (formData: FormData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await videoAPI.upload(formData)
      videoRecords.value.unshift(response.video)
      return response.video
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '上传视频失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新视频信息
  const updateVideo = async (id: string, videoData: Partial<VideoForm>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await videoAPI.update(id, videoData)
      
      // 更新本地数据
      const index = videoRecords.value.findIndex(v => v.id === id)
      if (index !== -1) {
        videoRecords.value[index] = response.data
      }
      
      if (currentVideo.value?.id === id) {
        currentVideo.value = response.data
      }
      
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新视频失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除视频
  const deleteVideo = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await videoAPI.delete(id)
      
      // 从本地数据中移除
      const index = videoRecords.value.findIndex(v => v.id === id)
      if (index !== -1) {
        videoRecords.value.splice(index, 1)
      }
      
      if (currentVideo.value?.id === id) {
        currentVideo.value = null
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除视频失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新视频解析状态
  const updateVideoParseStatus = async (id: string, parseStatus: VideoRecord['parseStatus'], parseResult?: Partial<VideoParseResult>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await videoAPI.updateParseStatus(id, {
        parseStatus,
        parseResult
      })
      
      // 更新本地数据
      const index = videoRecords.value.findIndex(v => v.id === id)
      if (index !== -1) {
        videoRecords.value[index] = response.data
      }
      
      if (currentVideo.value?.id === id) {
        currentVideo.value = response.data
      }
      
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新视频解析状态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 使用Gemini解析视频
  const parseVideoWithGemini = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await videoAPI.parseWithGemini(id)
      
      // 更新本地数据
      const index = videoRecords.value.findIndex(v => v.id === id)
      if (index !== -1) {
        videoRecords.value[index] = response.video
      }
      
      if (currentVideo.value?.id === id) {
        currentVideo.value = response.video
      }
      
      return response
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Gemini解析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 流式解析视频
  const parseVideoWithGeminiStream = async (
    id: string,
    onProgress?: (progress: number, step: string, message: string) => void,
    onLog?: (log: string) => void,
    onComplete?: (analysis: unknown) => void,
    onError?: (error: string) => void,
    onRawResponse?: (response: string) => void
  ) => {
    isStreaming.value = true
    streamProgress.value = 0
    streamStep.value = ''
    streamLogs.value = []
    error.value = null
    
    try {
      await videoAPI.parseWithGeminiStream(
        id,
        (data) => {
          console.log('收到流式消息:', data)
          
          switch (data.type) {
            case 'connection':
              onLog?.(`连接建立: ${data.message}`)
              break
              
            case 'progress':
              streamProgress.value = data.progress
              streamStep.value = data.step
              onProgress?.(data.progress, data.step, data.message)
              onLog?.(`${data.step}: ${data.message}`)
              break
              
            case 'info':
              onLog?.(`信息: ${data.message}`)
              break
              
            case 'success':
              onLog?.(`成功: ${data.message}`)
              onComplete?.(data.analysis)
              break
              
            case 'error':
              onLog?.(`错误: ${data.message}`)
              onError?.(data.message)
              break
              
            case 'status':
              onLog?.(`状态更新: ${data.message}`)
              break
              
            case 'end':
              onLog?.(`结束: ${data.message}`)
              break
              
            case 'raw_response':
              onLog?.(`原始响应: ${data.message}`)
              onRawResponse?.(data.content || data.message)
              break
          }
        },
        (error) => {
          console.error('流式解析错误:', error)
          onError?.(error.message || '流式解析失败')
        },
        () => {
          console.log('流式解析完成')
          isStreaming.value = false
        }
      )
    } catch (err: unknown) {
      console.error('流式解析失败:', err)
      error.value = err instanceof Error ? err.message : '流式解析失败'
      onError?.(error.value)
    } finally {
      isStreaming.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 清除流式解析状态
  const clearStreamState = () => {
    isStreaming.value = false
    streamProgress.value = 0
    streamStep.value = ''
    streamLogs.value = []
  }

  return {
    // 状态
    videoRecords,
    currentVideo,
    loading,
    error,
    statistics,
    
    // 流式解析状态
    isStreaming,
    streamProgress,
    streamStep,
    streamLogs,
    
    // 计算属性
    hasVideos,
    
    // 方法
    getVideoRecords,
    getVideoDetail,
    uploadVideo,
    updateVideo,
    deleteVideo,
    updateVideoParseStatus,
    parseVideoWithGemini,
    parseVideoWithGeminiStream,
    clearError,
    clearStreamState
  }
}) 
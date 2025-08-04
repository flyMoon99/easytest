<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">视频列表</h1>
        <p class="mt-1 text-sm text-gray-500">管理您上传的所有视频文件</p>
      </div>
      <router-link
        to="/dashboard/video/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新增视频
      </router-link>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">总视频</p>
            <p class="text-lg font-semibold text-gray-900">{{ videoStore.statistics.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">等待解析</p>
            <p class="text-lg font-semibold text-gray-900">{{ videoStore.statistics.pending }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">解析中</p>
            <p class="text-lg font-semibold text-gray-900">{{ videoStore.statistics.processing }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">解析完成</p>
            <p class="text-lg font-semibold text-gray-900">{{ videoStore.statistics.completed }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">解析失败</p>
            <p class="text-lg font-semibold text-gray-900">{{ videoStore.statistics.failed }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div class="flex items-center space-x-4">
            <div>
              <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
              <select
                id="status-filter"
                v-model="filters.parseStatus"
                @change="handleFilterChange"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">全部状态</option>
                <option value="pending">等待解析</option>
                <option value="processing">解析中</option>
                <option value="completed">解析完成</option>
                <option value="failed">解析失败</option>
              </select>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
              <input
                id="search"
                v-model="filters.search"
                type="text"
                placeholder="搜索视频名称..."
                @input="handleSearchInput"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 视频列表 -->
      <div class="overflow-hidden">
        <div v-if="videoStore.loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">加载中...</p>
        </div>

        <div v-else-if="videoStore.error" class="p-8 text-center">
          <div class="text-red-600">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
            <p class="mt-1 text-sm text-gray-500">{{ videoStore.error }}</p>
          </div>
        </div>

        <div v-else-if="!videoStore.hasVideos" class="p-8 text-center">
          <!-- 调试信息 -->
          <div class="mb-4 p-4 bg-gray-100 rounded text-xs">
            <p>调试信息:</p>
            <p>loading: {{ videoStore.loading }}</p>
            <p>videoRecords.length: {{ videoStore.videoRecords.length }}</p>
            <p>hasVideos: {{ videoStore.hasVideos }}</p>
            <p>error: {{ videoStore.error }}</p>
          </div>
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无视频</h3>
          <p class="mt-1 text-sm text-gray-500">开始上传您的第一个视频文件</p>
          <div class="mt-6">
            <router-link
              to="/dashboard/video/new"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              上传视频
            </router-link>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="video in videoStore.videoRecords"
            :key="video?.id || Math.random()"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- 视频缩略图或图标 -->
                <div class="flex-shrink-0">
                  <div class="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <!-- 视频信息 -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-medium text-gray-900 truncate">{{ video?.name || '未知视频' }}</h3>
                    <span :class="getStatusStyle(video?.parseStatus || 'pending')" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getStatusText(video?.parseStatus || 'pending') }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ formatFileSize(video?.fileSize || 0) }} • {{ formatDate(video?.createdAt || new Date().toISOString()) }}
                  </p>
                  <p v-if="video?.originalName" class="text-xs text-gray-400">
                    原始文件名: {{ video.originalName }}
                  </p>
                  <p v-if="video?.parseResult?.duration" class="text-xs text-gray-400">
                    时长: {{ formatDuration(video.parseResult.duration) }}
                  </p>
                  <p v-if="video?.testDescription" class="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                    <span class="font-medium">测试说明:</span> {{ video.testDescription }}
                  </p>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center space-x-2">
                <button
                  @click="handlePlayVideo(video)"
                  class="text-sm text-blue-600 hover:text-blue-500"
                >
                  播放
                </button>
                <button
                  v-if="video?.parseStatus === 'completed' && video?.parseResult?.geminiText"
                  @click="handleShowParseResult(video)"
                  class="text-sm text-purple-600 hover:text-purple-500"
                >
                  解析结果
                </button>
                <button
                  v-if="video?.parseStatus === 'pending'"
                  @click="handleParseWithGeminiStream(video?.id, video?.name)"
                  class="text-sm text-green-600 hover:text-green-500"
                >
                  解析
                </button>
                <button
                  v-if="video?.parseStatus === 'failed'"
                  @click="handleRetryParse(video?.id)"
                  class="text-sm text-primary-600 hover:text-primary-500"
                >
                  重新解析
                </button>
                <button
                  @click="handleDeleteVideo(video?.id)"
                  class="text-sm text-red-600 hover:text-red-500"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 视频播放弹窗 -->
  <BaseVideoPlayer
    :visible="showVideoPlayer"
    :video-url="currentVideoUrl"
    :video-title="currentVideoTitle"
    :file-size="currentVideoFileSize"
    :upload-date="currentVideoUploadDate"
    :video-type="currentVideoType"
    :duration="currentVideoDuration"
    @close="handleCloseVideoPlayer"
  />

  <!-- 解析进度浮窗 -->
  <BaseParseModal
    ref="parseModalRef"
    :visible="showParseModal"
    :video-name="currentParseVideoName"
    :video-id="currentParseVideoId"
    @close="handleCloseParseModal"
    @retry="handleRetryParseStream"
  />

  <!-- 解析结果弹窗 -->
  <BaseParseResultModal
    :visible="showParseResultModal"
    :video-name="currentParseResultVideoName"
    :gemini-text="currentParseResultGeminiText"
    :parsed-at="currentParseResultParsedAt"
    @close="handleCloseParseResultModal"
  />
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import type { VideoRecord } from '@/types/video'
import BaseVideoPlayer from '@/components/base/BaseVideoPlayer.vue'
import BaseParseModal from '@/components/base/BaseParseModal.vue'
import BaseParseResultModal from '@/components/base/BaseParseResultModal.vue'

const videoStore = useVideoStore()

const filters = reactive({
  parseStatus: '',
  search: ''
})

// 播放弹窗相关状态
const showVideoPlayer = ref(false)
const currentVideoUrl = ref('')
const currentVideoTitle = ref('')
const currentVideoFileSize = ref(0)
const currentVideoUploadDate = ref('')
const currentVideoType = ref('video/mp4')
const currentVideoDuration = ref(0)

// 解析弹窗相关状态
const showParseModal = ref(false)
const currentParseVideoName = ref('')
const currentParseVideoId = ref('')
const parseModalRef = ref()

// 解析结果弹窗相关状态
const showParseResultModal = ref(false)
const currentParseResultVideoName = ref('')
const currentParseResultGeminiText = ref('')
const currentParseResultParsedAt = ref('')

// 获取状态样式
const getStatusStyle = (status: VideoRecord['parseStatus']) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return styles[status]
}

// 获取状态文本
const getStatusText = (status: VideoRecord['parseStatus']) => {
  const texts = {
    pending: '等待解析',
    processing: '解析中',
    completed: '解析完成',
    failed: '解析失败'
  }
  return texts[status]
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化时长
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

// 处理筛选变化
const handleFilterChange = () => {
  loadVideos()
}

// 处理搜索输入
const handleSearchInput = () => {
  loadVideos()
}

// 加载视频列表
const loadVideos = async () => {
  try {
    await videoStore.getVideoRecords({
      parseStatus: filters.parseStatus || undefined,
      search: filters.search || undefined
    })
  } catch (error) {
    console.error('Failed to load videos:', error)
  }
}

// 重新解析视频
const handleRetryParse = async (videoId: string) => {
  if (!videoId) {
    console.error('Video ID is undefined')
    return
  }
  try {
    await videoStore.updateVideoParseStatus(videoId, 'pending')
    // 这里可以添加重新解析的逻辑
  } catch (error) {
    console.error('Failed to retry parse:', error)
  }
}

// 使用Gemini流式解析视频
const handleParseWithGeminiStream = async (videoId: string, videoName: string) => {
  if (!videoId) {
    console.error('Video ID is undefined')
    return
  }
  
  // 设置解析弹窗状态
  currentParseVideoId.value = videoId
  currentParseVideoName.value = videoName || '未知视频'
  showParseModal.value = true
  
  try {
    console.log('开始使用Gemini流式解析视频:', videoId)
    
    await videoStore.parseVideoWithGeminiStream(
      videoId,
      // 进度回调
      (progress, step, message) => {
        if (parseModalRef.value) {
          parseModalRef.value.updateProgress(progress)
          parseModalRef.value.updateStep(step)
          parseModalRef.value.addLog(message, 'info')
        }
      },
      // 日志回调
      (log) => {
        if (parseModalRef.value) {
          parseModalRef.value.addLog(log, 'info')
        }
      },
      // 完成回调
      (analysis) => {
        if (parseModalRef.value) {
          parseModalRef.value.addLog('解析完成！', 'success')
          parseModalRef.value.updateStatus('completed')
        }
        console.log('Gemini流式解析完成，分析结果:', analysis)
      },
      // 错误回调
      (error) => {
        if (parseModalRef.value) {
          let errorMessage = `解析失败: ${error}`
                  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' && error.message.includes('认证失败')) {
          errorMessage = '认证失败，请刷新页面重新登录'
        }
          parseModalRef.value.addLog(errorMessage, 'error')
          parseModalRef.value.updateStatus('failed')
        }
        console.error('Gemini流式解析失败:', error)
        
        // 如果是认证错误，提示用户
        if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' && error.message.includes('认证失败')) {
          alert('认证失败，请刷新页面重新登录')
        }
      },
      // 原始响应回调
      (response) => {
        console.log('Gemini流式解析原始响应:', response)
        if (parseModalRef.value) {
          parseModalRef.value.updateRawResponse(response)
        }
      }
    )
    
    // 重新加载视频列表以更新状态
    await loadVideos()
    
  } catch (error) {
    console.error('Gemini流式解析失败:', error)
    if (parseModalRef.value) {
      parseModalRef.value.addLog(`解析失败: ${error}`, 'error')
      parseModalRef.value.updateStatus('failed')
    }
  }
}

// 重试流式解析
const handleRetryParseStream = async (videoId: string) => {
  await handleParseWithGeminiStream(videoId, currentParseVideoName.value)
}

// 关闭解析弹窗
const handleCloseParseModal = () => {
  showParseModal.value = false
  currentParseVideoId.value = ''
  currentParseVideoName.value = ''
  videoStore.clearStreamState()
}

// 显示解析结果弹窗
const handleShowParseResult = (video: VideoRecord) => {
  if (!video) {
    console.error('Video is undefined')
    return
  }
  
  currentParseResultVideoName.value = video.name || '未知视频'
  currentParseResultGeminiText.value = video.parseResult?.geminiText || ''
  currentParseResultParsedAt.value = video.parsedAt || ''
  showParseResultModal.value = true
}

// 关闭解析结果弹窗
const handleCloseParseResultModal = () => {
  showParseResultModal.value = false
  currentParseResultVideoName.value = ''
  currentParseResultGeminiText.value = ''
  currentParseResultParsedAt.value = ''
}

// 播放视频
const handlePlayVideo = async (video: VideoRecord) => {
  if (!video) {
    console.error('Video is undefined')
    return
  }
  
  // 从文件路径中提取文件名 - 支持不同操作系统的路径分隔符
  let fileName = video.originalName
  if (video.filePath) {
    // 使用 path.basename 的等效逻辑，支持不同路径分隔符
    const pathParts = video.filePath.split(/[/\\]/) // 支持 / 和 \ 分隔符
    fileName = pathParts[pathParts.length - 1] || video.originalName
  }
  
  // 构建视频URL
  const videoUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/videos/${fileName}`
  
  console.log('播放视频:', {
    videoName: video.name,
    filePath: video.filePath,
    fileName: fileName,
    videoUrl: videoUrl,
    mimeType: video.mimeType
  })
  
  // 先检查文件是否存在（调试用）
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/videos/${video.id}/check-file`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const result = await response.json()
    console.log('文件检查结果:', result)
  } catch (error) {
    console.error('文件检查失败:', error)
  }
  
  // 设置播放弹窗数据
  currentVideoUrl.value = videoUrl
  currentVideoTitle.value = video.name
  currentVideoFileSize.value = video.fileSize
  currentVideoUploadDate.value = video.createdAt
  currentVideoType.value = video.mimeType || 'video/mp4'
  currentVideoDuration.value = video.parseResult?.duration || 0
  
  // 显示播放弹窗
  showVideoPlayer.value = true
}

// 关闭视频播放弹窗
const handleCloseVideoPlayer = () => {
  showVideoPlayer.value = false
  // 清空当前视频数据
  currentVideoUrl.value = ''
  currentVideoTitle.value = ''
  currentVideoFileSize.value = 0
  currentVideoUploadDate.value = ''
  currentVideoType.value = 'video/mp4'
  currentVideoDuration.value = 0
}

// 删除视频
const handleDeleteVideo = async (videoId: string) => {
  if (!videoId) {
    console.error('Video ID is undefined')
    return
  }
  if (confirm('确定要删除这个视频吗？此操作不可恢复。')) {
    try {
      await videoStore.deleteVideo(videoId)
      loadVideos() // 重新加载列表
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadVideos()
})
</script>
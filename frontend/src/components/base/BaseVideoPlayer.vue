<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- 背景遮罩 -->
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="handleClose"></div>

      <!-- 弹窗内容 -->
      <div class="inline-block w-full max-w-4xl text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl">
        <!-- 弹窗头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">{{ videoTitle }}</h3>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 视频播放器 -->
        <div class="px-6 py-4">
          <div class="relative w-full bg-black rounded-lg overflow-hidden" style="aspect-ratio: 16/9;">
            <video
              ref="videoRef"
              class="w-full h-full object-contain"
              controls
              preload="metadata"
              crossorigin="anonymous"
              @loadedmetadata="handleVideoLoaded"
              @error="handleVideoError"
            >
              <source :src="videoUrl" :type="getVideoType(videoUrl, videoType)">
              您的浏览器不支持视频播放。
            </video>
            
            <!-- 视频加载错误提示 -->
            <div v-if="videoError" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div class="text-center text-white">
                <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">视频播放失败</h3>
                <p class="text-sm text-gray-300 mb-4">{{ videoError }}</p>
                <button
                  @click="retryLoadVideo"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
          
          <!-- 视频信息 -->
          <div class="mt-4 space-y-2">
            <div class="flex items-center justify-between text-sm text-gray-600">
              <span>文件大小: {{ formatFileSize(fileSize) }}</span>
              <span v-if="duration">时长: {{ formatDuration(duration) }}</span>
            </div>
            <div class="text-sm text-gray-600">
              <span>上传时间: {{ formatDate(uploadDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 弹窗底部 -->
        <div class="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  visible: boolean
  videoUrl: string
  videoTitle: string
  fileSize: number
  uploadDate: string
  videoType?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  videoType: 'video/mp4',
  duration: 0
})

// 根据文件扩展名推断MIME类型
const getVideoType = (url: string, defaultType: string) => {
  const extension = url.split('.').pop()?.toLowerCase()
  const mimeTypeMap: Record<string, string> = {
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/mp4', // Chrome不支持video/quicktime，使用video/mp4
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'asf': 'video/x-ms-asf'
  }
  return mimeTypeMap[extension || ''] || defaultType
}

const emit = defineEmits<{
  close: []
}>()

const videoPlayer = ref<HTMLVideoElement>()
const videoError = ref<string>('')

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

// 处理视频加载完成
const handleVideoLoaded = () => {
  console.log('视频加载完成:', {
    videoUrl: props.videoUrl,
    videoType: getVideoType(props.videoUrl, props.videoType),
    duration: videoPlayer.value?.duration
  })
}

// 处理视频错误
const handleVideoError = (error: Event) => {
  console.error('视频播放错误:', {
    error: error,
    videoUrl: props.videoUrl,
    videoType: getVideoType(props.videoUrl, props.videoType),
    target: error.target
  })
  
  // 尝试获取更详细的错误信息
  const videoElement = error.target as HTMLVideoElement
  if (videoElement) {
    console.error('视频错误详情:', {
      error: videoElement.error,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState
    })
    
    // 设置错误信息
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case 1:
          videoError.value = '视频加载被中断'
          break
        case 2:
          videoError.value = '网络错误，无法加载视频'
          break
        case 3:
          videoError.value = '视频解码失败，格式可能不支持'
          break
        case 4:
          videoError.value = '视频格式不支持'
          break
        default:
          videoError.value = '视频播放失败，请检查文件格式'
      }
    } else {
      videoError.value = '视频加载失败，请检查网络连接'
    }
  }
}

// 重试加载视频
const retryLoadVideo = () => {
  videoError.value = ''
  if (videoPlayer.value) {
    videoPlayer.value.load()
  }
}

// 处理关闭弹窗
const handleClose = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
  videoError.value = ''
  emit('close')
}

// 监听弹窗显示状态，自动播放视频
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 清除错误状态
    videoError.value = ''
    
    if (videoPlayer.value) {
      // 延迟一下确保DOM已更新
      setTimeout(() => {
        if (videoPlayer.value) {
          videoPlayer.value.play().catch(error => {
            console.error('自动播放失败:', error)
          })
        }
      }, 100)
    }
  }
})
</script>
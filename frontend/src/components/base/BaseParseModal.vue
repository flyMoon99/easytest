<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <!-- 模态框内容 -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <!-- 头部 -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div class="ml-3">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Gemini 视频解析
                </h3>
                <p class="text-sm text-gray-500">
                  正在分析视频: {{ videoName }}
                </p>
              </div>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 进度条 -->
          <div class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>{{ currentStep }}</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>

          <!-- 状态指示器 -->
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <div v-if="status === 'processing'" class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div v-else-if="status === 'completed'" class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div v-else-if="status === 'failed'" class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">{{ statusText }}</p>
              <p class="text-sm text-gray-500">{{ statusDescription }}</p>
            </div>
          </div>
        </div>

        <!-- 解析日志 -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6">
          <div class="max-h-64 overflow-y-auto">
            <div class="text-sm font-medium text-gray-700 mb-2">解析日志:</div>
            <div class="bg-white rounded border p-3 space-y-2">
              <div 
                v-for="(log, index) in parseLogs" 
                :key="index"
                class="text-xs"
                :class="getLogClass(log.type)"
              >
                <span class="font-mono">{{ formatTime(log.timestamp) }}</span>
                <span class="ml-2">{{ log.message }}</span>
              </div>
              <div v-if="parseLogs.length === 0" class="text-gray-400 text-xs">
                等待开始解析...
              </div>
            </div>
          </div>
          
          <!-- Gemini原始响应内容 -->
          <div v-if="rawResponse" class="mt-4">
            <div class="text-sm font-medium text-gray-700 mb-2">Gemini原始响应:</div>
            <div class="bg-gray-900 text-green-400 rounded border p-3 max-h-48 overflow-y-auto">
              <pre class="text-xs whitespace-pre-wrap">{{ rawResponse }}</pre>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            v-if="status === 'completed'"
            @click="handleClose"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            完成
          </button>
          <button
            v-else-if="status === 'failed'"
            @click="handleRetry"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            重试
          </button>
          <button
            v-else
            @click="handleClose"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface ParseLog {
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

interface Props {
  visible: boolean
  videoName: string
  videoId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'retry', videoId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const status = ref<'processing' | 'completed' | 'failed'>('processing')
const progress = ref(0)
const currentStep = ref('准备中...')
const parseLogs = ref<ParseLog[]>([])
const rawResponse = ref('')

// 计算属性
const statusText = computed(() => {
  switch (status.value) {
    case 'processing':
      return '解析中'
    case 'completed':
      return '解析完成'
    case 'failed':
      return '解析失败'
    default:
      return '准备中'
  }
})

const statusDescription = computed(() => {
  switch (status.value) {
    case 'processing':
      return '正在使用Gemini AI分析视频内容...'
    case 'completed':
      return '视频分析已完成，结果已保存到数据库'
    case 'failed':
      return '解析过程中遇到错误，请重试'
    default:
      return '正在初始化解析任务...'
  }
})

// 方法
const addLog = (message: string, type: ParseLog['type'] = 'info') => {
  parseLogs.value.push({
    timestamp: new Date(),
    message,
    type
  })
}

const getLogClass = (type: ParseLog['type']) => {
  const classes = {
    info: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  }
  return classes[type]
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleClose = () => {
  emit('close')
}

const handleRetry = () => {
  emit('retry', props.videoId)
}

// 监听visible变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 重置状态
    status.value = 'processing'
    progress.value = 0
    currentStep.value = '准备中...'
    parseLogs.value = []
    rawResponse.value = '' // 重置原始响应
    
    // 开始解析流程
    startParseProcess()
  }
})

// 开始解析流程
const startParseProcess = async () => {
  try {
    addLog('开始初始化Gemini解析任务...', 'info')
    progress.value = 10
    currentStep.value = '初始化解析任务'
    
    // 模拟解析步骤
    await simulateParseSteps()
    
  } catch (error) {
    addLog(`解析失败: ${error}`, 'error')
    status.value = 'failed'
    progress.value = 0
  }
}

// 模拟解析步骤
const simulateParseSteps = async () => {
  const steps = [
    { step: '检查视频文件', progress: 20, duration: 1000 },
    { step: '上传视频到Gemini API', progress: 40, duration: 2000 },
    { step: 'AI分析视频内容', progress: 60, duration: 3000 },
    { step: '生成分析报告', progress: 80, duration: 2000 },
    { step: '保存结果到数据库', progress: 100, duration: 1000 }
  ]
  
  for (const step of steps) {
    currentStep.value = step.step
    addLog(`正在${step.step}...`, 'info')
    
    await new Promise(resolve => setTimeout(resolve, step.duration))
    
    progress.value = step.progress
    
    if (step.progress === 100) {
      addLog('解析完成！', 'success')
      status.value = 'completed'
    }
  }
}

// 暴露方法给父组件
defineExpose({
  addLog,
  updateProgress: (newProgress: number) => {
    progress.value = newProgress
  },
  updateStatus: (newStatus: 'processing' | 'completed' | 'failed') => {
    status.value = newStatus
  },
  updateStep: (newStep: string) => {
    currentStep.value = newStep
  },
  updateRawResponse: (response: string) => {
    rawResponse.value = response
  }
})
</script> 
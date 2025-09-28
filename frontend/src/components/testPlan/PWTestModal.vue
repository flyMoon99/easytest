<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="PW测试执行"
    size="lg"
  >
    <div class="space-y-6">
      <!-- 测试用例信息 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">测试用例信息</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">用例名称：</span>
            <span class="text-gray-900">{{ testCase?.title }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">目标URL：</span>
            <span class="text-gray-900">{{ testCase?.entryUrl }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">用例等级：</span>
            <span class="text-gray-900">{{ testCase?.level || '中' }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">当前状态：</span>
            <span class="text-gray-900">{{ getStatusText(testCase?.result) }}</span>
          </div>
        </div>
      </div>

      <!-- 执行配置 -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">执行配置</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">执行模式</label>
            <select v-model="config.executionMode" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="headless">无头模式</option>
              <option value="headed">有头模式</option>
              <option value="debug">调试模式</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">浏览器类型</label>
            <select v-model="config.browserType" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 执行状态 -->
      <div v-if="executionStatus" class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-medium text-blue-900">执行状态</h3>
          <span class="text-sm text-blue-600">{{ formatDuration(executionStatus.duration) }}</span>
        </div>
        
        <div class="space-y-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-blue-900">{{ executionStatus.currentStep }}</span>
              <span class="text-sm text-blue-600">{{ executionStatus.progress }}%</span>
            </div>
            <!-- 进度条 -->
            <div v-if="executionStatus.progress > 0" class="w-full bg-blue-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${executionStatus.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium text-gray-900">执行日志</h3>
          <BaseButton
            v-if="executionLogs.length > 0"
            variant="outline"
            size="sm"
            @click="handleClearLogs"
            :disabled="loading"
          >
            清空日志
          </BaseButton>
        </div>
        <!-- 日志输出区域 - 终端风格 -->
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto max-h-80 min-h-40">
          <div v-if="executionLogs.length === 0" class="text-gray-500">
            等待测试开始...
          </div>
          <div v-else>
            <div 
              v-for="(log, index) in executionLogs" 
              :key="index"
              class="mb-1 whitespace-pre-wrap"
              :class="{
                'text-green-400': log.level === 'info',
                'text-yellow-400': log.level === 'warn',
                'text-red-400': log.level === 'error',
                'text-blue-400': log.level === 'success'
              }"
            >
              <span class="text-gray-500">[{{ formatTime(log.timestamp) }}]</span> {{ log.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 执行结果 -->
      <div v-if="executionResult" class="p-4 rounded-lg" :class="{
        'bg-green-50 border border-green-200': executionResult.success,
        'bg-red-50 border border-red-200': !executionResult.success
      }">
        <div class="flex items-center mb-3">
          <svg v-if="executionResult.success" class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium" :class="{
            'text-green-900': executionResult.success,
            'text-red-900': !executionResult.success
          }">
            {{ executionResult.success ? '测试执行成功' : '测试执行失败' }}
          </h3>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">执行时长：</span>
            <span class="text-sm text-gray-900">{{ executionResult.duration }}ms</span>
          </div>
          
          <!-- 执行摘要 -->
          <div v-if="executionResult.summary" class="mt-3 text-sm" :class="{
            'text-green-700': executionResult.success,
            'text-red-700': !executionResult.success
          }">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p><span class="font-medium">总步骤:</span> {{ executionResult.summary.totalSteps }}</p>
                <p><span class="font-medium">成功步骤:</span> {{ executionResult.summary.successfulSteps }}</p>
              </div>
              <div>
                <p><span class="font-medium">失败步骤:</span> {{ executionResult.summary.failedSteps }}</p>
                <p><span class="font-medium">成功率:</span> {{ executionResult.summary.successRate }}%</p>
              </div>
            </div>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="!executionResult.success && executionResult.error" class="mt-3 p-3 bg-red-100 rounded-lg text-sm text-red-800">
            <span class="font-medium">错误信息：</span>
            {{ typeof executionResult.error === 'string' ? executionResult.error : executionResult.error.message }}
          </div>
        </div>
      </div>

    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <BaseButton
        variant="outline"
        @click="handleClose"
        :disabled="loading"
      >
        关闭
      </BaseButton>
      <BaseButton
        v-if="!executionStatus"
        variant="primary"
        @click="handleRunPWTest"
        :loading="loading"
      >
        开始PW测试
      </BaseButton>
      <BaseButton
        v-else
        variant="error"
        @click="handleStopExecution"
        :loading="loading"
      >
        停止执行
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { pwTestApi } from '@/services/pwTestApi'

interface TestCase {
  id: string
  title: string
  entryUrl: string
  description: string
  level?: string
  result?: string
}

interface Props {
  modelValue: boolean
  testCase?: TestCase
}

const props = withDefaults(defineProps<Props>(), {
  testCase: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [result: any]
}>()

// 状态
const loading = ref(false)
const executionStatus = ref<any>(null)
const executionLogs = ref<any[]>([])
const executionResult = ref<any>(null)

// 配置
const config = ref({
  executionMode: 'headless',
  browserType: 'chromium'
})

// 监听弹窗打开
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.testCase) {
    resetState()
    loadPWTestStatus()
  }
})

// 重置状态
const resetState = () => {
  executionStatus.value = null
  executionLogs.value = []
  executionResult.value = null
}

// 加载PW测试状态
const loadPWTestStatus = async () => {
  if (!props.testCase) return
  
  try {
    loading.value = true
    const response = await pwTestApi.getStatus(props.testCase.testCaseId)
    
  } catch (error) {
    console.error('加载PW测试状态失败:', error)
  } finally {
    loading.value = false
  }
}

// 执行PW测试
const handleRunPWTest = async () => {
  if (!props.testCase) return
  
  console.log('开始执行PW测试，测试用例:', {
    id: props.testCase.id,
    testCaseId: props.testCase.testCaseId,
    title: props.testCase.title,
    memberId: props.testCase.memberId
  })
  
  try {
    loading.value = true
    resetState()
    
    // 清空之前的日志
    executionLogs.value = []
    
    // 开始执行
    executionStatus.value = {
      currentStep: '正在启动PW测试...',
      progress: 0,
      duration: 0
    }
    
    // 使用流式执行
    const eventSource = pwTestApi.runStreamingTest(props.testCase.testCaseId, {
      executionMode: config.value.executionMode,
      browserType: config.value.browserType
    })
    
    // 监听SSE事件
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleSSEEvent(data)
      } catch (error) {
        console.error('解析SSE事件失败:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error)
      
      // 检查连接状态
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE连接已关闭')
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('SSE连接正在重连...')
        return // 正在重连，不处理错误
      }
      
      executionResult.value = {
        success: false,
        error: { message: '连接错误，请检查网络连接或稍后重试' }
      }
      loading.value = false
      executionStatus.value = null
      eventSource.close()
    }
    
    // 添加连接打开事件处理
    eventSource.onopen = (event) => {
      console.log('SSE连接已建立:', event)
    }
    
  } catch (error) {
    console.error('PW测试执行失败:', error)
    executionResult.value = {
      success: false,
      error: { message: error instanceof Error ? error.message : '执行失败' }
    }
    loading.value = false
    executionStatus.value = null
  }
}

// 处理SSE事件
const handleSSEEvent = (data: any) => {
  console.log('收到SSE事件:', data)
  
  switch (data.type) {
    case 'connection':
      addLog('info', data.message)
      break
      
    case 'start':
      executionStatus.value = {
        currentStep: data.message,
        progress: 5,
        duration: 0
      }
      addLog('info', data.message)
      break
      
    case 'log':
      addLog('info', data.message)
      break
      
    case 'step':
      executionStatus.value = {
        currentStep: data.message,
        progress: data.progress || 0,
        duration: Date.now()
      }
      addLog('info', data.message)
      break
      
    case 'step_complete':
      executionStatus.value = {
        currentStep: data.message,
        progress: data.progress || 0,
        duration: Date.now()
      }
      addLog('success', data.message)
      break
      
    case 'browser_action':
      addLog('info', data.message)
      break
      
    case 'test_step':
      addLog('info', `步骤 ${data.step}: ${data.message}`)
      break
      
    case 'test_step_complete':
      addLog('success', `步骤 ${data.step}: ${data.message}`)
      break
      
    case 'complete':
      executionStatus.value = {
        currentStep: '测试执行完成',
        progress: 100,
        duration: Date.now()
      }
      
      if (data.success) {
        addLog('success', '测试执行成功')
      } else {
        addLog('error', data.error || '测试执行失败')
      }
      
      // 保存最终结果
      executionResult.value = {
        success: data.success,
        error: data.error,
        summary: data.summary,
        duration: data.duration || 0
      }
      
      loading.value = false
      executionStatus.value = null
      emit('success', { success: data.success, summary: data.summary })
      break
      
    case 'error':
      addLog('error', data.message)
      executionResult.value = {
        success: false,
        error: data.message,
        duration: 0
      }
      loading.value = false
      executionStatus.value = null
      break
  }
}

// 添加日志
const addLog = (level: string, message: string) => {
  executionLogs.value.push({
    level,
    message,
    timestamp: new Date()
  })
  
  // 自动滚动到底部
  setTimeout(() => {
    const logContainer = document.querySelector('.overflow-y-auto')
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  }, 100)
}

// 清空日志
const handleClearLogs = () => {
  executionLogs.value = []
  executionResult.value = null
}

// 格式化持续时间
const formatDuration = (duration: number) => {
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}



// 停止执行
const handleStopExecution = () => {
  loading.value = false
  executionStatus.value = null
  addLog('warn', '用户手动停止执行')
  
  // 如果有EventSource连接，关闭它
  // 这里需要在handleRunPWTest中保存eventSource引用
}

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false)
}

// 工具函数
const getStatusText = (result?: string) => {
  switch (result) {
    case 'pass':
      return '通过'
    case 'fail':
      return '失败'
    case 'blocked':
      return '阻塞'
    case 'skipped':
      return '跳过'
    default:
      return '未执行'
  }
}


const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
/* 自定义样式 */
</style>

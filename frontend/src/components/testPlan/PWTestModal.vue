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
      <div v-if="executionStatus" class="bg-yellow-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">执行状态</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">当前步骤：</span>
            <span class="text-sm text-gray-900">{{ executionStatus.currentStep }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">执行进度：</span>
            <span class="text-sm text-gray-900">{{ executionStatus.progress }}%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">执行时间：</span>
            <span class="text-sm text-gray-900">{{ executionStatus.duration }}s</span>
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <div v-if="executionLogs.length > 0" class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">执行日志</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="(log, index) in executionLogs"
            :key="index"
            class="flex items-start space-x-2 p-2 rounded border-l-4"
            :class="getLogBorderClass(log.level)"
          >
            <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" :class="getLogDotClass(log.level)"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium" :class="getLogClass(log.level)">
                {{ log.message }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ formatTime(log.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行结果 -->
      <div v-if="executionResult" class="bg-green-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">执行结果</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">执行状态：</span>
            <span :class="getResultClass(executionResult.success)">
              {{ executionResult.success ? '成功' : '失败' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">执行时长：</span>
            <span class="text-sm text-gray-900">{{ executionResult.duration }}ms</span>
          </div>
          <div v-if="executionResult.error" class="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
            <span class="font-medium">错误信息：</span>
            {{ executionResult.error.message }}
          </div>
        </div>
      </div>

      <!-- 代码预览 -->
      <div v-if="generatedCode" class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900 mb-2">生成的代码</h3>
        <div class="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
          <pre>{{ generatedCode }}</pre>
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
const generatedCode = ref<string>('')

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
  generatedCode.value = ''
}

// 加载PW测试状态
const loadPWTestStatus = async () => {
  if (!props.testCase) return
  
  try {
    loading.value = true
    const response = await pwTestApi.getStatus(props.testCase.testCaseId)
    
    if (response && response.hasGeneratedCode) {
      // 如果有生成的代码，显示代码预览
      generatedCode.value = response.generatedCode?.fullScript || ''
    }
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
    case 'start':
      executionStatus.value = {
        currentStep: data.message,
        progress: 0,
        duration: 0
      }
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
      
      // 保存生成的数据
      if (data.data) {
        if (data.step === 'code_generation') {
          generatedCode.value = data.data.fullScript || ''
        }
      }
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
        currentStep: data.message,
        progress: 100,
        duration: Date.now()
      }
      addLog('success', data.message)
      
      // 保存最终结果
      if (data.data) {
        executionResult.value = data.data.executionResult
        generatedCode.value = data.data.generatedCode?.fullScript || ''
      }
      
      loading.value = false
      executionStatus.value = null
      emit('success', data.data)
      break
      
    case 'error':
      addLog('error', data.message)
      executionResult.value = {
        success: false,
        error: { message: data.message }
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
}



// 停止执行
const handleStopExecution = () => {
  executionStatus.value = null
  executionLogs.value.push({
    level: 'warn',
    message: '用户手动停止执行',
    timestamp: new Date()
  })
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

const getResultClass = (success: boolean) => {
  return success ? 'text-green-600' : 'text-red-600'
}

const getLogClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'text-red-600'
    case 'warn':
      return 'text-yellow-600'
    case 'success':
      return 'text-green-600'
    case 'info':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}

const getLogBorderClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'border-red-500 bg-red-50'
    case 'warn':
      return 'border-yellow-500 bg-yellow-50'
    case 'success':
      return 'border-green-500 bg-green-50'
    case 'info':
      return 'border-blue-500 bg-blue-50'
    default:
      return 'border-gray-300 bg-gray-50'
  }
}

const getLogDotClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'bg-red-500'
    case 'warn':
      return 'bg-yellow-500'
    case 'success':
      return 'bg-green-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
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

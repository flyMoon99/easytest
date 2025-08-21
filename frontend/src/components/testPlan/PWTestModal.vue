<template>
  <BaseModal
    v-model="modelValue"
    title="PW测试执行"
    size="lg"
    :loading="loading"
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
        <div class="max-h-40 overflow-y-auto space-y-1">
          <div
            v-for="(log, index) in executionLogs"
            :key="index"
            class="text-sm font-mono"
            :class="getLogClass(log.level)"
          >
            <span class="text-gray-500">[{{ formatTime(log.timestamp) }}]</span>
            <span class="ml-2">{{ log.message }}</span>
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
        variant="danger"
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
    const response = await pwTestApi.getStatus(props.testCase.id)
    
    if (response.success) {
      const status = response.data
      if (status.hasGeneratedCode) {
        // 如果有生成的代码，显示代码预览
        generatedCode.value = status.generatedCode?.fullScript || ''
      }
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
  
  try {
    loading.value = true
    resetState()
    
    // 开始执行
    executionStatus.value = {
      currentStep: '正在启动PW测试...',
      progress: 0,
      duration: 0
    }
    
    const response = await pwTestApi.runCompleteTest(props.testCase.id, {
      executionMode: config.value.executionMode,
      browserType: config.value.browserType
    })
    
    if (response.success) {
      executionResult.value = response.data.executionResult
      generatedCode.value = response.data.generatedCode?.fullScript || ''
      
      // 模拟执行过程
      simulateExecutionProcess()
    } else {
      executionResult.value = {
        success: false,
        error: { message: response.message || '执行失败' }
      }
    }
    
    emit('success', response.data)
    
  } catch (error) {
    console.error('PW测试执行失败:', error)
    executionResult.value = {
      success: false,
      error: { message: error instanceof Error ? error.message : '执行失败' }
    }
  } finally {
    loading.value = false
    executionStatus.value = null
  }
}

// 模拟执行过程
const simulateExecutionProcess = () => {
  const steps = [
    '自然语言理解分析...',
    '生成Playwright代码...',
    '代码验证和优化...',
    '启动浏览器...',
    '访问目标页面...',
    '执行测试步骤...',
    '验证测试结果...',
    '生成执行报告...'
  ]
  
  let currentStep = 0
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      executionStatus.value = {
        currentStep: steps[currentStep],
        progress: Math.round((currentStep + 1) / steps.length * 100),
        duration: currentStep + 1
      }
      
      // 添加日志
      executionLogs.value.push({
        level: 'info',
        message: steps[currentStep],
        timestamp: new Date()
      })
      
      currentStep++
    } else {
      clearInterval(interval)
    }
  }, 1000)
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
    case 'info':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
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

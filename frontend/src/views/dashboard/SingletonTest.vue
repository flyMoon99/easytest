<template>
  <div class="h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">单例测试</h1>
        <p class="text-gray-600">直接使用Playwright MCP进行实时测试</p>
      </div>
    </div>

    <!-- 主要内容区域 - 左右布局 -->
    <div class="flex-1 flex gap-6 min-h-0">
      <!-- 左侧：测试用例输入 -->
      <div class="w-1/2 flex flex-col">
        <BaseCard title="测试用例配置" class="flex-1 flex flex-col">
          <form @submit.prevent="handleExecuteTest" class="flex-1 flex flex-col space-y-4">
            <BaseInput
              v-model="testCase.title"
              label="测试标题"
              placeholder="请输入测试标题，例如：登录功能测试"
              required
            />

            <BaseInput
              v-model="testCase.entryUrl"
              type="url"
              label="入口URL"
              placeholder="请输入测试页面URL，例如：https://example.com"
              required
            />

            <!-- 用例等级选择 -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700">
                测试等级
              </label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="testCase.level"
                    value="高"
                    class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">高</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="testCase.level"
                    value="中"
                    class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">中</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    v-model="testCase.level"
                    value="低"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">低</span>
                </label>
              </div>
            </div>

            <div class="flex-1 flex flex-col space-y-1">
              <label class="block text-sm font-medium text-gray-700">
                测试描述
                <span class="text-red-500 ml-1">*</span>
              </label>
              <textarea
                v-model="testCase.description"
                rows="8"
                class="flex-1 input-base resize-none"
                placeholder="请详细描述测试步骤，例如：&#10;1. 访问登录页面&#10;2. 输入用户名和密码&#10;3. 点击登录按钮&#10;4. 验证登录成功"
                required
              ></textarea>
            </div>

            <div class="flex justify-end space-x-4 pt-4 border-t">
              <BaseButton
                type="button"
                variant="outline"
                @click="handleReset"
                :disabled="isExecuting"
              >
                重置
              </BaseButton>
              <BaseButton
                type="submit"
                :loading="isExecuting"
                :disabled="!isFormValid"
              >
                {{ isExecuting ? '执行中...' : '开始测试' }}
              </BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>

      <!-- 右侧：实时执行日志 -->
      <div class="w-1/2 flex flex-col">
        <BaseCard title="执行日志" class="flex-1 flex flex-col">
          <div class="flex-1 flex flex-col min-h-0">
            <!-- 执行状态 -->
            <div v-if="executionStatus" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-blue-900">{{ executionStatus.currentStep }}</span>
                <span class="text-xs text-blue-600">{{ formatDuration(executionStatus.duration) }}</span>
              </div>
              <div v-if="executionStatus.progress > 0" class="mt-2">
                <div class="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${executionStatus.progress}%` }"
                  ></div>
                </div>
                <span class="text-xs text-blue-600">{{ executionStatus.progress }}%</span>
              </div>
            </div>

            <!-- 日志输出区域 -->
            <div class="flex-1 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto min-h-0">
              <div v-if="logs.length === 0" class="text-gray-500">
                等待测试开始...
              </div>
              <div v-else>
                <div 
                  v-for="(log, index) in logs" 
                  :key="index"
                  class="mb-1 whitespace-pre-wrap"
                  :class="{
                    'text-green-400': log.type === 'info',
                    'text-yellow-400': log.type === 'warning',
                    'text-red-400': log.type === 'error',
                    'text-blue-400': log.type === 'success'
                  }"
                >
                  <span class="text-gray-500">[{{ formatTime(log.timestamp) }}]</span> {{ log.message }}
                </div>
              </div>
            </div>

            <!-- 执行结果 -->
            <div v-if="executionResult" class="mt-4 p-3 rounded-lg" :class="{
              'bg-green-50 border border-green-200': executionResult.success,
              'bg-red-50 border border-red-200': !executionResult.success
            }">
              <div class="flex items-center">
                <svg v-if="executionResult.success" class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium" :class="{
                  'text-green-900': executionResult.success,
                  'text-red-900': !executionResult.success
                }">
                  {{ executionResult.success ? '测试执行成功' : '测试执行失败' }}
                </span>
              </div>
              <div v-if="executionResult.summary" class="mt-2 text-sm" :class="{
                'text-green-700': executionResult.success,
                'text-red-700': !executionResult.success
              }">
                <p>总步骤: {{ executionResult.summary.totalSteps }}</p>
                <p>成功步骤: {{ executionResult.summary.successfulSteps }}</p>
                <p>失败步骤: {{ executionResult.summary.failedSteps }}</p>
                <p>成功率: {{ executionResult.summary.successRate }}%</p>
              </div>
              <div v-if="!executionResult.success && executionResult.error" class="mt-2 text-sm text-red-700">
                错误信息: {{ executionResult.error }}
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <BaseButton
                type="button"
                variant="outline"
                size="sm"
                @click="handleClearLogs"
                :disabled="isExecuting"
              >
                清空日志
              </BaseButton>
              <BaseButton
                v-if="isExecuting"
                type="button"
                variant="outline"
                size="sm"
                @click="handleStopTest"
              >
                停止测试
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { singletonTestAPI } from '@/services/singletonTestApi'

// 测试用例数据
const testCase = reactive({
  title: '',
  entryUrl: '',
  description: '',
  level: '中'
})

// 执行状态
const isExecuting = ref(false)
const executionStatus = ref<{
  currentStep: string
  progress: number
  duration: number
} | null>(null)

// 日志数据
const logs = ref<Array<{
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: Date
}>>([])

// 执行结果
const executionResult = ref<{
  success: boolean
  error?: string
  summary?: {
    totalSteps: number
    successfulSteps: number
    failedSteps: number
    successRate: number
  }
} | null>(null)

// 计算属性
const isFormValid = computed(() => {
  return testCase.title && testCase.entryUrl && testCase.description
})

// 添加日志
const addLog = (type: 'info' | 'warning' | 'error' | 'success', message: string) => {
  logs.value.push({
    type,
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

// 执行测试
const handleExecuteTest = async () => {
  if (!isFormValid.value || isExecuting.value) return

  try {
    isExecuting.value = true
    executionResult.value = null
    logs.value = []
    
    executionStatus.value = {
      currentStep: '正在初始化测试...',
      progress: 0,
      duration: 0
    }

    addLog('info', '开始执行单例测试')
    addLog('info', `测试标题: ${testCase.title}`)
    addLog('info', `入口URL: ${testCase.entryUrl}`)
    addLog('info', `测试等级: ${testCase.level}`)

    const startTime = Date.now()

    // 调用后端API执行测试
    const result = await singletonTestAPI.executeTest({
      title: testCase.title,
      entryUrl: testCase.entryUrl,
      description: testCase.description,
      level: testCase.level
    }, {
      onLog: (message: string) => {
        addLog('info', message)
      },
      onProgress: (step: string, progress: number) => {
        executionStatus.value = {
          currentStep: step,
          progress,
          duration: Date.now() - startTime
        }
      },
      onError: (error: string) => {
        addLog('error', error)
      },
      onSuccess: (message: string) => {
        addLog('success', message)
      }
    })

    executionResult.value = result
    
    if (result && result.success) {
      addLog('success', '测试执行完成')
    } else {
      addLog('error', `测试执行失败: ${result?.error || '未知错误'}`)
    }

  } catch (error) {
    console.error('执行测试失败:', error)
    addLog('error', `执行测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    executionResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    isExecuting.value = false
    executionStatus.value = null
  }
}

// 重置表单
const handleReset = () => {
  testCase.title = ''
  testCase.entryUrl = ''
  testCase.description = ''
  testCase.level = '中'
  logs.value = []
  executionResult.value = null
  executionStatus.value = null
}

// 清空日志
const handleClearLogs = () => {
  logs.value = []
  executionResult.value = null
}

// 停止测试
const handleStopTest = () => {
  // TODO: 实现停止测试逻辑
  isExecuting.value = false
  executionStatus.value = null
  addLog('warning', '测试已被用户停止')
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
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
</script>

<style scoped>
.input-base {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}
</style>

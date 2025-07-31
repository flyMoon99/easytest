<template>
  <div class="space-y-6">
    <!-- 页面标题和操作 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <BaseButton 
          variant="outline" 
          size="sm"
          @click="router.back()"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </BaseButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">测试详情</h1>
          <p v-if="currentTest" class="text-gray-600">{{ currentTest.title }}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <BaseButton 
          v-if="currentTest?.status === 'completed'"
          variant="outline"
          @click="handleGenerateReport"
        >
          生成报告
        </BaseButton>
        <BaseButton 
          v-if="currentTest && ['pending', 'failed'].includes(currentTest.status)"
          variant="primary"
          :loading="testStore.loading"
          @click="handleExecuteTest"
        >
          开始截图
        </BaseButton>
        <BaseButton 
          v-if="currentTest && currentTest.status === 'screened' && currentTest.screenshotUrl"
          variant="primary"
          :loading="aiAnalyzing"
          @click="handleAIAnalysis"
        >
          {{ aiAnalyzing ? 'AI解析中...' : '开始解析' }}
        </BaseButton>
        <BaseButton 
          variant="outline"
          @click="handleDeleteTest"
        >
          删除测试
        </BaseButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="testStore.loading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">加载测试详情...</span>
      </div>
    </div>

    <!-- 测试不存在 -->
    <div v-else-if="!currentTest" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28c2.624 0 4.928 1.006 6.713 2.714M30 20a6 6 0 11-12 0 6 6 0 0112 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">测试不存在</h3>
      <p class="mt-1 text-gray-500">找不到指定的测试记录</p>
      <div class="mt-6">
        <BaseButton @click="router.push('/dashboard/test/records')">
          返回测试记录
        </BaseButton>
      </div>
    </div>

    <!-- 测试详情内容 -->
    <template v-else>
      <!-- 测试信息和测试过程并排展示 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：测试基本信息 -->
        <BaseCard title="测试信息">
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">测试标题</h4>
              <p class="text-gray-900">{{ currentTest.title }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">测试状态</h4>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusStyle(currentTest.status)
              ]">
                <span :class="[
                  'w-1.5 h-1.5 rounded-full mr-1.5',
                  getStatusDotColor(currentTest.status)
                ]"></span>
                {{ getStatusText(currentTest.status) }}
              </span>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">测试入口URL</h4>
              <a 
                :href="currentTest.entryUrl" 
                target="_blank"
                class="text-primary-600 hover:text-primary-500 break-all"
              >
                {{ currentTest.entryUrl }}
              </a>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">创建时间</h4>
              <p class="text-gray-900">{{ formatDateTime(currentTest.createdAt) }}</p>
            </div>
            <div v-if="currentTest.completedAt">
              <h4 class="text-sm font-medium text-gray-500 mb-2">完成时间</h4>
              <p class="text-gray-900">{{ formatDateTime(currentTest.completedAt) }}</p>
            </div>
            <div v-if="currentTest.duration">
              <h4 class="text-sm font-medium text-gray-500 mb-2">执行时长</h4>
              <p class="text-gray-900">{{ formatDuration(currentTest.duration) }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">测试描述</h4>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-gray-900 whitespace-pre-wrap">{{ currentTest.description }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
        
        <!-- 右侧：测试过程展示框 -->
        <BaseCard title="测试过程">
          <div v-if="currentTest?.status === 'pending'" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">等待执行</h3>
            <p class="mt-1 text-sm text-gray-500">点击"开始执行"按钮开始测试</p>
          </div>
          
          <div v-else-if="currentTest?.status === 'screened'" class="text-center py-8">
            <div class="flex justify-center">
              <svg class="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 class="mt-2 text-sm font-medium text-gray-900">截图已完成</h3>
            <p class="mt-1 text-sm text-gray-500">正在等待AI解析...</p>
          </div>
          
          <div v-else-if="currentTest?.status === 'analyzed'" class="text-center py-8">
            <div class="flex justify-center">
              <svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 class="mt-2 text-sm font-medium text-gray-900">AI解析已完成</h3>
            <p class="mt-1 text-sm text-gray-500">正在等待执行...</p>
          </div>
          
          <div v-else-if="currentTest?.status === 'completed' && currentTest.screenshotUrl" class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-2">网页截图</h4>
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <img 
                  :src="currentTest.screenshotUrl ? `http://localhost:3001${currentTest.screenshotUrl}` : ''"
                  :alt="`${currentTest.title} 截图`"
                  class="w-full h-auto"
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
              </div>
              <p class="text-xs text-gray-500 mt-2">
                测试入口URL: {{ currentTest.entryUrl }}
              </p>
            </div>
            
            <div v-if="currentTest.result">
              <h4 class="text-sm font-medium text-gray-900 mb-2">执行结果</h4>
              <div :class="[
                'border rounded-lg p-3',
                currentTest.result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              ]">
                <p :class="[
                  'text-sm',
                  currentTest.result.success ? 'text-green-800' : 'text-red-800'
                ]">
                  {{ currentTest.result.message }}
                </p>
                <p v-if="currentTest.result.errorDetails" class="text-xs text-gray-600 mt-1">
                  错误详情: {{ currentTest.result.errorDetails }}
                </p>
              </div>
            </div>
          </div>
          
          <div v-else-if="currentTest?.status === 'failed'" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">执行失败</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ currentTest.result?.message || '测试执行过程中出现错误' }}
            </p>
            <p v-if="currentTest.result?.errorDetails" class="mt-1 text-xs text-gray-400">
              错误详情: {{ currentTest.result.errorDetails }}
            </p>
            <div class="mt-4">
              <BaseButton 
                variant="primary"
                size="sm"
                :loading="testStore.loading"
                @click="handleExecuteTest"
              >
                重新执行
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- 完整录屏 -->
      <BaseCard 
        v-if="currentTest.videoUrl && currentTest.status === 'completed'"
        title="完整测试录屏"
      >
        <div class="aspect-video bg-black rounded-lg overflow-hidden">
          <video 
            :src="currentTest.videoUrl"
            controls
            class="w-full h-full"
            poster="/video-placeholder.svg"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          完整测试过程录屏，总时长 {{ formatDuration(currentTest.duration || 0) }}
        </p>
      </BaseCard>

      <!-- AI分析结果 -->
      <BaseCard 
        v-if="currentTest.aiAnalysis?.analysis"
        title="AI分析结果"
      >
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">分析模型</h4>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ currentTest.aiAnalysis.aiModel }}
            </span>
          </div>
          <div v-if="currentTest.aiAnalysis.testType">
            <h4 class="text-sm font-medium text-gray-900 mb-2">测试类型</h4>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {{ currentTest.aiAnalysis.testType }}
            </span>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">AI分析内容</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-gray-900 whitespace-pre-wrap">{{ currentTest.aiAnalysis.analysis }}</p>
            </div>
          </div>
          <div v-if="currentTest.aiAnalysis.analyzedAt">
            <h4 class="text-sm font-medium text-gray-900 mb-2">分析时间</h4>
            <p class="text-gray-600 text-sm">{{ formatDateTime(currentTest.aiAnalysis.analyzedAt) }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- Playwright脚本执行详情 -->
      <BaseCard title="Playwright执行脚本">
        <div v-if="currentTest.playwrightScripts.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            {{ currentTest.status === 'pending' ? '等待生成脚本' : (currentTest.aiAnalysis?.analysis ? 'AI分析已完成' : '脚本生成中') }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ currentTest.status === 'pending' ? '点击"开始测试"或"重新测试"开始' : (currentTest.aiAnalysis?.analysis ? 'AI已分析页面元素并生成测试脚本' : '正在解析测试需求并生成脚本...') }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="(script, index) in currentTest.playwrightScripts" 
            :key="script.id"
            class="border border-gray-200 rounded-lg"
          >
            <div class="p-4 bg-gray-50 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span class="flex items-center justify-center w-6 h-6 bg-primary-600 text-white text-xs font-medium rounded-full">
                    {{ script.step }}
                  </span>
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ script.description || `步骤 ${script.step}` }}
                    </h4>
                    <p class="text-xs text-gray-500">
                      {{ script.action }}
                      <span v-if="script.selector">( {{ script.selector }} )</span>
                      <span v-if="script.value">= "{{ script.value }}"</span>
                    </p>
                  </div>
                </div>
                <BaseButton
                  v-if="script.videoSegmentUrl"
                  variant="outline"
                  size="sm"
                  @click="playSegmentVideo(script)"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V6a2 2 0 012-2h2a2 2 0 012 2v4" />
                  </svg>
                  播放录屏
                </BaseButton>
              </div>
            </div>

            <!-- 脚本代码 -->
            <div class="p-4">
              <div class="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-500">$</span>
                  <span>{{ formatPlaywrightCode(script) }}</span>
                </div>
              </div>
            </div>

            <!-- 分段录屏 -->
            <div 
              v-if="selectedScript?.id === script.id && script.videoSegmentUrl"
              class="p-4 border-t border-gray-200"
            >
              <div class="aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  :src="script.videoSegmentUrl"
                  controls
                  autoplay
                  class="w-full h-full"
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
              <p class="text-sm text-gray-500 mt-2">
                步骤 {{ script.step }} 的执行录屏
              </p>
            </div>
          </div>
        </div>
      </BaseCard>


    </template>

    <!-- 删除确认模态框 -->
    <BaseModal
      :show="showDeleteModal"
      title="确认删除"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        确定要删除测试 "{{ currentTest?.title }}" 吗？此操作不可撤销。
      </p>
      
      <template #footer>
        <BaseButton
          variant="outline"
          @click="showDeleteModal = false"
        >
          取消
        </BaseButton>
        <BaseButton
          variant="error"
          :loading="testStore.loading"
          @click="confirmDelete"
        >
          删除
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTestStore } from '@/stores/test'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import type { TestRecord, PlaywrightScript } from '@/types'

const router = useRouter()
const route = useRoute()
const testStore = useTestStore()

const showDeleteModal = ref(false)
const selectedScript = ref<PlaywrightScript | null>(null)
const aiAnalyzing = ref(false)

const currentTest = computed(() => testStore.currentTest)
const testId = computed(() => route.params.id as string)

const getStatusStyle = (status: TestRecord['status']) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
            screened: 'bg-orange-100 text-orange-800',
    screened: 'bg-orange-100 text-orange-800',
    analyzed: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return styles[status]
}

const getStatusDotColor = (status: TestRecord['status']) => {
  const colors = {
    pending: 'bg-yellow-400',
            screened: 'bg-orange-400',
    screened: 'bg-orange-400',
    analyzed: 'bg-purple-400',
    completed: 'bg-green-400',
    failed: 'bg-red-400'
  }
  return colors[status]
}

const getStatusText = (status: TestRecord['status']) => {
  const texts = {
    pending: '等待截图',
            screened: '已截图',
    screened: '已截图',
    analyzed: '已解析',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status]
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}

const formatPlaywrightCode = (script: PlaywrightScript) => {
  let code = `await ${script.action}(`
  
  // 根据不同的action类型生成不同的代码格式
  switch (script.action) {
    case 'goto':
      // goto方法只需要URL
      code += `'${script.selector || script.value}'`
      break
      
    case 'waitForLoadState':
      // waitForLoadState方法需要状态参数
      code += `'${script.value || script.selector || 'networkidle'}'`
      break
      
    case 'waitForSelector':
      // waitForSelector方法需要选择器
      code += `'${script.selector}'`
      break
      
    case 'click':
      // click方法需要选择器
      code += `'${script.selector}'`
      break
      
    case 'fill':
      // fill方法需要选择器和值
      code += `'${script.selector}', '${script.value || ''}'`
      break
      
    case 'expect':
      // expect方法需要选择器和期望值
      code += `'${script.selector}', '${script.value || ''}'`
      break
      
    case 'goBack':
      // goBack方法不需要参数
      break
      
    default:
      // 默认处理
      if (script.selector) {
        code += `'${script.selector}'`
        if (script.value) {
          code += `, '${script.value}'`
        }
      } else if (script.value) {
        code += `'${script.value}'`
      }
  }
  
  code += ');'
  return code
}

const playSegmentVideo = (script: PlaywrightScript) => {
  selectedScript.value = selectedScript.value?.id === script.id ? null : script
}

const handleDeleteTest = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!currentTest.value) return
  
  try {
    await testStore.deleteTest(currentTest.value.id)
    showDeleteModal.value = false
    router.push('/dashboard/test/records')
  } catch (error) {
    console.error('Delete test failed:', error)
  }
}

const handleGenerateReport = () => {
  // TODO: 实现生成报告功能
  alert(`生成测试报告功能开发中... (测试ID: ${testId.value})`)
}

const handleExecuteTest = async () => {
  if (!currentTest.value) return
  
  try {
    await testStore.executeTest(currentTest.value.id)
  } catch (error) {
    console.error('Execute test failed:', error)
  }
}

const handleAIAnalysis = async () => {
  if (!currentTest.value || !currentTest.value.screenshotUrl) return
  
  aiAnalyzing.value = true
  
  try {
    const result = await testStore.analyzeTest(currentTest.value.id, {
      aiModel: 'qwen-vl-max'
      // 不传递testType，让后端自动检测测试类型
    })
    
    // 检查分析结果
    if (result && result.playwrightScripts && result.playwrightScripts.length > 0) {
      // 显示成功消息
      alert(`AI分析完成！已生成 ${result.playwrightScripts.length} 个Playwright测试脚本。`)
    } else {
      alert('AI分析完成，但未生成测试脚本。')
    }
    
  } catch (error: any) {
    console.error('AI analysis failed:', error)
    
    // 提供更详细的错误信息
    let errorMessage = 'AI分析失败'
    if (error.message?.includes('timeout')) {
      errorMessage = 'AI分析超时，请稍后重试'
    } else if (error.message?.includes('网络')) {
      errorMessage = '网络连接错误，请检查网络连接'
    } else {
      errorMessage = `AI分析失败: ${error.message}`
    }
    
    alert(errorMessage)
  } finally {
    aiAnalyzing.value = false
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('Failed to load screenshot image:', {
    src: img.src,
    currentTest: currentTest.value,
    screenshotUrl: currentTest.value?.screenshotUrl
  })
  img.style.display = 'none'
}

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('Screenshot image loaded successfully:', img.src)
}

onMounted(async () => {
  if (testId.value) {
    try {
      await testStore.getTestDetail(testId.value)
    } catch (error) {
      console.error('Load test detail failed:', error)
    }
  }
})
</script>
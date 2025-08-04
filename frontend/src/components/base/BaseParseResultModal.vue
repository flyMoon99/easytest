<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <!-- 模态框内容 -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- 头部 -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-3">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Gemini 解析结果
                </h3>
                <p class="text-sm text-gray-500">
                  视频: {{ videoName }}
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

          <!-- 解析结果内容 -->
          <div class="mt-4">
            <div v-if="!geminiText" class="text-center py-8">
              <div class="text-gray-400 mb-2">
                <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-gray-500">暂无解析结果</p>
            </div>

            <div v-else class="space-y-4">
              <!-- 解析结果显示区域 -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-gray-900">解析结果</h4>
                  <button
                    @click="copyToClipboard"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    复制
                  </button>
                </div>
                
                <!-- 格式化显示解析结果 -->
                <div class="bg-white rounded border p-4 max-h-96 overflow-y-auto">
                  <pre class="whitespace-pre-wrap text-sm text-gray-700 font-mono">{{ formattedGeminiText }}</pre>
                </div>
              </div>

              <!-- 解析时间信息 -->
              <div v-if="parsedAt" class="text-xs text-gray-500 text-right">
                解析时间: {{ formatDate(parsedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleClose"
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  visible: boolean
  videoName: string
  geminiText: string
  parsedAt?: string
}

const props = withDefaults(defineProps<Props>(), {
  videoName: '未知视频',
  geminiText: '',
  parsedAt: ''
})

const emit = defineEmits<{
  close: []
}>()

// 格式化显示的Gemini文本
const formattedGeminiText = computed(() => {
  if (!props.geminiText) return ''
  
  // 尝试解析JSON格式的结果
  try {
    const parsed = JSON.parse(props.geminiText)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // 如果不是JSON，直接返回原文本
    return props.geminiText
  }
})

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.geminiText)
    alert('解析结果已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：创建临时textarea元素
    const textarea = document.createElement('textarea')
    textarea.value = props.geminiText
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      alert('解析结果已复制到剪贴板')
    } catch {
      alert('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}
</script>
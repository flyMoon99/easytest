<template>
  <div class="h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900">AI对话</h1>
      <p class="text-gray-600 mt-1">与AI助手进行智能对话，获取测试建议和分析</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col bg-gray-50">
      <!-- 模型选择区域 -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">选择模型:</label>
            <select 
              v-model="selectedModel" 
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="qwen-vl-max">通义千问VL-Max</option>
              <option value="gpt-3.5-turbo">ChatGPT (GPT-3.5 Turbo)</option>
            </select>
          </div>
          <div class="text-sm text-gray-500">
            当前模型: {{ getModelName(selectedModel) }}
          </div>
        </div>
      </div>

      <!-- 对话区域 -->
      <div class="flex-1 flex flex-col relative">
        <!-- 消息列表 -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4 pb-40" ref="messagesContainer">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="[
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div 
              :class="[
                'max-w-3xl rounded-lg px-4 py-3',
                message.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              ]"
            >
              <div class="flex items-start space-x-3">
                <!-- 头像 -->
                <div 
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    message.role === 'user' 
                      ? 'bg-primary-700 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ message.role === 'user' ? 'U' : 'AI' }}
                </div>
                
                <!-- 消息内容 -->
                <div class="flex-1">
                  <div class="text-sm font-medium mb-1">
                    {{ message.role === 'user' ? '你' : getModelName(selectedModel) }}
                  </div>
                  <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
                  <div class="text-xs text-gray-500 mt-2">
                    {{ formatTime(message.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载指示器 -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <div class="text-gray-600 text-sm font-medium">AI</div>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                  <span class="text-sm text-gray-600">正在思考...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-lg z-50">
          <div class="flex space-x-4">
            <div class="flex-1">
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleSendMessage"
                placeholder="输入你的问题或描述..."
                class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows="3"
                :disabled="isLoading"
              ></textarea>
            </div>
            <div class="flex flex-col space-y-2">
              <button
                @click="handleSendMessage"
                :disabled="!inputMessage.trim() || isLoading"
                class="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
              <button
                @click="clearMessages"
                class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useAiChatStore } from '@/stores/aiChat'

// 类型定义
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 状态
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('gemini-2.0-flash')
const messagesContainer = ref<HTMLElement>()

// Store
const aiChatStore = useAiChatStore()

// 方法
const getModelName = (modelId: string) => {
  const modelMap: Record<string, string> = {
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'qwen-vl-max': '通义千问VL-Max',
    'gpt-3.5-turbo': 'ChatGPT (GPT-3.5 Turbo)'
  }
  return modelMap[modelId] || modelId
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleSendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  // 清空输入框
  inputMessage.value = ''
  
  // 滚动到底部
  await scrollToBottom()

  // 开始加载
  isLoading.value = true

  try {
    // 添加AI消息占位符
    const aiMessageIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
      timestamp: new Date()
    })

    // 调用流式AI对话API
    await aiChatStore.sendMessageStream(
      message, 
      selectedModel.value,
      // 流式消息回调
      (content) => {
        messages.value[aiMessageIndex].content += content
        scrollToBottom()
      },
      // 完成回调
      (fullResponse) => {
        messages.value[aiMessageIndex].content = fullResponse
        scrollToBottom()
      },
      // 错误回调
      (error) => {
        messages.value[aiMessageIndex].content = `抱歉，我遇到了一些问题：${error}`
        scrollToBottom()
      }
    )
  } catch (error) {
    console.error('AI对话失败:', error)
    // 添加错误消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我遇到了一些问题。请稍后再试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const clearMessages = () => {
  messages.value = []
}

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// 组件挂载时滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>
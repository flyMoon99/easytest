<template>
  <div class="min-h-screen bg-white">
    <!-- 导航栏 -->
    <nav class="bg-white border-b border-gray-200">
      <div class="page-container">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">易</span>
              </div>
              <span class="ml-2 text-xl font-bold text-gray-900">易测平台</span>
            </div>
          </div>
          
          <!-- 右侧操作 -->
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <span class="text-sm text-gray-600">{{ authStore.user?.emailAbbr }}</span>
              <BaseButton 
                variant="outline" 
                size="sm"
                @click="router.push('/dashboard')"
              >
                进入控制台
              </BaseButton>
              <BaseButton 
                variant="secondary" 
                size="sm"
                @click="handleLogout"
              >
                退出
              </BaseButton>
            </template>
            <template v-else>
              <BaseButton 
                variant="outline" 
                size="sm"
                @click="router.push('/login')"
              >
                登录
              </BaseButton>
              <BaseButton 
                variant="primary" 
                size="sm"
                @click="router.push('/register')"
              >
                注册
              </BaseButton>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="page-container py-12">
      <!-- Hero Section -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          智能化测试解决方案
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          通过自然语言描述测试需求，系统自动解析、生成可执行脚本、执行录屏并存储结果，让测试变得简单高效
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <BaseButton 
            size="lg"
            @click="handleGetStarted"
          >
            立即开始
          </BaseButton>
          <BaseButton 
            variant="outline" 
            size="lg"
            @click="scrollToFeatures"
          >
            了解更多
          </BaseButton>
        </div>
      </div>

      <!-- 特性展示 -->
      <div ref="featuresRef" class="grid md:grid-cols-3 gap-8 mb-16">
        <BaseCard class="text-center">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">智能需求解析</h3>
            <p class="text-gray-600">使用自然语言描述测试需求，AI大模型自动解析转化为结构化测试步骤</p>
          </div>
        </BaseCard>

        <BaseCard class="text-center">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">自动脚本生成</h3>
            <p class="text-gray-600">基于Playwright自动生成可执行的浏览器操作脚本，无需手动编写代码</p>
          </div>
        </BaseCard>

        <BaseCard class="text-center">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">录屏与结果管理</h3>
            <p class="text-gray-600">执行测试时同步录屏，完整记录测试过程，便于问题定位和结果分析</p>
          </div>
        </BaseCard>
      </div>

      <!-- 工作流程 -->
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-8">简单四步，完成测试</h2>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h3 class="font-semibold text-gray-900 mb-2">描述需求</h3>
            <p class="text-sm text-gray-600">用自然语言描述测试目标和步骤</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h3 class="font-semibold text-gray-900 mb-2">智能解析</h3>
            <p class="text-sm text-gray-600">AI解析需求并生成执行脚本</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h3 class="font-semibold text-gray-900 mb-2">自动执行</h3>
            <p class="text-sm text-gray-600">系统自动执行测试并录制过程</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
            <h3 class="font-semibold text-gray-900 mb-2">查看结果</h3>
            <p class="text-sm text-gray-600">获得详细测试报告和录屏回放</p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-primary-50 rounded-2xl p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">准备开始您的智能测试之旅？</h2>
        <p class="text-gray-600 mb-6">立即注册，体验前所未有的测试效率提升</p>
        <BaseButton 
          size="lg"
          @click="handleGetStarted"
        >
          免费注册体验
        </BaseButton>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-50 border-t border-gray-200 mt-20">
      <div class="page-container py-8">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <div class="h-6 w-6 bg-primary-600 rounded flex items-center justify-center">
              <span class="text-white font-bold text-xs">易</span>
            </div>
            <span class="ml-2 text-lg font-semibold text-gray-900">易测平台</span>
          </div>
          <p class="text-gray-600 text-sm">
            © 2025 易测平台. 让测试变得简单高效.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const featuresRef = ref<HTMLElement>()

const handleGetStarted = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const scrollToFeatures = () => {
  featuresRef.value?.scrollIntoView({ behavior: 'smooth' })
}
</script> 
<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">仪表板</h1>
        <p class="text-gray-600">欢迎回来，查看您的测试概览和数据统计</p>
      </div>
      <BaseButton @click="router.push('/dashboard/test/new')">
        新增测试
      </BaseButton>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard>
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">总测试数</p>
              <p class="text-2xl font-bold text-gray-900">{{ testStore.statistics.total }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">已完成</p>
              <p class="text-2xl font-bold text-gray-900">{{ testStore.statistics.completed }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">运行中</p>
                              <p class="text-2xl font-bold text-gray-900">{{ testStore.statistics.screened }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">失败</p>
              <p class="text-2xl font-bold text-gray-900">{{ testStore.statistics.failed }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- 最近测试 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近测试记录 -->
      <BaseCard title="最近测试">
        <div class="space-y-4">
          <div 
            v-for="test in recentTests" 
            :key="test.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-3 h-3 rounded-full',
                getStatusColor(test.status)
              ]"></div>
              <div>
                <p class="font-medium text-gray-900">{{ test.title }}</p>
                <p class="text-sm text-gray-500">{{ formatTime(test.createdAt) }}</p>
              </div>
            </div>
            <BaseButton 
              variant="outline" 
              size="sm"
              @click="router.push(`/dashboard/test/detail/${test.id}`)"
            >
              查看
            </BaseButton>
          </div>
          
          <div v-if="recentTests.length === 0" class="text-center py-8 text-gray-500">
            暂无测试记录
          </div>
        </div>
        
        <template #footer>
          <BaseButton 
            variant="outline" 
            block
            @click="router.push('/dashboard/test/records')"
          >
            查看所有测试记录
          </BaseButton>
        </template>
      </BaseCard>

      <!-- 成功率趋势 -->
      <BaseCard title="成功率统计">
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-4xl font-bold text-primary-600">
              {{ testStore.statistics.successRate }}%
            </div>
            <p class="text-gray-600">整体成功率</p>
          </div>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">已完成</span>
              <span class="text-sm font-medium">{{ testStore.statistics.completed }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-green-600 h-2 rounded-full" 
                :style="{ width: `${(testStore.statistics.completed / testStore.statistics.total) * 100}%` }"
              ></div>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">失败</span>
              <span class="text-sm font-medium">{{ testStore.statistics.failed }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-red-600 h-2 rounded-full" 
                :style="{ width: `${(testStore.statistics.failed / testStore.statistics.total) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- 快速操作 -->
    <BaseCard title="快速操作">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseButton 
          variant="outline" 
          block
          @click="router.push('/dashboard/test/new')"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建新测试
        </BaseButton>
        
        <BaseButton 
          variant="outline" 
          block
          @click="router.push('/dashboard/test/records')"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          查看测试记录
        </BaseButton>
        
        <BaseButton 
          variant="outline" 
          block
          @click="handleExportReport"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          导出报告
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTestStore } from '@/stores/test'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { TestRecord } from '@/types'

const router = useRouter()
const testStore = useTestStore()

const recentTests = computed(() => {
  return testStore.testRecords.slice(0, 5)
})

const getStatusColor = (status: TestRecord['status']) => {
  const colors = {
    pending: 'bg-gray-400',
            screened: 'bg-orange-400',
    completed: 'bg-green-400',
    failed: 'bg-red-400'
  }
  return colors[status]
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  }
  return `${days}天前`
}

const handleExportReport = () => {
  // TODO: 实现导出报告功能
  alert('导出报告功能开发中...')
}
</script> 
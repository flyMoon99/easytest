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
          <h1 class="text-2xl font-bold text-gray-900">测试计划详情</h1>
          <p v-if="currentTestPlan" class="text-gray-600">{{ currentTestPlan.name }}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <BaseButton 
          variant="outline"
          @click="handleEdit"
          v-if="currentTestPlan"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          编辑
        </BaseButton>
        <BaseButton 
          variant="error"
          @click="handleDelete"
          v-if="currentTestPlan"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除
        </BaseButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="testPlanStore.loading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">加载测试计划详情...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="testPlanStore.error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28c2.624 0 4.928 1.006 6.713 2.714M30 20a6 6 0 11-12 0 6 6 0 0112 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">加载失败</h3>
      <p class="mt-1 text-gray-500">{{ testPlanStore.error }}</p>
      <div class="mt-6 space-x-2">
        <BaseButton @click="retryLoad">
          重新加载
        </BaseButton>
        <BaseButton variant="outline" @click="router.push('/dashboard/test-plan/list')">
          返回测试计划列表
        </BaseButton>
      </div>
    </div>

    <!-- 测试计划不存在 -->
    <div v-else-if="!currentTestPlan" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28c2.624 0 4.928 1.006 6.713 2.714M30 20a6 6 0 11-12 0 6 6 0 0112 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">测试计划不存在</h3>
      <p class="mt-1 text-gray-500">找不到指定的测试计划记录</p>
      <div class="mt-6">
        <BaseButton @click="router.push('/dashboard/test-plan/list')">
          返回测试计划列表
        </BaseButton>
      </div>
    </div>

    <!-- 测试计划详情内容 -->
    <template v-else>
      <!-- 基本信息和统计数据 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：基本信息 -->
        <div class="lg:col-span-2">
          <BaseCard title="基本信息">
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">计划名称</h4>
                  <p class="text-gray-900">{{ currentTestPlan.name }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">状态</h4>
                  <span v-if="currentTestPlan?.status && TEST_PLAN_STATUS_CONFIG[currentTestPlan.status]" :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    TEST_PLAN_STATUS_CONFIG[currentTestPlan.status].color
                  ]">
                    <span :class="[
                      'w-1.5 h-1.5 rounded-full mr-1.5',
                      TEST_PLAN_STATUS_CONFIG[currentTestPlan.status].dotColor
                    ]"></span>
                    {{ TEST_PLAN_STATUS_CONFIG[currentTestPlan.status].label }}
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <span class="w-1.5 h-1.5 rounded-full mr-1.5 bg-gray-400"></span>
                    未知状态
                  </span>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">测试类型</h4>
                  <p class="text-gray-900">{{ currentTestPlan.testType }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">测试负责人</h4>
                  <p class="text-gray-900">{{ currentTestPlan.assignee }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">开始时间</h4>
                  <p class="text-gray-900">{{ formatDateTime(currentTestPlan.startTime) }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">结束时间</h4>
                  <p class="text-gray-900">{{ formatDateTime(currentTestPlan.endTime) }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">创建时间</h4>
                  <p class="text-gray-900">{{ formatDateTime(currentTestPlan.createdAt) }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-2">更新时间</h4>
                  <p class="text-gray-900">{{ formatDateTime(currentTestPlan.updatedAt) }}</p>
                </div>
              </div>
              
              <div v-if="currentTestPlan.description">
                <h4 class="text-sm font-medium text-gray-500 mb-2">计划描述</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <p class="text-gray-900 whitespace-pre-wrap">{{ currentTestPlan.description }}</p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
        
        <!-- 右侧：统计信息 -->
        <div class="space-y-6">
          <!-- 进度统计 -->
          <BaseCard title="执行进度">
            <div class="space-y-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-primary-600">
                  {{ currentTestPlan?.statistics?.successRate || 0 }}%
                </div>
                <div class="text-sm text-gray-500">成功率</div>
              </div>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">总用例数</span>
                  <span class="font-medium">{{ currentTestPlan?.statistics?.totalCases || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">已完成</span>
                  <span class="font-medium text-green-600">{{ currentTestPlan?.statistics?.completedCases || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">失败</span>
                  <span class="font-medium text-red-600">{{ currentTestPlan?.statistics?.failedCases || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">未开始</span>
                  <span class="font-medium text-gray-600">
                    {{ Math.max(0, (currentTestPlan?.statistics?.totalCases || 0) - (currentTestPlan?.statistics?.completedCases || 0) - (currentTestPlan?.statistics?.failedCases || 0)) }}
                  </span>
                </div>
              </div>
              
              <!-- 进度条 -->
              <div class="relative">
                <div class="flex mb-2 items-center justify-between">
                  <div>
                    <span class="text-xs font-semibold inline-block text-primary-600">
                      完成进度
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-semibold inline-block text-primary-600">
                      {{ Math.round(((currentTestPlan?.statistics?.completedCases || 0) / Math.max((currentTestPlan?.statistics?.totalCases || 0), 1)) * 100) }}%
                    </span>
                  </div>
                </div>
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div 
                    :style="{ width: `${Math.round(((currentTestPlan?.statistics?.completedCases || 0) / Math.max((currentTestPlan?.statistics?.totalCases || 0), 1)) * 100)}%` }" 
                    class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                  ></div>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- 时间信息 -->
          <BaseCard title="时间信息">
            <div class="space-y-3">
              <div>
                <div class="text-sm text-gray-500">计划周期</div>
                <div class="text-sm font-medium text-gray-900">
                  {{ getPlanDuration() }}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">剩余时间</div>
                <div class="text-sm font-medium" :class="getRemainingTimeClass()">
                  {{ getRemainingTime() }}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">计划状态</div>
                <div class="text-sm font-medium" :class="getPlanStatusClass()">
                  {{ getPlanStatusText() }}
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- 相关操作 -->
      <BaseCard title="相关操作">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseButton
            variant="outline"
            class="justify-center"
            @click="viewTestCases"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            查看关联用例
          </BaseButton>
          <BaseButton
            variant="outline"
            class="justify-center"
            @click="createTestCase"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新增测试用例
          </BaseButton>
          <BaseButton
            variant="outline"
            class="justify-center"
            @click="exportReport"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出报告
          </BaseButton>
        </div>
      </BaseCard>
    </template>

    <!-- 删除确认模态框 -->
    <BaseModal
      v-model="showDeleteModal"
      title="确认删除"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        确定要删除测试计划 "{{ currentTestPlan?.name }}" 吗？此操作不可撤销。
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
          :loading="testPlanStore.loading"
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
import { useTestPlanStore } from '@/stores/testPlan'
import { TEST_PLAN_STATUS_CONFIG } from '@/types/testPlan'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'

const router = useRouter()
const route = useRoute()
const testPlanStore = useTestPlanStore()

const showDeleteModal = ref(false)

const currentTestPlan = computed(() => testPlanStore.currentTestPlan)
const testPlanId = computed(() => route.params.id as string)

// 方法
const handleEdit = () => {
  router.push(`/dashboard/test-plan/${testPlanId.value}/edit`)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!currentTestPlan.value) return
  
  try {
    await testPlanStore.deleteTestPlan(currentTestPlan.value.id)
    showDeleteModal.value = false
    router.push('/dashboard/test-plan/list')
  } catch (error) {
    console.error('删除测试计划失败:', error)
  }
}

const viewTestCases = () => {
  router.push(`/dashboard/test-plan/${testPlanId.value}/related-cases`)
}

const createTestCase = () => {
  // TODO: 实现新增测试用例功能
  router.push('/dashboard/test/new')
}

const exportReport = () => {
  // TODO: 实现导出报告功能
  console.log('导出报告')
}

const retryLoad = async () => {
  if (testPlanId.value) {
    try {
      await testPlanStore.getTestPlanDetail(testPlanId.value)
    } catch (error) {
      console.error('重新加载测试计划详情失败:', error)
    }
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPlanDuration = () => {
  if (!currentTestPlan.value) return '-'
  
  const startTime = new Date(currentTestPlan.value.startTime)
  const endTime = new Date(currentTestPlan.value.endTime)
  const diffTime = Math.abs(endTime.getTime() - startTime.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return `${diffDays} 天`
}

const getRemainingTime = () => {
  if (!currentTestPlan.value) return '-'
  
  const now = new Date()
  const endTime = new Date(currentTestPlan.value.endTime)
  const diffTime = endTime.getTime() - now.getTime()
  
  if (diffTime <= 0) {
    return '已结束'
  }
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} 天`
}

const getRemainingTimeClass = () => {
  if (!currentTestPlan.value) return 'text-gray-900'
  
  const now = new Date()
  const endTime = new Date(currentTestPlan.value.endTime)
  const diffTime = endTime.getTime() - now.getTime()
  
  if (diffTime <= 0) {
    return 'text-red-600'
  } else if (diffTime <= 3 * 24 * 60 * 60 * 1000) { // 3天内
    return 'text-orange-600'
  } else {
    return 'text-green-600'
  }
}

const getPlanStatusText = () => {
  if (!currentTestPlan.value) return '-'
  
  const now = new Date()
  const startTime = new Date(currentTestPlan.value.startTime)
  const endTime = new Date(currentTestPlan.value.endTime)
  
  if (now < startTime) {
    return '未开始'
  } else if (now > endTime) {
    return '已结束'
  } else {
    return '进行中'
  }
}

const getPlanStatusClass = () => {
  const status = getPlanStatusText()
  switch (status) {
    case '未开始':
      return 'text-gray-600'
    case '进行中':
      return 'text-blue-600'
    case '已结束':
      return 'text-red-600'
    default:
      return 'text-gray-900'
  }
}

// 生命周期
onMounted(async () => {
  if (testPlanId.value) {
    try {
      await testPlanStore.getTestPlanDetail(testPlanId.value)
    } catch (error) {
      console.error('加载测试计划详情失败:', error)
    }
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">测试记录</h1>
        <p class="text-gray-600">查看和管理您的所有测试记录</p>
      </div>
      <BaseButton @click="router.push('/dashboard/test/new')">
        新增测试
      </BaseButton>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">总数</p>
            <p class="text-lg font-semibold text-gray-900">{{ testStore.statistics.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">已完成</p>
            <p class="text-lg font-semibold text-gray-900">{{ testStore.statistics.completed }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">运行中</p>
                            <p class="text-lg font-semibold text-gray-900">{{ testStore.statistics.screened }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">失败</p>
            <p class="text-lg font-semibold text-gray-900">{{ testStore.statistics.failed }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试记录列表 -->
    <BaseCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">测试记录</h3>
          <div class="flex items-center space-x-2">
            <select 
              v-model="filterStatus"
              class="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="">全部状态</option>
              <option value="pending">等待中</option>
                              <option value="screened">已截图</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
      </template>

      <div v-if="testStore.loading" class="flex justify-center py-12">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-600">加载中...</span>
        </div>
      </div>

      <div v-else-if="filteredTests.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28c2.624 0 4.928 1.006 6.713 2.714M30 20a6 6 0 11-12 0 6 6 0 0112 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无测试记录</h3>
        <p class="mt-1 text-sm text-gray-500">开始创建您的第一个测试</p>
        <div class="mt-6">
          <BaseButton @click="router.push('/dashboard/test/new')">
            新增测试
          </BaseButton>
        </div>
      </div>

      <div v-else class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  测试标题
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  完成时间
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="test in filteredTests" :key="test.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {{ test.title }}
                    </div>
                    <div class="text-sm text-gray-500 truncate max-w-xs">
                      {{ test.entryUrl }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusStyle(test.status)
                  ]">
                    <span :class="[
                      'w-1.5 h-1.5 rounded-full mr-1.5',
                      getStatusDotColor(test.status)
                    ]"></span>
                    {{ getStatusText(test.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDateTime(test.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ test.completedAt ? formatDateTime(test.completedAt) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    @click="router.push(`/dashboard/test/detail/${test.id}`)"
                  >
                    详情
                  </BaseButton>
                  <BaseButton
                    v-if="test.status === 'completed'"
                    variant="outline"
                    size="sm"
                    @click="handleGenerateReport(test.id)"
                  >
                    生成报告
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    @click="handleDeleteTest(test)"
                  >
                    删除
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseCard>

    <!-- 删除确认模态框 -->
    <BaseModal
      :show="showDeleteModal"
      title="确认删除"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        确定要删除测试 "{{ selectedTest?.title }}" 吗？此操作不可撤销。
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
import { useRouter } from 'vue-router'
import { useTestStore } from '@/stores/test'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import type { TestRecord } from '@/types'

const router = useRouter()
const testStore = useTestStore()

const filterStatus = ref('')
const showDeleteModal = ref(false)
const selectedTest = ref<TestRecord | null>(null)

const filteredTests = computed(() => {
  if (!filterStatus.value) {
    return testStore.testRecords
  }
  return testStore.testRecords.filter(test => test.status === filterStatus.value)
})

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
    minute: '2-digit'
  })
}

const handleDeleteTest = (test: TestRecord) => {
  selectedTest.value = test
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedTest.value) return
  
  try {
    await testStore.deleteTest(selectedTest.value.id)
    showDeleteModal.value = false
    selectedTest.value = null
  } catch (error) {
    console.error('Delete test failed:', error)
  }
}

const handleGenerateReport = (testId: string) => {
  // TODO: 实现生成报告功能
  alert(`生成测试报告功能开发中... (测试ID: ${testId})`)
}

onMounted(() => {
  testStore.getTestRecords()
})
</script> 
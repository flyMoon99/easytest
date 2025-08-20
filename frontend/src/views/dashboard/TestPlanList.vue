<template>
  <div class="space-y-6">
    <!-- 页面标题和操作 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">测试计划</h1>
        <p class="text-gray-600">管理和查看您的测试计划</p>
      </div>
      <BaseButton 
        variant="primary"
        @click="router.push('/dashboard/test-plan/new')"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新增计划
      </BaseButton>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <BaseCard class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ statistics.total }}</div>
        <div class="text-sm text-gray-600">总计划数</div>
      </BaseCard>
      <BaseCard class="text-center">
        <div class="text-2xl font-bold text-gray-600">{{ statistics.draft }}</div>
        <div class="text-sm text-gray-600">草稿</div>
      </BaseCard>
      <BaseCard class="text-center">
        <div class="text-2xl font-bold text-blue-600">{{ statistics.active }}</div>
        <div class="text-sm text-gray-600">进行中</div>
      </BaseCard>
      <BaseCard class="text-center">
        <div class="text-2xl font-bold text-green-600">{{ statistics.completed }}</div>
        <div class="text-sm text-gray-600">已完成</div>
      </BaseCard>
      <BaseCard class="text-center">
        <div class="text-2xl font-bold text-red-600">{{ statistics.cancelled }}</div>
        <div class="text-sm text-gray-600">已取消</div>
      </BaseCard>
    </div>

    <!-- 搜索和过滤 -->
    <BaseCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchKeyword"
            placeholder="搜索计划名称、描述、负责人..."
            @input="handleSearch"
          >
            <template #prefix>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </template>
          </BaseInput>
        </div>
        <div class="flex gap-2">
          <select 
            v-model="statusFilter" 
            @change="handleFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <BaseButton 
            variant="outline"
            @click="handleRefresh"
            :loading="loading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">加载失败</h3>
      <p class="mt-1 text-gray-500">{{ error }}</p>
      <div class="mt-6">
        <BaseButton @click="handleRefresh">
          重试
        </BaseButton>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!hasTestPlans" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">暂无测试计划</h3>
      <p class="mt-1 text-gray-500">开始创建您的第一个测试计划</p>
      <div class="mt-6">
        <BaseButton 
          variant="primary"
          @click="router.push('/dashboard/test-plan/new')"
        >
          创建测试计划
        </BaseButton>
      </div>
    </div>

    <!-- 测试计划列表 -->
    <div v-else class="space-y-4">
      <div 
        v-for="testPlan in testPlans" 
        :key="testPlan.id"
        class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-medium text-gray-900">{{ testPlan.name }}</h3>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                TEST_PLAN_STATUS_CONFIG[testPlan.status].color
              ]">
                <span :class="[
                  'w-1.5 h-1.5 rounded-full mr-1.5',
                  TEST_PLAN_STATUS_CONFIG[testPlan.status].dotColor
                ]"></span>
                {{ TEST_PLAN_STATUS_CONFIG[testPlan.status].label }}
              </span>
            </div>
            
            <p v-if="testPlan.description" class="text-gray-600 mb-3">{{ testPlan.description }}</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500">测试类型:</span>
                <span class="ml-1 text-gray-900">{{ testPlan.testType }}</span>
              </div>
              <div>
                <span class="text-gray-500">负责人:</span>
                <span class="ml-1 text-gray-900">{{ testPlan.assignee }}</span>
              </div>
              <div>
                <span class="text-gray-500">开始时间:</span>
                <span class="ml-1 text-gray-900">{{ formatDate(testPlan.startTime) }}</span>
              </div>
              <div>
                <span class="text-gray-500">结束时间:</span>
                <span class="ml-1 text-gray-900">{{ formatDate(testPlan.endTime) }}</span>
              </div>
            </div>
            
            <div class="mt-3 flex items-center space-x-4 text-sm text-gray-500">
              <span>测试用例: {{ testPlan.testCaseCount }}</span>
              <span>已完成: {{ testPlan.completedTestCaseCount }}</span>
              <span>成功率: {{ testPlan.statistics.successRate }}%</span>
              <span>创建时间: {{ formatDateTime(testPlan.createdAt) }}</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 ml-4">
            <BaseButton
              variant="outline"
              size="sm"
              @click="router.push(`/dashboard/test-plan/${testPlan.id}`)"
            >
              查看详情
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="handleViewRelatedCases(testPlan)"
            >
              关联用例
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="handleEdit(testPlan)"
            >
              编辑
            </BaseButton>
            <BaseButton
              variant="error"
              size="sm"
              @click="handleDelete(testPlan)"
            >
              删除
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="flex justify-center">
      <nav class="flex items-center space-x-2">
        <BaseButton
          variant="outline"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          上一页
        </BaseButton>
        
        <span class="text-sm text-gray-600">
          第 {{ pagination.page }} 页，共 {{ pagination.totalPages }} 页
        </span>
        
        <BaseButton
          variant="outline"
          size="sm"
          :disabled="pagination.page >= pagination.totalPages"
          @click="handlePageChange(pagination.page + 1)"
        >
          下一页
        </BaseButton>
      </nav>
    </div>

    <!-- 删除确认模态框 -->
    <BaseModal
      v-model="showDeleteModal"
      title="确认删除"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        确定要删除测试计划 "{{ selectedTestPlan?.name }}" 吗？此操作不可撤销。
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
          :loading="loading"
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
import { useTestPlanStore } from '@/stores/testPlan'
import { TEST_PLAN_STATUS_CONFIG } from '@/types/testPlan'
import type { TestPlan } from '@/types/testPlan'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'


const router = useRouter()
const testPlanStore = useTestPlanStore()

// 状态
const searchKeyword = ref('')
const statusFilter = ref('')
const showDeleteModal = ref(false)
const selectedTestPlan = ref<TestPlan | null>(null)

// 计算属性
const loading = computed(() => testPlanStore.loading)
const error = computed(() => testPlanStore.error)
const testPlans = computed(() => testPlanStore.testPlans)
const hasTestPlans = computed(() => testPlanStore.hasTestPlans)
const statistics = computed(() => testPlanStore.statistics)
const pagination = computed(() => testPlanStore.pagination)


// 方法
const handleSearch = () => {
  loadTestPlans()
}

const handleFilter = () => {
  loadTestPlans()
}

const handleRefresh = () => {
  loadTestPlans()
}

const handlePageChange = (page: number) => {
  loadTestPlans({ page })
}

const handleEdit = (testPlan: TestPlan) => {
  router.push(`/dashboard/test-plan/${testPlan.id}/edit`)
}

const handleDelete = (testPlan: TestPlan) => {
  selectedTestPlan.value = testPlan
  showDeleteModal.value = true
}

const handleViewRelatedCases = (testPlan: TestPlan) => {
  router.push(`/dashboard/test-plan/${testPlan.id}/related-cases`)
}

const confirmDelete = async () => {
  if (!selectedTestPlan.value) return
  
  try {
    await testPlanStore.deleteTestPlan(selectedTestPlan.value.id)
    showDeleteModal.value = false
    selectedTestPlan.value = null
  } catch (error) {
    console.error('删除测试计划失败:', error)
  }
}

const loadTestPlans = async (params: any = {}) => {
  const queryParams: any = {
    page: pagination.value.page,
    limit: pagination.value.limit,
    ...params
  }
  
  if (statusFilter.value) {
    queryParams.status = statusFilter.value
  }
  
  if (searchKeyword.value) {
    queryParams.search = searchKeyword.value
  }
  
  try {
    await testPlanStore.getTestPlans(queryParams)
  } catch (error) {
    console.error('加载测试计划失败:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadTestPlans()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
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
          <h1 class="text-2xl font-bold text-gray-900">关联用例</h1>
          <p v-if="currentTestPlan" class="text-gray-600">{{ currentTestPlan.name }}</p>
        </div>
      </div>
      
      <!-- 操作按钮组 -->
      <div class="flex items-center space-x-2">
        <BaseButton
          variant="outline"
          size="sm"
          @click="handleSelectTestCases"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          选择待测用例
        </BaseButton>
        
        <BaseButton
          variant="outline"
          size="sm"
          @click="handleTestReport"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          测试报告
        </BaseButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">加载关联用例...</span>
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

    <!-- 主要内容 -->
    <template v-else>
      <!-- 统计信息 -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">通过:</span>
              <span class="text-lg font-semibold text-green-600">{{ statistics.passed }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">不通过:</span>
              <span class="text-lg font-semibold text-red-600">{{ statistics.failed }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">阻塞:</span>
              <span class="text-lg font-semibold text-orange-600">{{ statistics.blocked }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">未执行:</span>
              <span class="text-lg font-semibold text-gray-600">{{ statistics.notExecuted }}</span>
            </div>
          </div>
          <div class="flex items-center space-x-4 text-sm text-gray-500">
            <span>需求个数: {{ statistics.requirementCount }}</span>
            <span>用例个数: {{ statistics.caseCount }}</span>
            <span>测试执行进度: <span class="text-orange-600 font-medium">{{ statistics.progress }}%</span></span>
          </div>
        </div>
      </BaseCard>

      <!-- 工具栏 -->
      <BaseCard>
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 搜索框 -->
          <div class="flex-1">
            <BaseInput
              v-model="searchKeyword"
              placeholder="搜索用例名称..."
              @input="handleSearch"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </template>
            </BaseInput>
          </div>
          
          <!-- 筛选器 -->
          <div class="flex gap-2">
            <select 
              v-model="statusFilter" 
              @change="handleFilter"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部状态</option>
              <option value="pass">通过</option>
              <option value="fail">失败</option>
              <option value="blocked">阻塞</option>
              <option value="notExecuted">未执行</option>
            </select>
            
            <select 
              v-model="levelFilter" 
              @change="handleFilter"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部等级</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
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
        
        <!-- 批量操作 -->
        <div v-if="selectedCases.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">已选择 {{ selectedCases.length }} 个用例</span>
            <div class="flex items-center space-x-2">
              <BaseButton
                variant="outline"
                size="sm"
                @click="handleBatchAssign"
              >
                批量分配
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="handleBatchUpdateStatus"
              >
                批量更新状态
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="clearSelection"
              >
                取消选择
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 层级表格 -->
      <BaseCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">用例列表</h3>
          <div class="flex items-center space-x-2">
            <BaseButton
              variant="outline"
              size="sm"
              @click="expandAll"
            >
              全部展开
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="collapseAll"
            >
              全部收起
            </BaseButton>
          </div>
        </div>
        
        <HierarchicalTestCaseTable
          ref="tableRef"
          :cases="filteredCases"
          @selection-change="handleSelectionChange"
          @upload-video="handleUploadVideo"
          @execute="handleExecuteSingle"
        />
      </BaseCard>

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
    </template>
  </div>

  <!-- 用例选择弹窗 -->
  <SelectTestCasesModal
    v-model="showSelectModal"
    :test-plan-id="testPlanId"
    :excluded-case-ids="testCases.map(testCase => testCase.id)"
    @confirm="handleConfirmSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTestPlanStore } from '@/stores/testPlan'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import HierarchicalTestCaseTable from '@/components/testPlan/HierarchicalTestCaseTable.vue'
import SelectTestCasesModal from '@/components/testPlan/SelectTestCasesModal.vue'

const router = useRouter()
const route = useRoute()
const testPlanStore = useTestPlanStore()

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const levelFilter = ref('')
const selectedCases = ref<any[]>([])
const tableRef = ref()

// 用例选择弹窗
const showSelectModal = ref(false)

// 计算属性
const currentTestPlan = computed(() => testPlanStore.currentTestPlan)
const testPlanId = computed(() => route.params.id as string)

// 统计数据（基于实际用例数据计算）
const statistics = computed(() => {
  const cases = testCases.value
  const passed = cases.filter(c => c.result === 'pass').length
  const failed = cases.filter(c => c.result === 'fail').length
  const blocked = cases.filter(c => c.result === 'blocked').length
  const notExecuted = cases.filter(c => c.result === 'notExecuted').length
  const total = cases.length
  const progress = total > 0 ? ((passed + failed + blocked) / total * 100).toFixed(2) : '0.00'
  
  return {
    passed,
    failed,
    blocked,
    notExecuted,
    requirementCount: 0, // 实际应该从需求关联中获取
    caseCount: total,
    progress: parseFloat(progress)
  }
})

// 分页数据（基于实际用例数据计算）
const pagination = computed(() => ({
  page: 1,
  limit: 50,
  total: testCases.value.length,
  totalPages: Math.ceil(testCases.value.length / 50)
}))

// 用例数据（从API获取）
const testCases = ref<any[]>([])

// 过滤后的用例
const filteredCases = computed(() => {
  let cases = testCases.value

  // 搜索过滤
  if (searchKeyword.value) {
    cases = cases.filter(testCase => 
      testCase.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    cases = cases.filter(testCase => testCase.result === statusFilter.value)
  }

  // 等级过滤
  if (levelFilter.value) {
    cases = cases.filter(testCase => testCase.level === levelFilter.value)
  }

  return cases
})

// 方法
const handleSearch = () => {
  // 实现搜索逻辑
  console.log('搜索:', searchKeyword.value)
}

const handleFilter = () => {
  // 实现筛选逻辑
  console.log('筛选:', { status: statusFilter.value, level: levelFilter.value })
}

const handleRefresh = async () => {
  await loadRelatedCases()
}

const handlePageChange = (page: number) => {
  // 实现分页逻辑
  console.log('页码变化:', page)
}

const handleSelectionChange = (cases: any[]) => {
  selectedCases.value = cases
}

const handleSelectTestCases = () => {
  showSelectModal.value = true
}

const handleConfirmSelection = async (selectedCases: any[]) => {
  try {
    loading.value = true
    const caseIds = selectedCases.map(testCase => testCase.id)
    await testPlanStore.associateCases(testPlanId.value, caseIds)
    
    // 重新加载关联用例
    await loadRelatedCases()
    
    // 显示成功消息
    console.log(`成功关联 ${selectedCases.length} 个用例`)
  } catch (error) {
    console.error('关联用例失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAssociateCases = () => {
  console.log('关联用例')
}

const handleExport = () => {
  console.log('导出')
}

const handleExecute = () => {
  console.log('一键执行:', selectedCases.value)
}

const handleUploadVideo = (testCase: any) => {
  console.log('上传视频:', testCase)
  // 这里可以实现上传视频的逻辑
  // 例如：打开上传视频的模态框或跳转到上传页面
}

const handleExecuteSingle = (testCase: any) => {
  console.log('执行单个用例:', testCase)
  // 这里可以实现执行单个用例的逻辑
  // 例如：跳转到执行页面或打开执行模态框
}

const handleTestReport = () => {
  console.log('测试报告')
}

const handleBatchAssign = () => {
  console.log('批量分配:', selectedCases.value)
}

const handleBatchUpdateStatus = () => {
  console.log('批量更新状态:', selectedCases.value)
}

const clearSelection = () => {
  selectedCases.value = []
  // 清除表格选择
  if (tableRef.value) {
    // 这里需要调用表格组件的方法来清除选择
  }
}

const expandAll = () => {
  if (tableRef.value) {
    tableRef.value.expandAll()
  }
}

const collapseAll = () => {
  if (tableRef.value) {
    tableRef.value.collapseAll()
  }
}

const loadRelatedCases = async () => {
  if (!testPlanId.value) return
  
  try {
    loading.value = true
    const response = await testPlanStore.getRelatedCases(testPlanId.value)
    testCases.value = response.testCases || []
  } catch (error) {
    console.error('加载关联用例失败:', error)
    testCases.value = []
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(async () => {
  if (testPlanId.value) {
    try {
      await testPlanStore.getTestPlanDetail(testPlanId.value)
      await loadRelatedCases()
    } catch (error) {
      console.error('加载测试计划详情失败:', error)
    }
  }
})
</script>

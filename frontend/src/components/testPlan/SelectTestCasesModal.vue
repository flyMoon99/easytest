<template>
  <BaseModal
    :model-value="modelValue"
    title="选择待测用例"
    size="xl"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <!-- 搜索和工具栏 -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- 搜索框 -->
        <div class="flex-1">
          <BaseInput
            v-model="searchKeyword"
            placeholder="搜索用例标题..."
            @input="handleSearch"
          >
            <template #prefix>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </template>
          </BaseInput>
        </div>
        
        <!-- 工具栏 -->
        <div class="flex gap-2">
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
          <BaseButton
            variant="outline"
            size="sm"
            @click="handleRefresh"
            :loading="loading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </BaseButton>
        </div>
      </div>
      
      <!-- 选择统计 -->
      <div v-if="selectedCases.length > 0" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">已选择 {{ selectedCases.length }} 个用例</span>
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

    <!-- 用例选择树 -->
    <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-600">加载中...</span>
        </div>
      </div>
      
      <div v-else-if="filteredCases.length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无可用用例</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchKeyword ? '没有找到匹配的用例' : '当前没有可用的测试用例' }}
        </p>
      </div>
      
      <div v-else>
        <TestCaseSelectorTree
          ref="treeRef"
          :cases="filteredCases"
          :excluded-case-ids="excludedCaseIds"
          @selection-change="handleSelectionChange"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <BaseButton
        variant="outline"
        @click="handleClose"
      >
        取消
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="selectedCases.length === 0"
        :loading="confirming"
        @click="handleConfirm"
      >
        确认选择 ({{ selectedCases.length }})
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { testCaseAPI } from '@/services/api'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import TestCaseSelectorTree from './TestCaseSelectorTree.vue'

interface TestCase {
  id: string
  title: string
  status: string
  assignee?: string
  updatedAt: string
  directoryPath?: string[]
  level?: string
  result?: string
  executionCount?: number
  relatedBugs?: string
  lastExecutor?: string
  lastExecutionTime?: string
}

interface Props {
  modelValue: boolean
  testPlanId?: string
  excludedCaseIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludedCaseIds: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [selectedCases: TestCase[]]
}>()

// 状态
const loading = ref(false)
const confirming = ref(false)
const searchKeyword = ref('')
const selectedCases = ref<TestCase[]>([])
const allCases = ref<TestCase[]>([])
const treeRef = ref()

// 过滤后的用例（排除已关联的用例）
const filteredCases = computed(() => {
  let cases = allCases.value.filter(testCase => 
    !props.excludedCaseIds.includes(testCase.id)
  )

  // 搜索过滤
  if (searchKeyword.value) {
    cases = cases.filter(testCase => 
      testCase.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  return cases
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
  console.log('搜索:', searchKeyword.value)
}

const handleRefresh = async () => {
  await loadAllCases()
}

const handleSelectionChange = (cases: TestCase[]) => {
  selectedCases.value = cases
}

const handleClose = () => {
  emit('update:modelValue', false)
  // 重置状态
  searchKeyword.value = ''
  selectedCases.value = []
}

const handleConfirm = async () => {
  if (selectedCases.value.length === 0) return
  
  try {
    confirming.value = true
    emit('confirm', selectedCases.value)
    handleClose()
  } catch (error) {
    console.error('确认选择失败:', error)
  } finally {
    confirming.value = false
  }
}

const clearSelection = () => {
  selectedCases.value = []
  if (treeRef.value) {
    treeRef.value.clearSelection()
  }
}

const expandAll = () => {
  if (treeRef.value) {
    treeRef.value.expandAll()
  }
}

const collapseAll = () => {
  if (treeRef.value) {
    treeRef.value.collapseAll()
  }
}

const loadAllCases = async () => {
  try {
    loading.value = true
    const response = await testCaseAPI.getAll() // 使用getAll方法获取所有用例
    
    // 转换数据格式以匹配TestCase接口
    allCases.value = (response.data.testCases || []).map((testCase: any) => ({
      id: testCase.id || testCase._id,
      title: testCase.title,
      status: testCase.status,
      assignee: testCase.assignee || '未分配',
      updatedAt: testCase.updatedAt || new Date().toISOString(),
      directoryPath: testCase.directoryPath || [],
      level: testCase.level || '中',
      result: testCase.result || 'notExecuted',
      executionCount: testCase.executionCount || 0,
      relatedBugs: testCase.relatedBugs || '',
      lastExecutor: testCase.lastExecutor || testCase.assignee || '未分配',
      lastExecutionTime: testCase.lastExecutionTime || testCase.updatedAt || new Date().toISOString()
    }))
  } catch (error) {
    console.error('加载用例失败:', error)
    allCases.value = []
  } finally {
    loading.value = false
  }
}

// 监听弹窗打开
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadAllCases()
  }
})

// 组件挂载时加载数据
onMounted(() => {
  if (props.modelValue) {
    loadAllCases()
  }
})
</script>

<template>
  <div class="hierarchical-table">
    <!-- 表格头部 -->
    <div class="table-header bg-gray-50 border-b border-gray-200">
      <div class="grid grid-cols-12 gap-0 items-center px-4 py-3">
        <!-- 选择框 -->
        <div class="col-span-1 flex justify-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="toggleSelectAll"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        
        <!-- 用例名称 -->
        <div class="col-span-3 px-2">
          <span class="text-sm font-medium text-gray-900">用例名称</span>
        </div>
        
        <!-- 用例等级 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">用例等级</span>
        </div>
        
        <!-- 用例状态 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">用例状态</span>
        </div>
        
        <!-- 最终结果 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">结果</span>
        </div>
        
        <!-- 执行次数 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">执行次数</span>
        </div>
        
        <!-- 关联的Bug -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">关联Bug</span>
        </div>

        <!-- 最后执行时间 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">最后执行时间</span>
        </div>
        
        <!-- 操作 -->
        <div class="col-span-1 px-2">
          <span class="text-sm font-medium text-gray-900">操作</span>
        </div>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-body">
      <div 
        v-for="(item, index) in flattenedData" 
        :key="item.id || `dir-${index}`"
        class="table-row border-b border-gray-100 hover:bg-gray-50 transition-colors grid grid-cols-12 gap-0 items-center px-4 py-3"
        :class="{ 'bg-blue-50': item.selected }"
      >
        <!-- 选择框 -->
        <div class="col-span-1 flex justify-center items-center">
          <input
            v-if="item.type === 'testcase'"
            type="checkbox"
            :checked="item.selected"
            @change="toggleSelect(item)"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        
        <!-- 用例名称/目录名称 -->
        <div class="col-span-3 px-2">
          <div class="flex items-center space-x-2">
            <!-- 缩进 -->
            <div 
              v-for="i in (item.depth || 0)" 
              :key="i"
              class="w-4 h-4 border-l border-gray-200"
            ></div>
            
            <!-- 展开/关闭图标 -->
            <button
              v-if="item.type === 'directory'"
              @click="toggleExpand(item)"
              class="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg 
                class="w-3 h-3 transition-transform duration-200"
                :class="{ 'rotate-90': item.expanded }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <!-- 目录/用例图标 -->
            <div class="flex items-center justify-center w-4 h-4">
              <svg 
                v-if="item.type === 'directory'"
                class="w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <svg 
                v-else
                class="w-4 h-4 text-blue-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <!-- 名称 -->
            <span 
              class="text-sm"
              :class="item.type === 'directory' ? 'font-medium text-gray-900' : 'text-gray-700'"
            >
              {{ item.type === 'directory' ? item.name : item.title }}
            </span>
            
            <!-- 目录统计 -->
            <span 
              v-if="item.type === 'directory'"
              class="text-xs text-gray-500"
            >
              ({{ item.caseCount }})
            </span>
          </div>
        </div>
        
        <!-- 用例等级 -->
        <div class="col-span-1 px-2">
          <span v-if="item.type === 'testcase'" class="text-sm text-gray-600">
            {{ getLevelText(item.priority) }}
          </span>
        </div>
        
        <!-- 用例状态 -->
        <div class="col-span-1 px-2">
          <span v-if="item.type === 'testcase'" class="text-sm text-gray-600">
            {{ getStatusText(item.status) }}
          </span>
        </div>
        
        <!-- 最终结果 -->
        <div class="col-span-1 px-2">
          <span 
            v-if="item.type === 'testcase'" 
            class="text-sm font-medium"
            :class="getResultClass(item.result)"
          >
            {{ getResultText(item.result) }}
          </span>
        </div>
        
        <!-- 执行次数 -->
        <div class="col-span-1 px-2">
          <span v-if="item.type === 'testcase'" class="text-sm text-gray-600">
            {{ item.executionCount || 0 }}
          </span>
        </div>
        
        <!-- 关联的Bug -->
        <div class="col-span-1 px-2">
          <span v-if="item.type === 'testcase'" class="text-sm text-gray-600">
            {{ item.relatedBugs || '-' }}
          </span>
        </div>
        
        <!-- 最后执行时间 -->
        <div class="col-span-1 px-2">
          <span v-if="item.type === 'testcase'" class="text-sm text-gray-600">
            {{ formatDateTime(item.lastExecutionTime) }}
          </span>
        </div>
        
        <!-- 操作 -->
        <div class="col-span-1 px-2">
          <div v-if="item.type === 'testcase'" class="flex items-center space-x-1">
            <button
              @click="handleUploadVideo(item)"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="上传视频"
            >
              上传视频
            </button>
            <button
              @click="handleExecute(item)"
              class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title="执行"
            >
              执行
            </button>
            <button
              @click="handlePWTest(item)"
              class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              title="PW测试"
            >
              PW测试
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="flattenedData.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">暂无测试用例</h3>
      <p class="mt-1 text-sm text-gray-500">该测试计划尚未关联任何测试用例</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface TestCase {
  id: string
  title: string
  status: string
  assignee: string
  updatedAt: string
  directoryPath: string[]
  level?: string
  result?: string
  executionCount?: number
  relatedBugs?: string
  lastExecutor?: string
  lastExecutionTime?: string
}

interface TreeItem {
  id: string
  type: 'directory' | 'testcase'
  name?: string
  title?: string
  depth: number  // 改名：目录层级深度
  priority?: string  // 新增：用例等级
  expanded?: boolean
  caseCount?: number
  children?: TreeItem[]
  selected?: boolean
  status?: string
  assignee?: string
  updatedAt?: string
  result?: string
  executionCount?: number
  relatedBugs?: string
  lastExecutor?: string
  lastExecutionTime?: string
  testCaseId?: string  // 新增：真正的TestCase ID
}

interface Props {
  cases: TestCase[]
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: true
})

const emit = defineEmits<{
  selectionChange: [selectedCases: TestCase[]]
  uploadVideo: [testCase: any]
  execute: [testCase: any]
  pwTest: [testCase: any]
}>()

// 构建树形数据
const buildTreeData = (cases: TestCase[]): TreeItem[] => {
  const tree: TreeItem[] = []
  const directoryMap = new Map<string, TreeItem>()
  
  cases.forEach((testCase) => {
    // directoryPath现在总是数组格式
    const path = testCase.directoryPath || []
    
    // 构建目录层级
    let currentPath = ''
    path.forEach((dirName: string, index: number) => {
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}-${dirName}` : dirName
      
      if (!directoryMap.has(currentPath)) {
        // 修改目录项创建
        const directoryItem: TreeItem = {
          id: `dir-${currentPath}`,
          type: 'directory',
          name: dirName,
          depth: index,  // 使用 depth 而不是 level
          expanded: true,
          caseCount: 0,
          children: []
        }
        
        directoryMap.set(currentPath, directoryItem)
        
        // 添加到父级或根级
        if (parentPath && directoryMap.has(parentPath)) {
          directoryMap.get(parentPath)!.children!.push(directoryItem)
        } else {
          tree.push(directoryItem)
        }
      }
      
      // 更新用例计数
      directoryMap.get(currentPath)!.caseCount!++
    })
    
          // 添加用例到最后的目录
      // 在 buildTreeData 函数中修改用例项创建
      const testCaseItem: TreeItem = {
        ...testCase, // 保留原始数据的所有字段，包括testCaseId
        id: testCase.id,
        type: 'testcase',
        title: testCase.title,
        depth: path.length,  // 目录层级深度
        priority: testCase.level,  // 用例等级
        status: testCase.status,
        assignee: testCase.assignee,
        updatedAt: testCase.updatedAt,
        result: testCase.result,
        executionCount: testCase.executionCount,
        relatedBugs: testCase.relatedBugs,
        lastExecutor: testCase.lastExecutor,
        lastExecutionTime: testCase.lastExecutionTime,
        selected: false
      }
    
    if (currentPath && directoryMap.has(currentPath)) {
      directoryMap.get(currentPath)!.children!.push(testCaseItem)
    } else {
      tree.push(testCaseItem)
    }
  })
  
  return tree
}

// 扁平化树形数据用于表格展示
// 修改 flattenTreeData 函数
const flattenTreeData = (tree: TreeItem[], depth = 0): TreeItem[] => {
  const result: TreeItem[] = []
  
  tree.forEach(item => {
    // 添加当前项，保持原有的 depth 值，如果没有则使用传入的 depth
    result.push({
      ...item,
      depth: item.depth !== undefined ? item.depth : depth
    })
    
    // 如果是目录且展开，添加子项
    if (item.type === 'directory' && item.expanded && item.children) {
      result.push(...flattenTreeData(item.children, depth + 1))
    }
  })
  
  return result
}

const treeData = ref<TreeItem[]>([])

// 监听cases变化，重新构建树形数据
watch(() => props.cases, (newCases) => {
  treeData.value = buildTreeData(newCases)
}, { immediate: true })

// 扁平化数据用于表格渲染
const flattenedData = computed(() => {
  return flattenTreeData(treeData.value)
})

// 切换目录展开状态
const toggleExpand = (item: TreeItem) => {
  if (item.type === 'directory') {
    item.expanded = !item.expanded
  }
}

// 选择相关
const selectedCases = computed(() => {
  return flattenedData.value
    .filter(item => item.type === 'testcase' && item.selected)
    .map(item => props.cases.find(c => c.id === item.id)!)
    .filter(Boolean)
})

const isAllSelected = computed(() => {
  const testCases = flattenedData.value.filter(item => item.type === 'testcase')
  return testCases.length > 0 && testCases.every(item => item.selected)
})

const isIndeterminate = computed(() => {
  const testCases = flattenedData.value.filter(item => item.type === 'testcase')
  const selectedCount = testCases.filter(item => item.selected).length
  return selectedCount > 0 && selectedCount < testCases.length
})

const toggleSelectAll = () => {
  const testCases = flattenedData.value.filter(item => item.type === 'testcase')
  const newSelectedState = !isAllSelected.value
  
  testCases.forEach(item => {
    item.selected = newSelectedState
  })
  
  emit('selectionChange', selectedCases.value)
}

const toggleSelect = (item: TreeItem) => {
  if (item.type === 'testcase') {
    item.selected = !item.selected
    emit('selectionChange', selectedCases.value)
  }
}

// 状态相关方法
const getStatusText = (status?: string) => {
  switch (status) {
    case 'pending':
      return '待执行'
    case 'screened':
      return '已筛选'
    case 'analyzed':
      return '已分析'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

const getLevelText = (level?: string | number) => {
  switch (level) {
    case '高':
    case 1:
      return '高'
    case '中':
    case 2:
      return '中'
    case '低':
    case 3:
      return '低'
    default:
      return '中'
  }
}

const getResultText = (result?: string) => {
  switch (result) {
    case 'pass':
      return '通过'
    case 'fail':
      return '失败'
    case 'blocked':
      return '阻塞'
    case 'skipped':
      return '跳过'
    default:
      return '未执行'
  }
}

const getResultClass = (result?: string) => {
  switch (result) {
    case 'pass':
      return 'text-green-600'
    case 'fail':
      return 'text-red-600'
    case 'blocked':
      return 'text-orange-600'
    case 'skipped':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 操作按钮事件处理
const handleUploadVideo = (testCase: any) => {
  emit('uploadVideo', testCase)
}

const handleExecute = (testCase: any) => {
  emit('execute', testCase)
}

const handlePWTest = (testCase: any) => {
  emit('pwTest', testCase)
}

// 暴露方法给父组件
defineExpose({
  selectedCases,
  expandAll: () => {
    treeData.value.forEach(item => {
      if (item.type === 'directory') {
        item.expanded = true
      }
    })
  },
  collapseAll: () => {
    treeData.value.forEach(item => {
      if (item.type === 'directory') {
        item.expanded = false
      }
    })
  }
})
</script>

<style scoped>
.hierarchical-table {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.table-header {
  @apply sticky top-0 z-10;
}

.table-row {
  @apply transition-colors duration-150;
}

.table-row:hover {
  @apply bg-gray-50;
}
</style>

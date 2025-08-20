<template>
  <div class="testcase-selector-tree">
    <!-- 全选控制 -->
    <div class="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
      <input
        type="checkbox"
        :checked="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="toggleSelectAll"
        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span class="ml-2 text-sm font-medium text-gray-900">全选</span>
      <span class="ml-2 text-sm text-gray-500">({{ visibleTestCases.length }} 个用例)</span>
    </div>

    <!-- 树形内容 -->
    <div class="tree-content">
      <div 
        v-for="(item, index) in flattenedData" 
        :key="item.id || `dir-${index}`"
        class="tree-item border-b border-gray-100 hover:bg-gray-50 transition-colors"
        :class="{ 'bg-blue-50': item.selected }"
      >
        <!-- 选择框 -->
        <div class="flex items-center px-4 py-3">
          <input
            v-if="item.type === 'testcase'"
            type="checkbox"
            :checked="item.selected"
            @change="toggleSelect(item)"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <input
            v-else-if="item.type === 'directory'"
            type="checkbox"
            :checked="isDirectorySelected(item)"
            :indeterminate="isDirectoryIndeterminate(item)"
            @change="toggleDirectorySelect(item)"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          
          <!-- 缩进和图标 -->
          <div class="flex items-center space-x-2 ml-2">
            <!-- 缩进 -->
            <div 
              v-for="i in item.level" 
              :key="i"
              class="w-4 h-4 border-l border-gray-200"
            ></div>
            
            <!-- 展开/关闭图标 -->
            <button
              v-if="item.type === 'directory'"
              @click.stop="toggleExpand(item)"
              class="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
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
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="flattenedData.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">暂无可用用例</h3>
      <p class="mt-1 text-sm text-gray-500">当前没有可选择的测试用例</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

interface TreeItem {
  id: string
  type: 'directory' | 'testcase'
  name?: string
  title?: string
  level: number
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
}

interface Props {
  cases: TestCase[]
  excludedCaseIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludedCaseIds: () => []
})

const emit = defineEmits<{
  selectionChange: [selectedCases: TestCase[]]
}>()

// 构建树形数据
const buildTreeData = (cases: TestCase[]): TreeItem[] => {
  const tree: TreeItem[] = []
  const directoryMap = new Map<string, TreeItem>()
  
  cases.forEach((testCase) => {
    const path = testCase.directoryPath || []
    
    // 构建目录层级
    let currentPath = ''
    path.forEach((dirName: string, index: number) => {
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}-${dirName}` : dirName
      
      if (!directoryMap.has(currentPath)) {
        const directoryItem: TreeItem = {
          id: `dir-${currentPath}`,
          type: 'directory',
          name: dirName,
          level: index,
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
    const testCaseItem: TreeItem = {
      id: testCase.id,
      type: 'testcase',
      title: testCase.title,
      level: path.length,
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

// 扁平化树形数据用于展示
const flattenTreeData = (tree: TreeItem[], level = 0): TreeItem[] => {
  const result: TreeItem[] = []
  
  tree.forEach(item => {
    // 添加当前项
    result.push({
      ...item,
      level: level
    })
    
    // 如果是目录且展开，添加子项
    if (item.type === 'directory' && item.expanded && item.children) {
      result.push(...flattenTreeData(item.children, level + 1))
    }
  })
  
  return result
}

const treeData = ref<TreeItem[]>([])

// 监听cases变化，重新构建树形数据
watch(() => props.cases, (newCases) => {
  treeData.value = buildTreeData(newCases)
}, { immediate: true })

// 扁平化数据用于展示
const flattenedData = computed(() => {
  return flattenTreeData(treeData.value)
})

// 可见的测试用例（排除已关联的）
const visibleTestCases = computed(() => {
  return flattenedData.value
    .filter(item => item.type === 'testcase')
    .filter(item => !props.excludedCaseIds.includes(item.id))
})

// 选中的测试用例
const selectedCases = computed(() => {
  return visibleTestCases.value
    .filter(item => item.selected)
    .map(item => props.cases.find(c => c.id === item.id)!)
    .filter(Boolean)
})

// 全选状态
const isAllSelected = computed(() => {
  const testCases = visibleTestCases.value
  return testCases.length > 0 && testCases.every(item => item.selected)
})

const isIndeterminate = computed(() => {
  const testCases = visibleTestCases.value
  const selectedCount = testCases.filter(item => item.selected).length
  return selectedCount > 0 && selectedCount < testCases.length
})

// 切换目录展开状态
const toggleExpand = (item: TreeItem) => {
  if (item.type === 'directory') {
    // 强制触发响应式更新
    item.expanded = !item.expanded
    // 确保状态变化被检测到
    treeData.value = [...treeData.value]
  }
}

// 切换单个用例选择
const toggleSelect = (item: TreeItem) => {
  if (item.type === 'testcase') {
    item.selected = !item.selected
    emit('selectionChange', selectedCases.value)
  }
}

// 切换全选
const toggleSelectAll = () => {
  const newSelectedState = !isAllSelected.value
  
  // 遍历所有测试用例（不仅仅是当前可见的）
  const allTestCases = props.cases.filter(testCase => 
    !props.excludedCaseIds.includes(testCase.id)
  )
  
  // 更新所有测试用例的选择状态
  allTestCases.forEach(testCase => {
    // 在树形数据中找到对应的用例并更新状态
    updateTestCaseSelection(testCase.id, newSelectedState)
  })
  
  emit('selectionChange', selectedCases.value)
}

// 更新测试用例选择状态的辅助函数
const updateTestCaseSelection = (testCaseId: string, selected: boolean) => {
  const updateInTree = (items: TreeItem[]) => {
    items.forEach(item => {
      if (item.type === 'testcase' && item.id === testCaseId) {
        item.selected = selected
      } else if (item.type === 'directory' && item.children) {
        updateInTree(item.children)
      }
    })
  }
  
  updateInTree(treeData.value)
}

// 目录选择状态
const isDirectorySelected = (directory: TreeItem) => {
  if (directory.type !== 'directory' || !directory.children) return false
  
  const testCases = directory.children.filter(item => item.type === 'testcase')
  const visibleTestCases = testCases.filter(item => !props.excludedCaseIds.includes(item.id))
  
  return visibleTestCases.length > 0 && visibleTestCases.every(item => item.selected)
}

const isDirectoryIndeterminate = (directory: TreeItem) => {
  if (directory.type !== 'directory' || !directory.children) return false
  
  const testCases = directory.children.filter(item => item.type === 'testcase')
  const visibleTestCases = testCases.filter(item => !props.excludedCaseIds.includes(item.id))
  const selectedCount = visibleTestCases.filter(item => item.selected).length
  
  return selectedCount > 0 && selectedCount < visibleTestCases.length
}

// 切换目录选择
const toggleDirectorySelect = (directory: TreeItem) => {
  if (directory.type !== 'directory' || !directory.children) return
  
  const testCases = directory.children.filter(item => item.type === 'testcase')
  const visibleTestCases = testCases.filter(item => !props.excludedCaseIds.includes(item.id))
  const newSelectedState = !isDirectorySelected(directory)
  
  visibleTestCases.forEach(item => {
    item.selected = newSelectedState
  })
  
  emit('selectionChange', selectedCases.value)
}

// 暴露方法给父组件
defineExpose({
  selectedCases,
  expandAll: () => {
    const updateExpanded = (items: TreeItem[], expanded: boolean) => {
      items.forEach(item => {
        if (item.type === 'directory') {
          item.expanded = expanded
          if (item.children) {
            updateExpanded(item.children, expanded)
          }
        }
      })
    }
    
    updateExpanded(treeData.value, true)
    // 强制触发响应式更新
    treeData.value = [...treeData.value]
  },
  collapseAll: () => {
    const updateExpanded = (items: TreeItem[], expanded: boolean) => {
      items.forEach(item => {
        if (item.type === 'directory') {
          item.expanded = expanded
          if (item.children) {
            updateExpanded(item.children, expanded)
          }
        }
      })
    }
    
    updateExpanded(treeData.value, false)
    // 强制触发响应式更新
    treeData.value = [...treeData.value]
  },
  clearSelection: () => {
    const clearInTree = (items: TreeItem[]) => {
      items.forEach(item => {
        if (item.type === 'testcase') {
          item.selected = false
        } else if (item.type === 'directory' && item.children) {
          clearInTree(item.children)
        }
      })
    }
    
    clearInTree(treeData.value)
    emit('selectionChange', [])
  }
})
</script>

<style scoped>
.testcase-selector-tree {
  @apply bg-white;
}

.tree-content {
  @apply max-h-80 overflow-y-auto;
}

.tree-item {
  @apply transition-colors duration-150;
}

.tree-item:hover {
  @apply bg-gray-50;
}
</style>

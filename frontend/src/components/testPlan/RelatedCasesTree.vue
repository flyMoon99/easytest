<template>
  <div class="related-cases-tree">
    <div 
      v-for="(item, index) in treeData" 
      :key="index"
      class="tree-item"
    >
      <!-- 目录项 -->
      <div 
        v-if="item.type === 'directory'"
        class="directory-item"
        :class="{ 'expanded': item.expanded }"
      >
        <div 
          class="directory-header"
          @click="toggleDirectory(item)"
        >
          <div class="flex items-center space-x-2">
            <svg 
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-90': item.expanded }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            <span class="font-medium text-gray-900">{{ item.name }}</span>
            <span class="text-sm text-gray-500">({{ item.caseCount }})</span>
          </div>
        </div>
        
        <!-- 子项 -->
        <div 
          v-if="item.expanded"
          class="directory-children"
          :style="{ paddingLeft: `${item.level * 20}px` }"
        >
          <RelatedCasesTree 
            :cases="item.children || []" 
            :level="item.level + 1"
          />
        </div>
      </div>
      
      <!-- 用例项 -->
      <div 
        v-else-if="item.type === 'testcase'"
        class="testcase-item"
        :style="{ paddingLeft: `${level * 20}px` }"
      >
        <div class="flex items-center space-x-3 py-2 px-3 hover:bg-gray-50 rounded">
          <div class="flex items-center space-x-2 flex-1">
            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              CASE
            </span>
            <span class="text-sm text-gray-900">{{ item.title }}</span>
          </div>
          
          <div class="flex items-center space-x-4 text-xs text-gray-500">
            <span>{{ item.assignee }}</span>
            <span :class="getStatusClass(item.status || '')">
              {{ getStatusText(item.status || '') }}
            </span>
            <span>{{ formatDateTime(item.updatedAt || '') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface TestCase {
  id: string
  title: string
  status: string
  assignee: string
  updatedAt: string
  directoryPath: string[]
}

interface TreeItem {
  type: 'directory' | 'testcase'
  name?: string
  title?: string
  level: number
  expanded?: boolean
  caseCount?: number
  children?: TreeItem[]
  status?: string
  assignee?: string
  updatedAt?: string
}

interface Props {
  cases: (TestCase | TreeItem)[]
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

// 构建树形数据
const treeData = computed(() => {
  const tree: TreeItem[] = []
  const directoryMap = new Map<string, TreeItem>()
  
  props.cases.forEach((item) => {
    // 只处理TestCase类型的数据
    if ('directoryPath' in item) {
      const testCase = item as TestCase
      const path = testCase.directoryPath || []
      
      // 构建目录层级
      let currentPath = ''
      path.forEach((dirName: string, index: number) => {
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}-${dirName}` : dirName
        
        if (!directoryMap.has(currentPath)) {
          const directoryItem: TreeItem = {
            type: 'directory',
            name: dirName,
            level: props.level + index,
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
        type: 'testcase',
        title: testCase.title,
        level: props.level + path.length,
        status: testCase.status,
        assignee: testCase.assignee,
        updatedAt: testCase.updatedAt
      }
      
      if (currentPath && directoryMap.has(currentPath)) {
        directoryMap.get(currentPath)!.children!.push(testCaseItem)
      } else {
        tree.push(testCaseItem)
      }
    }
  })
  
  return tree
})

// 切换目录展开状态
const toggleDirectory = (item: TreeItem) => {
  if (item.type === 'directory') {
    item.expanded = !item.expanded
  }
}

// 获取状态样式
const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'pending':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '通过'
    case 'failed':
      return '失败'
    case 'pending':
      return '待执行'
    default:
      return '未知'
  }
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.related-cases-tree {
  @apply space-y-1;
}

.tree-item {
  @apply relative;
}

.directory-item {
  @apply border-b border-gray-100 last:border-b-0;
}

.directory-header {
  @apply flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 transition-colors;
}

.directory-children {
  @apply border-l border-gray-200 ml-4;
}

.testcase-item {
  @apply border-b border-gray-50 last:border-b-0;
}

.testcase-item:hover {
  @apply bg-gray-50;
}
</style>

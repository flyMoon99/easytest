<template>
  <div class="directory-tree">
    <!-- 搜索框 -->
    <div class="mb-4">
      <div class="relative">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索目录..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          @input="handleSearch"
        >
        <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <button
          v-if="searchKeyword"
          @click="clearSearch"
          class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <button
          @click="expandAll"
          class="p-1 text-gray-500 hover:text-gray-700"
          title="展开所有"
        >
          <ChevronDownIcon class="h-4 w-4" />
        </button>
        <button
          @click="collapseAll"
          class="p-1 text-gray-500 hover:text-gray-700"
          title="折叠所有"
        >
          <ChevronRightIcon class="h-4 w-4" />
        </button>
        <button
          @click="refreshTree"
          class="p-1 text-gray-500 hover:text-gray-700"
          title="刷新"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </button>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-300 rounded hover:bg-primary-50"
      >
        <PlusIcon class="h-4 w-4" />
        <span>新建目录</span>
      </button>
    </div>

    <!-- 目录树 -->
    <div class="directory-tree-content">
      <div v-if="directoryStore.treeLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
      
      <div v-else-if="filteredDirectoryTree.length === 0" class="text-center py-8 text-gray-500">
        <FolderIcon class="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>{{ searchKeyword ? '未找到匹配的目录' : '暂无目录' }}</p>
        <button
          v-if="!searchKeyword"
          @click="showCreateModal = true"
          class="mt-2 text-primary-600 hover:text-primary-700"
        >
          创建第一个目录
        </button>
      </div>
      
      <div v-else class="space-y-1">
        <DirectoryTreeNode
          v-for="directory in filteredDirectoryTree"
          :key="directory.id"
          :directory="directory"
          :level="directory.level"
          @select="handleSelectDirectory"
          @toggle="handleToggleDirectory"
          @edit="handleEditDirectory"
          @delete="handleDeleteDirectory"
          @create-child="handleCreateChildDirectory"
          @move="handleMoveDirectory"
        />
      </div>
    </div>

    <!-- 创建目录模态框 -->
    <DirectoryCreateModal
      v-model="showCreateModal"
      :parent-directory="createParentDirectory"
      @created="handleDirectoryCreated"
    />

    <!-- 编辑目录模态框 -->
    <DirectoryEditModal
      v-model="showEditModal"
      :directory="editingDirectory"
      @updated="handleDirectoryUpdated"
    />

    <!-- 删除确认模态框 -->
    <DirectoryDeleteModal
      v-model="showDeleteModal"
      :directory="deletingDirectory"
      @deleted="handleDirectoryDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import type { Directory, DirectoryTreeNode as DirectoryTreeNodeType } from '@/types/directory'
import DirectoryTreeNode from './DirectoryTreeNode.vue'
import DirectoryCreateModal from './DirectoryCreateModal.vue'
import DirectoryEditModal from './DirectoryEditModal.vue'
import DirectoryDeleteModal from './DirectoryDeleteModal.vue'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  PlusIcon,
  FolderIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits
const emit = defineEmits<{
  'select': [directory: Directory | null]
  'directory-created': [directory: Directory]
  'directory-updated': [directory: Directory]
  'directory-deleted': [directoryId: string]
}>()

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const searchKeyword = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const createParentDirectory = ref<Directory | null>(null)
const editingDirectory = ref<Directory | null>(null)
const deletingDirectory = ref<Directory | null>(null)

// 计算属性
const filteredDirectoryTree = computed((): DirectoryTreeNodeType[] => {
  const tree = directoryStore.filteredDirectoryTree
  console.log('DirectoryTree - filteredDirectoryTree:', tree)
  return tree
})

// 方法
const handleSearch = () => {
  directoryStore.searchDirectories(searchKeyword.value)
}

const clearSearch = () => {
  searchKeyword.value = ''
  directoryStore.clearSearch()
}

const expandAll = () => {
  directoryStore.expandAllDirectories()
}

const collapseAll = () => {
  directoryStore.collapseAllDirectories()
}

const refreshTree = async () => {
  try {
    await directoryStore.fetchDirectoryTree()
  } catch (error) {
    console.error('刷新目录树失败:', error)
  }
}

const handleSelectDirectory = (directory: DirectoryTreeNodeType) => {
  directoryStore.selectDirectory(directory.id)
  emit('select', directory)
}

const handleToggleDirectory = (directory: DirectoryTreeNodeType) => {
  directoryStore.toggleDirectoryExpanded(directory.id)
}

const handleEditDirectory = (directory: DirectoryTreeNodeType) => {
  if (props.readonly) return
  
  editingDirectory.value = directory
  showEditModal.value = true
}

const handleDeleteDirectory = (directory: DirectoryTreeNodeType) => {
  if (props.readonly) return
  
  deletingDirectory.value = directory
  showDeleteModal.value = true
}

const handleCreateChildDirectory = (directory: DirectoryTreeNodeType) => {
  if (props.readonly) return
  
  createParentDirectory.value = directory
  showCreateModal.value = true
}

const handleMoveDirectory = async (sourceDirectory: DirectoryTreeNodeType, targetParent: Directory | null) => {
  if (props.readonly) return
  
  try {
    await directoryStore.moveDirectory(sourceDirectory.id, {
      parentId: targetParent?.id || null
    })
  } catch (error) {
    console.error('移动目录失败:', error)
  }
}

const handleDirectoryCreated = (directory: Directory) => {
  showCreateModal.value = false
  createParentDirectory.value = null
  emit('directory-created', directory)
}

const handleDirectoryUpdated = (directory: Directory) => {
  showEditModal.value = false
  editingDirectory.value = null
  emit('directory-updated', directory)
}

const handleDirectoryDeleted = (directoryId: string) => {
  showDeleteModal.value = false
  deletingDirectory.value = null
  emit('directory-deleted', directoryId)
}

// 监听搜索关键词
watch(() => directoryStore.searchKeyword, (newKeyword) => {
  searchKeyword.value = newKeyword
})

// 生命周期
onMounted(async () => {
  if (directoryStore.directories.length === 0) {
    await refreshTree()
  }
})
</script>

<style scoped>
.directory-tree {
  @apply h-full flex flex-col;
}

.directory-tree-content {
  @apply flex-1 overflow-y-auto;
}

/* 自定义滚动条 */
.directory-tree-content::-webkit-scrollbar {
  @apply w-2;
}

.directory-tree-content::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.directory-tree-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded hover:bg-gray-400;
}
</style>

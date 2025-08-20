<template>
    <div class="h-full flex flex-col">
      <!-- 页面头部 -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">目录管理</h1>
            <p class="text-gray-600 mt-1">管理测试用例的目录结构，支持多层级分类组织</p>
          </div>
          <div class="flex items-center space-x-3">
            <!-- 视图切换 -->
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="viewMode = 'tree'"
                class="px-3 py-1 text-sm rounded-md transition-colors"
                :class="{
                  'bg-white shadow-sm text-gray-900': viewMode === 'tree',
                  'text-gray-600 hover:text-gray-900': viewMode !== 'tree'
                }"
              >
                <Bars3Icon class="h-4 w-4 inline mr-1" />
                树形视图
              </button>
              <button
                @click="viewMode = 'list'"
                class="px-3 py-1 text-sm rounded-md transition-colors"
                :class="{
                  'bg-white shadow-sm text-gray-900': viewMode === 'list',
                  'text-gray-600 hover:text-gray-900': viewMode !== 'list'
                }"
              >
                <ListBulletIcon class="h-4 w-4 inline mr-1" />
                列表视图
              </button>
            </div>
            
            <!-- 刷新按钮 -->
            <BaseButton
              variant="outline"
              size="sm"
              @click="refreshData"
              :loading="directoryStore.treeLoading"
            >
              <ArrowPathIcon class="h-4 w-4 mr-1" />
              刷新
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 左侧目录树 -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div class="flex-1 p-4">
            <DirectoryTree
              @select="handleSelectDirectory"
              @directory-created="handleDirectoryCreated"
              @directory-updated="handleDirectoryUpdated"
              @directory-deleted="handleDirectoryDeleted"
            />
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div class="flex-1 flex flex-col">
          <!-- 面包屑导航 -->
          <div v-if="selectedDirectory" class="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <nav class="flex items-center space-x-2 text-sm">
              <span class="text-gray-500">位置：</span>
              <span
                v-for="(segment, index) in breadcrumb"
                :key="segment.id"
                class="flex items-center"
              >
                <button
                  @click="selectDirectory(segment)"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {{ segment.name }}
                </button>
                <ChevronRightIcon
                  v-if="index < breadcrumb.length - 1"
                  class="h-4 w-4 text-gray-400 mx-2"
                />
              </span>
            </nav>
          </div>

          <!-- 目录详情 -->
          <div class="flex-1 overflow-y-auto">
            <!-- 选中目录时显示详情 -->
            <div v-if="selectedDirectory" class="p-6">
              <DirectoryDetail
                :directory="selectedDirectory"
                @edit="handleEditDirectory"
                @delete="handleDeleteDirectory"
                @create-child="handleCreateChildDirectory"
              />
            </div>

            <!-- 未选中目录时的默认视图 -->
            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <FolderIcon class="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">选择目录</h3>
                <p class="text-gray-600 mb-4">
                  从左侧目录树中选择一个目录查看详细信息
                </p>
                <BaseButton @click="handleCreateRootDirectory">
                  <PlusIcon class="h-4 w-4 mr-1" />
                  创建新目录
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息底部栏 -->
      <div class="bg-white border-t border-gray-200 px-6 py-3">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <div class="flex items-center space-x-6">
            <span>总目录数：{{ statistics.totalDirectories }}</span>
            <span>总用例数：{{ statistics.totalCases }}</span>
            <span>已完成：{{ statistics.completedCases }}</span>
          </div>
          <div v-if="selectedDirectory">
            完成率：{{ completionRate }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 创建目录模态框 -->
    <DirectoryCreateModal
      v-model="showCreateModal"
      :parent-directory="parentDirectory"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import { directoryUtils } from '@/services/directoryApi'
import type { Directory } from '@/types/directory'
import DirectoryTree from '@/components/directory/DirectoryTree.vue'
import DirectoryDetail from '@/components/directory/DirectoryDetail.vue'
import DirectoryCreateModal from '@/components/directory/DirectoryCreateModal.vue'
import DirectoryEditModal from '@/components/directory/DirectoryEditModal.vue'
import DirectoryDeleteModal from '@/components/directory/DirectoryDeleteModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import {
  Bars3Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  FolderIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const viewMode = ref<'tree' | 'list'>('tree')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingDirectory = ref<Directory | null>(null)
const deletingDirectory = ref<Directory | null>(null)
const parentDirectory = ref<Directory | null>(null)

// 计算属性
const selectedDirectory = computed(() => directoryStore.selectedDirectory)

const breadcrumb = computed(() => {
  if (!selectedDirectory.value) return []
  
  return directoryStore.getDirectoryBreadcrumb(selectedDirectory.value.id)
})

const statistics = computed(() => {
  const dirs = directoryStore.directories
  const totalDirectories = dirs.length
  let totalCases = 0
  let completedCases = 0

  dirs.forEach(dir => {
    totalCases += dir.statistics.totalCases
    completedCases += dir.statistics.completedCases
  })

  return {
    totalDirectories,
    totalCases,
    completedCases
  }
})

const completionRate = computed(() => {
  if (!selectedDirectory.value) return 0
  
  return directoryUtils.calculateCompletionRate({
    totalCases: selectedDirectory.value.statistics.totalCases,
    completedCases: selectedDirectory.value.statistics.completedCases
  })
})

// 方法
const refreshData = async () => {
  try {
    await directoryStore.fetchDirectoryTree()
  } catch (error) {
    console.error('刷新数据失败:', error)
  }
}

const handleSelectDirectory = (directory: Directory | null) => {
  if (directory) {
    directoryStore.selectDirectory(directory.id)
  }
}

const selectDirectory = (directory: Directory) => {
  directoryStore.selectDirectory(directory.id)
}

const handleEditDirectory = (directory: Directory) => {
  editingDirectory.value = directory
  showEditModal.value = true
}

const handleDeleteDirectory = (directory: Directory) => {
  deletingDirectory.value = directory
  showDeleteModal.value = true
}

const handleCreateRootDirectory = () => {
  // 创建根目录，清除父目录
  parentDirectory.value = null
  showCreateModal.value = true
}

const handleCreateChildDirectory = (parent: Directory) => {
  // 设置父目录并打开创建模态框
  parentDirectory.value = parent
  showCreateModal.value = true
}

const handleDirectoryCreated = (directory: Directory) => {
  // 目录创建成功后的处理
  parentDirectory.value = null // 清除父目录状态
  directoryStore.selectDirectory(directory.id)
}

const handleDirectoryUpdated = (directory: Directory) => {
  // 目录更新成功后的处理
  editingDirectory.value = null
}

const handleDirectoryDeleted = (directoryId: string) => {
  // 目录删除成功后的处理
  deletingDirectory.value = null
  
  // 如果删除的是当前选中的目录，清除选中状态
  if (selectedDirectory.value?.id === directoryId) {
    directoryStore.selectDirectory(null)
  }
}

// 生命周期
onMounted(() => {
  refreshData()
})

// 设置页面标题
document.title = '目录管理 - 易测平台'
</script>

<style scoped>
/* 自定义样式 */
</style>

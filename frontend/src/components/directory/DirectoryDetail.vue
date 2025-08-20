<template>
  <div class="directory-detail">
    <!-- 目录基本信息 -->
    <BaseCard title="目录信息">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 左列：基本信息 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目录名称</label>
            <div class="flex items-center space-x-2">
              <component
                :is="getDirectoryIcon()"
                class="h-5 w-5"
                :style="{ color: directory.color }"
              />
              <span class="text-lg font-semibold">{{ directory.name }}</span>
              <span
                v-if="directory.status === 'archived'"
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                已归档
              </span>
            </div>
          </div>

          <div v-if="directory.description">
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <p class="text-gray-900">{{ directory.description }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">路径</label>
            <p class="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
              {{ directory.path }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">层级</label>
              <p class="text-gray-900">第 {{ directory.level + 1 }} 层</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <p class="text-gray-900">{{ directory.sortOrder || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- 右列：统计信息 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">用例统计</label>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {{ directory.statistics.totalCases }}
                </div>
                <div class="text-sm text-blue-600">总用例数</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  {{ directory.statistics.completedCases }}
                </div>
                <div class="text-sm text-green-600">已完成</div>
              </div>
              <div class="bg-yellow-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-yellow-600">
                  {{ directory.statistics.pendingCases }}
                </div>
                <div class="text-sm text-yellow-600">待处理</div>
              </div>
              <div class="bg-red-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-red-600">
                  {{ directory.statistics.failedCases }}
                </div>
                <div class="text-sm text-red-600">失败</div>
              </div>
            </div>
          </div>

          <!-- 完成率进度条 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-700">完成率</label>
              <span class="text-sm text-gray-600">{{ completionRate }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${completionRate}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <BaseButton
          variant="outline"
          @click="$emit('create-child', directory)"
        >
          <PlusIcon class="h-4 w-4 mr-1" />
          创建子目录
        </BaseButton>
        <BaseButton
          variant="outline"
          @click="$emit('edit', directory)"
        >
          <PencilIcon class="h-4 w-4 mr-1" />
          编辑
        </BaseButton>
        <BaseButton
          variant="outline"
          @click="refreshStatistics"
          :loading="loadingStats"
        >
          <ArrowPathIcon class="h-4 w-4 mr-1" />
          刷新统计
        </BaseButton>
        <BaseButton
          variant="error"
          @click="$emit('delete', directory)"
        >
          <TrashIcon class="h-4 w-4 mr-1" />
          删除
        </BaseButton>
      </div>
    </BaseCard>

    <!-- 子目录列表 -->
    <BaseCard v-if="hasChildren" title="子目录" class="mt-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="child in directory.children"
          :key="child.id"
          class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          @click="selectChild(child)"
        >
          <div class="flex items-center space-x-2 mb-2">
            <component
              :is="getDirectoryIcon(child)"
              class="h-4 w-4"
              :style="{ color: child.color }"
            />
            <span class="font-medium">{{ child.name }}</span>
          </div>
          <p v-if="child.description" class="text-sm text-gray-600 mb-2">
            {{ child.description }}
          </p>
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ child.statistics.totalCases }} 个用例</span>
            <span>
              {{ directoryUtils.calculateCompletionRate(child.statistics) }}% 完成
            </span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 时间信息 -->
    <BaseCard title="时间信息" class="mt-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
          <p class="text-gray-900">{{ formatDate(directory.createdAt) }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">更新时间</label>
          <p class="text-gray-900">{{ formatDate(directory.updatedAt) }}</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import { directoryUtils } from '@/services/directoryApi'
import type { Directory } from '@/types/directory'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import {
  FolderIcon,
  FolderOpenIcon,
  ArchiveBoxIcon,
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  directory: Directory
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'edit': [directory: Directory]
  'delete': [directory: Directory]
  'create-child': [directory: Directory]
}>()

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const loadingStats = ref(false)

// 计算属性
const hasChildren = computed(() => {
  return props.directory.children && props.directory.children.length > 0
})

const completionRate = computed(() => {
  return directoryUtils.calculateCompletionRate(props.directory.statistics)
})

// 方法
const getDirectoryIcon = (dir?: Directory) => {
  const targetDir = dir || props.directory
  const iconName = directoryUtils.getDirectoryIcon(targetDir, false)
  
  switch (iconName) {
    case 'folder-open':
      return FolderOpenIcon
    case 'archive-box':
      return ArchiveBoxIcon
    default:
      return FolderIcon
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refreshStatistics = async () => {
  loadingStats.value = true
  try {
    await directoryStore.fetchDirectoryStatistics(props.directory.id)
  } catch (error) {
    console.error('刷新统计信息失败:', error)
  } finally {
    loadingStats.value = false
  }
}

const selectChild = (child: Directory) => {
  directoryStore.selectDirectory(child.id)
}
</script>

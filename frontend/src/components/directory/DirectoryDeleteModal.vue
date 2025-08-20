<template>
  <BaseModal
    v-model="isVisible"
    title="删除目录"
    size="sm"
    @close="handleClose"
  >
    <div v-if="directory">
      <!-- 警告信息 -->
      <div class="flex items-start space-x-3 mb-4">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            确认删除目录
          </h3>
          <p class="text-sm text-gray-600">
            您即将删除目录 <strong>{{ directory.name }}</strong>
          </p>
        </div>
      </div>

      <!-- 目录信息 -->
      <div class="bg-gray-50 rounded-lg p-3 mb-4">
        <div class="text-sm">
          <div class="mb-2">
            <span class="text-gray-600">路径：</span>
            <span class="font-medium">{{ directoryUtils.formatDirectoryPath(directory) }}</span>
          </div>
          <div v-if="directory.statistics.totalCases > 0" class="mb-2">
            <span class="text-gray-600">包含用例：</span>
            <span class="font-medium text-red-600">{{ directory.statistics.totalCases }} 个</span>
          </div>
          <div v-if="hasChildren">
            <span class="text-gray-600">子目录：</span>
            <span class="font-medium text-red-600">{{ childrenCount }} 个</span>
          </div>
        </div>
      </div>

      <!-- 删除选项 -->
      <div class="space-y-3 mb-6">
        <label class="flex items-start space-x-3 cursor-pointer">
          <input
            v-model="deleteMode"
            type="radio"
            value="soft"
            class="mt-1 text-red-600 focus:ring-red-500"
          />
          <div>
            <div class="font-medium text-gray-900">软删除（推荐）</div>
            <div class="text-sm text-gray-600">
              将目录标记为已删除，可以稍后恢复
            </div>
          </div>
        </label>
        
        <label class="flex items-start space-x-3 cursor-pointer">
          <input
            v-model="deleteMode"
            type="radio"
            value="force"
            class="mt-1 text-red-600 focus:ring-red-500"
          />
          <div>
            <div class="font-medium text-red-600">强制删除</div>
            <div class="text-sm text-gray-600">
              永久删除目录及其所有子目录和用例，<strong>无法恢复</strong>
            </div>
          </div>
        </label>
      </div>

      <!-- 强制删除确认 -->
      <div v-if="deleteMode === 'force'" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div class="flex items-center space-x-2 mb-2">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-500" />
          <span class="font-medium text-red-800">危险操作确认</span>
        </div>
        <p class="text-sm text-red-700 mb-3">
          此操作将永久删除目录及其所有内容，包括：
        </p>
        <ul class="text-sm text-red-700 list-disc list-inside space-y-1 mb-3">
          <li>当前目录：{{ directory.name }}</li>
          <li v-if="hasChildren">{{ childrenCount }} 个子目录</li>
          <li v-if="directory.statistics.totalCases > 0">{{ directory.statistics.totalCases }} 个测试用例</li>
        </ul>
        <div>
          <label for="confirm-input" class="block text-sm font-medium text-red-800 mb-1">
            请输入目录名称以确认删除：
          </label>
          <BaseInput
            id="confirm-input"
            v-model="confirmText"
            placeholder="输入目录名称"
            class="text-sm"
          />
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end space-x-3">
        <BaseButton
          type="button"
          variant="outline"
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </BaseButton>
        <BaseButton
          type="button"
          variant="error"
          :loading="loading"
          :disabled="!canDelete"
          @click="handleDelete"
        >
          {{ deleteMode === 'force' ? '永久删除' : '删除目录' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import { directoryUtils } from '@/services/directoryApi'
import type { Directory } from '@/types/directory'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  modelValue: boolean
  directory?: Directory | null
}

const props = withDefaults(defineProps<Props>(), {
  directory: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'deleted': [directoryId: string]
}>()

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const loading = ref(false)
const deleteMode = ref<'soft' | 'force'>('soft')
const confirmText = ref('')

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasChildren = computed(() => {
  return props.directory?.children && props.directory.children.length > 0
})

const childrenCount = computed(() => {
  if (!props.directory?.children) return 0
  
  // 递归计算所有子目录数量
  const countChildren = (children: Directory[]): number => {
    let count = children.length
    children.forEach(child => {
      if (child.children) {
        count += countChildren(child.children)
      }
    })
    return count
  }
  
  return countChildren(props.directory.children)
})

const canDelete = computed(() => {
  if (deleteMode.value === 'soft') {
    return true
  }
  
  // 强制删除需要确认输入目录名称
  return confirmText.value === props.directory?.name
})

// 方法
const resetForm = () => {
  deleteMode.value = 'soft'
  confirmText.value = ''
}

const handleDelete = async () => {
  if (loading.value || !props.directory || !canDelete.value) return
  
  loading.value = true
  
  try {
    const force = deleteMode.value === 'force'
    await directoryStore.deleteDirectory(props.directory.id, force)
    
    emit('deleted', props.directory.id)
    handleClose()
  } catch (error: any) {
    console.error('删除目录失败:', error)
    // 这里可以显示错误提示
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (loading.value) return
  
  resetForm()
  isVisible.value = false
}

// 监听模态框显示状态
watch(isVisible, (visible) => {
  if (visible) {
    resetForm()
  }
})

// 监听删除模式变化
watch(deleteMode, () => {
  confirmText.value = ''
})
</script>

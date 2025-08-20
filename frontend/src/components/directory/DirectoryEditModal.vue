<template>
  <BaseModal
    v-model="isVisible"
    title="编辑目录"
    size="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" v-if="directory">
      <div class="space-y-4">
        <!-- 目录路径显示 -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">当前位置：</div>
          <div class="text-sm font-medium">
            {{ directoryUtils.formatDirectoryPath(directory) }}
          </div>
        </div>

        <!-- 目录名称 -->
        <div>
          <label for="edit-name" class="block text-sm font-medium text-gray-700 mb-1">
            目录名称 <span class="text-red-500">*</span>
          </label>
          <BaseInput
            id="edit-name"
            v-model="form.name"
            placeholder="请输入目录名称"
            :error="errors.name"
            required
            @blur="validateName"
          />
        </div>

        <!-- 目录描述 -->
        <div>
          <label for="edit-description" class="block text-sm font-medium text-gray-700 mb-1">
            目录描述
          </label>
          <textarea
            id="edit-description"
            v-model="form.description"
            rows="3"
            placeholder="请输入目录描述（可选）"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        <!-- 目录颜色 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            目录颜色
          </label>
          <div class="flex items-center space-x-3">
            <div
              v-for="color in colorOptions"
              :key="color.value"
              @click="form.color = color.value"
              class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all"
              :style="{ backgroundColor: color.value }"
              :class="{
                'border-gray-800 scale-110': form.color === color.value,
                'border-gray-300 hover:scale-105': form.color !== color.value
              }"
            />
            <input
              v-model="form.color"
              type="color"
              class="w-8 h-8 rounded cursor-pointer border border-gray-300"
            />
          </div>
        </div>

        <!-- 状态 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            目录状态
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                v-model="form.status"
                type="radio"
                value="active"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm">正常</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="form.status"
                type="radio"
                value="archived"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm">归档</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <BaseButton
          type="button"
          variant="outline"
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="loading"
        >
          保存修改
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import { directoryAPI, directoryUtils } from '@/services/directoryApi'
import type { Directory, UpdateDirectoryForm } from '@/types/directory'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

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
  'updated': [directory: Directory]
}>()

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const loading = ref(false)
const form = ref<UpdateDirectoryForm>({})
const errors = ref<Record<string, string>>({})

// 颜色选项
const colorOptions = [
  { value: '#1f2937' },
  { value: '#3b82f6' },
  { value: '#10b981' },
  { value: '#f59e0b' },
  { value: '#ef4444' },
  { value: '#8b5cf6' },
  { value: '#ec4899' },
  { value: '#06b6d4' }
]

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const resetForm = () => {
  if (props.directory) {
    form.value = {
      name: props.directory.name,
      description: props.directory.description || '',
      color: props.directory.color || '#1f2937',
      icon: props.directory.icon || 'folder',
      status: props.directory.status || 'active'
    }
  }
  errors.value = {}
}

const validateName = async () => {
  errors.value.name = ''
  
  if (!form.value.name?.trim()) {
    errors.value.name = '目录名称不能为空'
    return false
  }
  
  if (form.value.name.length > 100) {
    errors.value.name = '目录名称不能超过100个字符'
    return false
  }
  
  // 如果名称没有变化，跳过重名检查
  if (form.value.name === props.directory?.name) {
    return true
  }
  
  // 检查重名
  try {
    const isDuplicate = await directoryAPI.checkNameDuplicate(
      form.value.name.trim(),
      props.directory?.parentId || null,
      props.directory?.id
    )
    
    if (isDuplicate) {
      errors.value.name = '同级目录下已存在相同名称的目录'
      return false
    }
  } catch (error) {
    console.error('检查目录名称重复失败:', error)
  }
  
  return true
}

const handleSubmit = async () => {
  if (loading.value || !props.directory) return
  
  const isValid = await validateName()
  if (!isValid) return
  
  loading.value = true
  
  try {
    const updatedData = {
      ...form.value,
      name: form.value.name?.trim(),
      description: form.value.description?.trim() || ''
    }
    
    const directory = await directoryStore.updateDirectory(props.directory.id, updatedData)
    
    emit('updated', directory)
    handleClose()
  } catch (error: any) {
    console.error('更新目录失败:', error)
    errors.value.name = error.message || '更新目录失败'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (loading.value) return
  
  resetForm()
  isVisible.value = false
}

// 监听目录变化
watch(() => props.directory, () => {
  if (props.directory) {
    resetForm()
  }
}, { immediate: true })

// 监听模态框显示状态
watch(isVisible, (visible) => {
  if (visible && props.directory) {
    resetForm()
    nextTick(() => {
      const nameInput = document.getElementById('edit-name')
      nameInput?.focus()
    })
  }
})
</script>

<template>
  <BaseModal
    v-model="isVisible"
    title="创建目录"
    size="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <!-- 父目录显示 -->
        <div v-if="parentDirectory" class="p-3 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">父目录：</div>
          <div class="flex items-center">
            <FolderIcon class="h-4 w-4 text-gray-500 mr-2" />
            <span class="text-sm font-medium">{{ parentDirectory.name }}</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ directoryUtils.formatDirectoryPath(parentDirectory) }}
          </div>
        </div>

        <!-- 目录名称 -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            目录名称 <span class="text-red-500">*</span>
          </label>
          <BaseInput
            id="name"
            v-model="form.name"
            placeholder="请输入目录名称"
            :error="errors.name"
            required
            @blur="validateName"
          />
        </div>

        <!-- 目录描述 -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            目录描述
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="请输入目录描述（可选）"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            :class="{ 'border-red-500': errors.description }"
          />
          <div v-if="errors.description" class="mt-1 text-sm text-red-600">
            {{ errors.description }}
          </div>
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
              :title="color.name"
            />
            <div class="flex items-center">
              <input
                v-model="form.color"
                type="color"
                class="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-600">自定义</span>
            </div>
          </div>
        </div>

        <!-- 目录图标 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            目录图标
          </label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="icon in iconOptions"
              :key="icon.name"
              type="button"
              @click="form.icon = icon.name"
              class="p-2 rounded-md border transition-all"
              :class="{
                'border-primary-500 bg-primary-50': form.icon === icon.name,
                'border-gray-300 hover:border-gray-400': form.icon !== icon.name
              }"
              :title="icon.label"
            >
              <component :is="icon.component" class="h-5 w-5 mx-auto" />
            </button>
          </div>
        </div>

        <!-- 排序顺序 -->
        <div>
          <label for="sortOrder" class="block text-sm font-medium text-gray-700 mb-1">
            排序顺序
          </label>
          <BaseInput
            id="sortOrder"
            v-model.number="form.sortOrder"
            type="number"
            min="0"
            placeholder="0"
            :error="errors.sortOrder"
          />
          <div class="mt-1 text-xs text-gray-500">
            数值越小排序越靠前，相同时按名称排序
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
          创建目录
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useDirectoryStore } from '@/stores/directory'
import { directoryAPI, directoryUtils } from '@/services/directoryApi'
import type { Directory, CreateDirectoryForm } from '@/types/directory'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import {
  FolderIcon,
  HomeIcon,
  DocumentIcon,
  CogIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BugAntIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  modelValue: boolean
  parentDirectory?: Directory | null
}

const props = withDefaults(defineProps<Props>(), {
  parentDirectory: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [directory: Directory]
}>()

// Store
const directoryStore = useDirectoryStore()

// 响应式数据
const loading = ref(false)
const form = ref<CreateDirectoryForm>({
  name: '',
  description: '',
  parentId: null,
  color: '#1f2937',
  icon: 'folder',
  sortOrder: 0
})

const errors = ref<Record<string, string>>({})

// 颜色选项
const colorOptions = [
  { name: '灰色', value: '#1f2937' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#10b981' },
  { name: '黄色', value: '#f59e0b' },
  { name: '红色', value: '#ef4444' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '粉色', value: '#ec4899' },
  { name: '青色', value: '#06b6d4' }
]

// 图标选项
const iconOptions = [
  { name: 'folder', label: '文件夹', component: FolderIcon },
  { name: 'home', label: '首页', component: HomeIcon },
  { name: 'document', label: '文档', component: DocumentIcon },
  { name: 'cog', label: '设置', component: CogIcon },
  { name: 'shield-check', label: '安全', component: ShieldCheckIcon },
  { name: 'beaker', label: '测试', component: BeakerIcon },
  { name: 'bug-ant', label: '缺陷', component: BugAntIcon },
  { name: 'chart-bar', label: '报告', component: ChartBarIcon }
]

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    parentId: props.parentDirectory?.id || null,
    color: '#1f2937',
    icon: 'folder',
    sortOrder: 0
  }
  errors.value = {}
}

const validateName = async () => {
  errors.value.name = ''
  
  if (!form.value.name.trim()) {
    errors.value.name = '目录名称不能为空'
    return false
  }
  
  if (form.value.name.length > 100) {
    errors.value.name = '目录名称不能超过100个字符'
    return false
  }
  
  // 检查重名
  try {
    const isDuplicate = await directoryAPI.checkNameDuplicate(
      form.value.name.trim(),
      form.value.parentId
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

const validateForm = async () => {
  const isNameValid = await validateName()
  
  // 验证描述
  if (form.value.description && form.value.description.length > 500) {
    errors.value.description = '目录描述不能超过500个字符'
  } else {
    errors.value.description = ''
  }
  
  // 验证排序顺序
  if (form.value.sortOrder !== undefined && form.value.sortOrder < 0) {
    errors.value.sortOrder = '排序顺序不能为负数'
  } else {
    errors.value.sortOrder = ''
  }
  
  return isNameValid && !errors.value.description && !errors.value.sortOrder
}

const handleSubmit = async () => {
  if (loading.value) return
  
  const isValid = await validateForm()
  if (!isValid) return
  
  loading.value = true
  
  try {
    console.log('创建目录 - 表单数据:', form.value)
    console.log('创建目录 - 父目录:', props.parentDirectory)
    
    const directory = await directoryStore.createDirectory({
      ...form.value,
      name: form.value.name.trim(),
      description: form.value.description?.trim() || ''
    })
    
    console.log('创建目录 - 成功:', directory)
    emit('created', directory)
    handleClose()
  } catch (error: any) {
    console.error('创建目录失败:', error)
    
    // 显示错误信息
    if (error.message?.includes('重复')) {
      errors.value.name = '目录名称已存在'
    } else {
      errors.value.name = error.message || '创建目录失败'
    }
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
    // 重置表单，但保持parentId为当前的parentDirectory
    form.value = {
      name: '',
      description: '',
      parentId: props.parentDirectory?.id || null,
      color: '#1f2937',
      icon: 'folder',
      sortOrder: 0
    }
    errors.value = {}
    
    nextTick(() => {
      // 聚焦到名称输入框
      const nameInput = document.getElementById('name')
      nameInput?.focus()
    })
  }
})

// 监听父目录变化（在模态框显示状态监听之后，确保正确的执行顺序）
watch(() => props.parentDirectory, (newParent) => {
  form.value.parentId = newParent?.id || null
}, { immediate: true })
</script>

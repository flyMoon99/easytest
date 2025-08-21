<template>
  <BaseModal
    :model-value="modelValue"
    title="执行测试用例"
    size="lg"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div v-if="testCase" class="space-y-6">
      <!-- 用例信息 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-2">用例信息</h4>
        <div class="space-y-2 text-sm">
          <div>
            <span class="text-gray-600">用例名称：</span>
            <span class="font-medium">{{ testCase.title }}</span>
          </div>
          <div>
            <span class="text-gray-600">用例等级：</span>
            <span class="font-medium">{{ getLevelText(testCase.level) }}</span>
          </div>
          <div>
            <span class="text-gray-600">当前状态：</span>
            <span class="font-medium">{{ getResultText(testCase.result) }}</span>
          </div>
        </div>
      </div>

      <!-- 执行结果选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          执行结果 <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="option in resultOptions"
            :key="option.value"
            @click="form.result = option.value"
            class="flex items-center justify-center px-4 py-3 border rounded-lg transition-colors"
            :class="form.result === option.value 
              ? 'border-primary-500 bg-primary-50 text-primary-700' 
              : 'border-gray-300 hover:border-gray-400 text-gray-700'"
          >
            <div class="flex items-center space-x-2">
              <div 
                class="w-3 h-3 rounded-full"
                :class="option.color"
              ></div>
              <span class="font-medium">{{ option.label }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 执行描述 -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          执行描述
        </label>
        <textarea
          id="description"
          v-model="form.executionDescription"
          rows="4"
          placeholder="请输入执行描述（可选）..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        ></textarea>
        <p class="mt-1 text-xs text-gray-500">
          最多1000个字符
        </p>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm text-red-700">{{ error }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="outline"
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </BaseButton>
        <BaseButton
          @click="handleSubmit"
          :loading="loading"
          :disabled="!form.result"
        >
          确认执行
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { TestPlanTestCaseDetail, UpdateTestCaseResultRequest } from '@/types/test'

interface Props {
  modelValue: boolean
  testCase: TestPlanTestCaseDetail | null
  testPlanId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const loading = ref(false)
const error = ref('')

// 表单数据
const form = ref<UpdateTestCaseResultRequest>({
  result: 'notExecuted',
  executionDescription: ''
})

// 结果选项
const resultOptions = [
  { value: 'pass' as const, label: '通过', color: 'bg-green-500' },
  { value: 'fail' as const, label: '失败', color: 'bg-red-500' },
  { value: 'blocked' as const, label: '阻塞', color: 'bg-orange-500' },
  { value: 'skipped' as const, label: '跳过', color: 'bg-gray-500' }
]

// 监听testCase变化，重置表单
watch(() => props.testCase, (newTestCase) => {
  if (newTestCase) {
    form.value = {
      result: (newTestCase.result as 'pass' | 'fail' | 'blocked' | 'skipped' | 'notExecuted') || 'notExecuted',
      executionDescription: newTestCase.executionDescription || ''
    }
    error.value = ''
  } else {
    // 当testCase为null时，重置表单
    form.value = {
      result: 'notExecuted',
      executionDescription: ''
    }
    error.value = ''
  }
}, { immediate: true })

// 方法
const getLevelText = (level?: string) => {
  switch (level) {
    case '高':
      return '高'
    case '中':
      return '中'
    case '低':
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

const handleClose = () => {
  emit('update:modelValue', false)
  error.value = ''
}

const handleSubmit = async () => {
  if (!props.testCase || !form.value.result) {
    error.value = '请选择执行结果'
    return
  }

  try {
    loading.value = true
    error.value = ''

    // 这里需要调用API更新用例结果
    // 由于我们还没有在组件中直接调用API，先通过emit传递给父组件处理
    emit('success', {
      testCaseId: props.testCase.testCaseId,
      data: form.value
    })

    handleClose()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '执行失败'
  } finally {
    loading.value = false
  }
}
</script>

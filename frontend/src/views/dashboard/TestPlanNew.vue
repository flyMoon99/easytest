<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center space-x-4">
      <BaseButton 
        variant="outline" 
        size="sm"
        @click="router.back()"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </BaseButton>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新增测试计划</h1>
        <p class="text-gray-600">创建新的测试计划</p>
      </div>
    </div>

    <!-- 表单 -->
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 计划名称 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            计划名称
            <span class="text-red-500 ml-1">*</span>
          </label>
          <BaseInput
            v-model="form.name"
            placeholder="请输入计划名称"
            :error="errors.name"
            @blur="validateName"
          />
          <p v-if="errors.name" class="text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <!-- 计划描述 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            计划描述
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="请输入计划描述（可选）"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            :class="{ 'border-red-300': errors.description }"
            @blur="validateDescription"
          ></textarea>
          <p v-if="errors.description" class="text-sm text-red-600">
            {{ errors.description }}
          </p>
        </div>

        <!-- 状态 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            状态
            <span class="text-red-500 ml-1">*</span>
          </label>
          <select
            v-model="form.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :class="{ 'border-red-300': errors.status }"
            @change="validateStatus"
          >
            <option value="draft">草稿</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <p v-if="errors.status" class="text-sm text-red-600">
            {{ errors.status }}
          </p>
        </div>

        <!-- 测试类型 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            测试类型
            <span class="text-red-500 ml-1">*</span>
          </label>
          <select
            v-model="form.testType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :class="{ 'border-red-300': errors.testType }"
            @change="validateTestType"
          >
            <option value="">请选择测试类型</option>
            <option 
              v-for="option in TEST_TYPE_OPTIONS" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <p v-if="errors.testType" class="text-sm text-red-600">
            {{ errors.testType }}
          </p>
        </div>

        <!-- 测试负责人 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            测试负责人
            <span class="text-red-500 ml-1">*</span>
          </label>
          <BaseInput
            v-model="form.assignee"
            placeholder="请输入测试负责人"
            :error="errors.assignee"
            @blur="validateAssignee"
          />
          <p v-if="errors.assignee" class="text-sm text-red-600">
            {{ errors.assignee }}
          </p>
        </div>

        <!-- 时间范围 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 开始时间 -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">
              开始时间
              <span class="text-red-500 ml-1">*</span>
            </label>
            <input
              v-model="form.startTime"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-300': errors.startTime }"
              @change="validateStartTime"
            />
            <p v-if="errors.startTime" class="text-sm text-red-600">
              {{ errors.startTime }}
            </p>
          </div>

          <!-- 结束时间 -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">
              结束时间
              <span class="text-red-500 ml-1">*</span>
            </label>
            <input
              v-model="form.endTime"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-300': errors.endTime }"
              @change="validateEndTime"
            />
            <p v-if="errors.endTime" class="text-sm text-red-600">
              {{ errors.endTime }}
            </p>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <BaseButton
            type="button"
            variant="outline"
            @click="router.back()"
          >
            取消
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :loading="loading"
            :disabled="!isFormValid"
          >
            {{ loading ? '创建中...' : '创建测试计划' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTestPlanStore } from '@/stores/testPlan'
import { TEST_TYPE_OPTIONS } from '@/types/testPlan'
import type { CreateTestPlanForm } from '@/types/testPlan'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const router = useRouter()
const testPlanStore = useTestPlanStore()

// 表单数据
const form = reactive<CreateTestPlanForm>({
  name: '',
  description: '',
  status: 'draft',
  testType: '',
  assignee: '',
  startTime: '',
  endTime: ''
})

// 错误信息
const errors = reactive({
  name: '',
  description: '',
  status: '',
  testType: '',
  assignee: '',
  startTime: '',
  endTime: ''
})

// 状态
const loading = ref(false)

// 计算属性
const isFormValid = computed(() => {
  return (
    form.name && 
    form.testType && 
    form.assignee && 
    form.startTime && 
    form.endTime &&
    !errors.name && 
    !errors.description && 
    !errors.status && 
    !errors.testType && 
    !errors.assignee && 
    !errors.startTime && 
    !errors.endTime
  )
})

// 验证方法
const validateName = () => {
  if (!form.name.trim()) {
    errors.name = '计划名称不能为空'
  } else if (form.name.length > 100) {
    errors.name = '计划名称最多100个字符'
  } else {
    errors.name = ''
  }
}

const validateDescription = () => {
  if (form.description && form.description.length > 2000) {
    errors.description = '计划描述最多2000个字符'
  } else {
    errors.description = ''
  }
}

const validateStatus = () => {
  if (!form.status) {
    errors.status = '请选择状态'
  } else {
    errors.status = ''
  }
}

const validateTestType = () => {
  if (!form.testType) {
    errors.testType = '请选择测试类型'
  } else {
    errors.testType = ''
  }
}

const validateAssignee = () => {
  if (!form.assignee.trim()) {
    errors.assignee = '测试负责人不能为空'
  } else if (form.assignee.length > 50) {
    errors.assignee = '测试负责人最多50个字符'
  } else {
    errors.assignee = ''
  }
}

const validateStartTime = () => {
  if (!form.startTime) {
    errors.startTime = '请选择开始时间'
  } else {
    errors.startTime = ''
  }
}

const validateEndTime = () => {
  if (!form.endTime) {
    errors.endTime = '请选择结束时间'
  } else if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
    errors.endTime = '结束时间必须晚于开始时间'
  } else {
    errors.endTime = ''
  }
}

// 提交方法
const handleSubmit = async () => {
  // 验证所有字段
  validateName()
  validateDescription()
  validateStatus()
  validateTestType()
  validateAssignee()
  validateStartTime()
  validateEndTime()

  if (!isFormValid.value) {
    return
  }

  loading.value = true

  try {
    await testPlanStore.createTestPlan({
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString()
    })

    // 创建成功，跳转到列表页
    router.push('/dashboard/test-plan/list')
  } catch (error) {
    console.error('创建测试计划失败:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  // 设置默认的开始时间为当前时间
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  
  form.startTime = localDateTime
  
  // 设置默认的结束时间为当前时间加7天
  const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const localEndDateTime = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  
  form.endTime = localEndDateTime
})
</script>

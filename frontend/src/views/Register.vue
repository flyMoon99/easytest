<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white text-xl font-bold">易</span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        创建新账户
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        或
        <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500">
          登录现有账户
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <BaseCard class="px-4 py-8 sm:px-10">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 邮箱输入 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <div class="mt-1">
              <BaseInput
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="请输入邮箱地址"
                :error="errors.email"
              />
            </div>
          </div>

          <!-- 手机号输入 -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">
              手机号码
            </label>
            <div class="mt-1">
              <BaseInput
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                placeholder="请输入手机号码"
                :error="errors.phone"
              />
            </div>
          </div>

          <!-- 昵称输入 -->
          <div>
            <label for="nickname" class="block text-sm font-medium text-gray-700">
              昵称（可选）
            </label>
            <div class="mt-1">
              <BaseInput
                id="nickname"
                v-model="form.nickname"
                type="text"
                placeholder="请输入昵称"
                :error="errors.nickname"
              />
            </div>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div class="mt-1">
              <BaseInput
                id="password"
                v-model="form.password"
                type="password"
                required
                placeholder="请输入密码"
                :error="errors.password"
              />
            </div>
            <p class="mt-1 text-sm text-gray-500">
              密码至少6位，包含字母、数字和特殊字符
            </p>
          </div>

          <!-- 确认密码输入 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <div class="mt-1">
              <BaseInput
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                required
                placeholder="请再次输入密码"
                :error="errors.confirmPassword"
              />
            </div>
          </div>

          <!-- 记住我 -->
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              记住我
            </label>
          </div>

          <!-- 错误信息 -->
          <div v-if="authStore.error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ authStore.error }}
                </h3>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div>
            <BaseButton
              type="submit"
              :loading="authStore.loading"
              :disabled="authStore.loading"
              class="w-full"
              size="lg"
            >
              {{ authStore.loading ? '注册中...' : '注册' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { RegisterForm } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const form = reactive<RegisterForm>({
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  remember: false
})

// 表单错误
const errors = reactive({
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})

// 表单验证
const validateForm = (): boolean => {
  let isValid = true
  errors.email = ''
  errors.phone = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.nickname = ''

  // 邮箱验证
  if (!form.email) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 手机号验证
  if (!form.phone) {
    errors.phone = '请输入手机号码'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = '请输入有效的手机号码'
    isValid = false
  }

  // 密码验证
  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少6位'
    isValid = false
  } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(form.password)) {
    errors.password = '密码应包含字母、数字和特殊字符'
    isValid = false
  }

  // 确认密码验证
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  // 昵称验证（可选）
  if (form.nickname && form.nickname.length > 50) {
    errors.nickname = '昵称最多50个字符'
    isValid = false
  }

  return isValid
}

// 提交处理
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const result = await authStore.register(form, form.remember)
    
    if (result.success) {
      // 注册成功，跳转到仪表板
      router.push('/dashboard')
    } else {
      // 注册失败，错误信息已在store中设置
      console.error('Registration failed:', result.message)
    }
  } catch (error) {
    console.error('Registration error:', error)
  }
}
</script> 
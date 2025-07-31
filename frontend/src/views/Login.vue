<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white text-xl font-bold">易</span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        登录您的账户
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        或
        <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">
          注册新账户
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
          </div>

          <!-- 记住我 -->
          <div class="flex items-center justify-between">
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

            <div class="text-sm">
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                忘记密码？
              </a>
            </div>
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
              {{ authStore.loading ? '登录中...' : '登录' }}
            </BaseButton>
          </div>
        </form>

        <!-- 演示账户信息 -->
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 class="text-sm font-medium text-blue-800 mb-2">演示账户</h4>
          <p class="text-sm text-blue-700">
            邮箱: <span class="font-mono">test@foryou56.com</span><br>
            密码: <span class="font-mono">test@123</span>
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { LoginForm } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const form = reactive<LoginForm>({
  email: '',
  password: '',
  remember: false
})

// 表单错误
const errors = reactive({
  email: '',
  password: ''
})

// 表单验证
const validateForm = (): boolean => {
  let isValid = true
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少6位'
    isValid = false
  }

  return isValid
}

// 提交处理
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const result = await authStore.login(form, form.remember)
    
    if (result.success) {
      // 登录成功，跳转到仪表板
      router.push('/dashboard')
    } else {
      // 登录失败，错误信息已在store中设置
      console.error('Login failed:', result.message)
    }
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script> 
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- 头部 -->
      <div class="text-center">
        <router-link to="/" class="inline-flex items-center mb-6">
          <div class="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold">易</span>
          </div>
          <span class="ml-2 text-2xl font-bold text-gray-900">易测平台</span>
        </router-link>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          欢迎回来
        </h2>
        <p class="text-gray-600">
          登录您的账户继续使用智能测试服务
        </p>
      </div>

      <!-- 登录表单 -->
      <BaseCard class="mt-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <BaseInput
            v-model="form.email"
            type="email"
            label="邮箱地址"
            placeholder="请输入您的邮箱"
            required
            :error-message="errors.email"
            @blur="validateEmail"
          />

          <BaseInput
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入您的密码"
            required
            :error-message="errors.password"
            @blur="validatePassword"
          />

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember"
                v-model="form.remember"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="remember" class="ml-2 block text-sm text-gray-700">
                记住我
              </label>
            </div>
            <button
              type="button"
              class="text-sm text-primary-600 hover:text-primary-500"
              @click="handleForgotPassword"
            >
              忘记密码？
            </button>
          </div>

          <BaseButton
            type="submit"
            block
            :loading="authStore.loading"
            :disabled="!isFormValid"
          >
            登录
          </BaseButton>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">还没有账户？</span>
            </div>
          </div>
          <div class="mt-6">
            <BaseButton
              variant="outline"
              block
              @click="router.push('/register')"
            >
              立即注册
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  email: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.email && form.password && !errors.email && !errors.password
})

const validateEmail = () => {
  if (!form.email) {
    errors.email = '请输入邮箱地址'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  if (!form.password) {
    errors.password = '请输入密码'
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少6位'
  } else {
    errors.password = ''
  }
}

const handleSubmit = async () => {
  validateEmail()
  validatePassword()
  
  if (!isFormValid.value) return

  try {
    await authStore.login({
      email: form.email,
      password: form.password,
      remember: form.remember
    })
    
    // 登录成功，重定向
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    // 这里可以显示错误消息
  }
}

const handleForgotPassword = () => {
  // TODO: 实现忘记密码功能
  alert('忘记密码功能开发中...')
}
</script> 
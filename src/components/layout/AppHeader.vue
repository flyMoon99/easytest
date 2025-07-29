<template>
  <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
    <!-- 左侧 Logo 和标题 -->
    <div class="flex items-center">
      <router-link to="/" class="flex items-center">
        <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">易</span>
        </div>
        <span class="ml-2 text-xl font-bold text-gray-900">易测平台</span>
      </router-link>
      <span class="ml-4 text-gray-400">|</span>
      <span class="ml-4 text-sm text-gray-600">控制台</span>
    </div>

    <!-- 右侧用户信息和操作 -->
    <div class="flex items-center space-x-4">
      <!-- 用户邮箱缩写 -->
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span class="text-primary-600 font-medium text-sm">
            {{ authStore.user?.emailAbbr }}
          </span>
        </div>
        <span class="text-sm text-gray-700">{{ authStore.user?.email }}</span>
      </div>

      <!-- 分隔符 -->
      <div class="w-px h-6 bg-gray-300"></div>

      <!-- 退出按钮 -->
      <BaseButton
        variant="outline"
        size="sm"
        @click="handleLogout"
      >
        退出
      </BaseButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script> 
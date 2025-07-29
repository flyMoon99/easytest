<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- 左侧：Logo和平台名称 -->
        <div class="flex items-center">
          <router-link to="/dashboard" class="flex items-center">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">易</span>
            </div>
            <span class="ml-2 text-xl font-bold text-gray-900">易测平台</span>
          </router-link>
        </div>

        <!-- 右侧：用户信息和操作 -->
        <div class="flex items-center space-x-4">
          <!-- 用户信息 -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-600 font-medium text-sm">{{ userInitials }}</span>
              </div>
              <div class="hidden md:block">
                <p class="text-sm font-medium text-gray-900">{{ user?.nickname || user?.email }}</p>
                <p class="text-xs text-gray-500">{{ user?.memberId }}</p>
              </div>
            </div>
          </div>

          <!-- 用户菜单 -->
          <div class="relative">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- 下拉菜单 -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900">{{ user?.nickname || '用户' }}</p>
                <p class="text-xs text-gray-500">{{ user?.email }}</p>
                <p class="text-xs text-gray-400">会员ID: {{ user?.memberId }}</p>
              </div>
              
              <router-link
                to="/dashboard"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="showUserMenu = false"
              >
                仪表板
              </router-link>
              
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)

// 计算属性
const user = computed(() => authStore.user)
const userInitials = computed(() => authStore.userInitials)

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 处理登出
const handleLogout = async () => {
  try {
    await authStore.logout()
    showUserMenu.value = false
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    showUserMenu.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script> 
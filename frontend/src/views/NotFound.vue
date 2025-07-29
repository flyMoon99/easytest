<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-200">404</h1>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">页面未找到</h2>
        <p class="text-gray-600 mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>
      </div>
      
      <div class="space-y-4">
        <BaseButton @click="router.push('/')">
          返回首页
        </BaseButton>
        <BaseButton 
          variant="outline" 
          @click="router.back()"
        >
          返回上一页
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
</script> 
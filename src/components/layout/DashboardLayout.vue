<template>
  <div class="h-screen bg-gray-50 flex flex-col">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <!-- 主要内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 侧边栏 -->
      <AppSidebar />
      
      <!-- 主内容区 -->
      <main class="flex-1 overflow-y-auto">
        <div class="page-container py-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTestStore } from '@/stores'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const testStore = useTestStore()

onMounted(() => {
  // 初始化测试数据
  testStore.getTestRecords()
})
</script> 
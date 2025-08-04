<template>
  <aside class="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
    <!-- 侧边栏内容 -->
    <nav class="flex-1 px-4 py-6 space-y-2">
      <!-- 仪表板 -->
      <router-link
        to="/dashboard"
        :class="[
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          $route.name === 'dashboard'
            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-4-2-4 2V5z" />
        </svg>
        仪表板
      </router-link>

      <!-- 测试管理 -->
      <div class="space-y-1">
        <div class="flex items-center px-3 py-2">
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="text-sm font-medium text-gray-500">测试管理</span>
        </div>
        
        <router-link
          to="/dashboard/test/new"
          :class="[
            'flex items-center px-6 py-2 text-sm rounded-lg transition-colors ml-8',
            $route.name === 'test-new'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增测试
        </router-link>

        <router-link
          to="/dashboard/test/records"
          :class="[
            'flex items-center px-6 py-2 text-sm rounded-lg transition-colors ml-8',
            $route.name === 'test-records'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          测试记录
        </router-link>
      </div>

      <!-- 视频管理 -->
      <div class="space-y-1">
        <div class="flex items-center px-3 py-2">
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span class="text-sm font-medium text-gray-500">视频管理</span>
        </div>
        
        <router-link
          to="/dashboard/video/new"
          :class="[
            'flex items-center px-6 py-2 text-sm rounded-lg transition-colors ml-8',
            $route.name === 'video-new'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增视频
        </router-link>

        <router-link
          to="/dashboard/video/list"
          :class="[
            'flex items-center px-6 py-2 text-sm rounded-lg transition-colors ml-8',
            $route.name === 'video-list'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          视频列表
        </router-link>

        <router-link
          to="/dashboard/test-results"
          :class="[
            'flex items-center px-6 py-2 text-sm rounded-lg transition-colors ml-8',
            $route.name === 'test-results'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          测试结果
        </router-link>
      </div>



      <!-- AI对话 -->
      <router-link
        to="/dashboard/ai-chat"
        :class="[
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          $route.name === 'ai-chat'
            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        AI对话
      </router-link>
    </nav>

    <!-- 底部统计信息 -->
    <div class="px-4 py-4 border-t border-gray-200">
      <div class="text-xs text-gray-500 space-y-1">
        <div class="flex justify-between">
          <span>本月测试:</span>
          <span class="font-medium">{{ testStore.statistics.total }}</span>
        </div>
        <div class="flex justify-between">
          <span>成功率:</span>
          <span class="font-medium text-green-600">{{ testStore.statistics.successRate }}%</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useTestStore } from '@/stores/test'

const testStore = useTestStore()
</script> 
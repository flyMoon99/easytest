<template>
  <div class="space-y-6">
    <!-- 页面标题和操作 -->
    <div class="flex items-center justify-between">
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
          <h1 class="text-2xl font-bold text-gray-900">用例详情</h1>
          <p v-if="currentTest" class="text-gray-600">{{ currentTest.title }}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">

        <BaseButton 
          variant="outline"
          @click="handleDeleteTest"
        >
          删除用例
        </BaseButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="testStore.loading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600">加载用例详情...</span>
      </div>
    </div>

    <!-- 用例不存在 -->
    <div v-else-if="!currentTest" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28c2.624 0 4.928 1.006 6.713 2.714M30 20a6 6 0 11-12 0 6 6 0 0112 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">用例不存在</h3>
      <p class="mt-1 text-gray-500">找不到指定的用例记录</p>
      <div class="mt-6">
        <BaseButton @click="router.push('/dashboard/test/records')">
          返回用例记录
        </BaseButton>
      </div>
    </div>

    <!-- 用例详情内容 -->
    <template v-else>
      <!-- 测试信息和测试过程并排展示 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：用例基本信息 -->
        <BaseCard title="用例信息">
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">用例标题</h4>
              <p class="text-gray-900">{{ currentTest.title }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">所属目录</h4>
              <div v-if="currentTest.directoryId && selectedDirectory" class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                <span class="text-gray-900">{{ selectedDirectory.name }}</span>
                <span class="text-xs text-gray-500">({{ selectedDirectory.path }})</span>
              </div>
              <div v-else-if="currentTest.directoryId && !selectedDirectory" class="text-orange-500 text-sm">
                目录不存在 (ID: {{ currentTest.directoryId }})
              </div>
              <div v-else class="text-gray-500 text-sm">
                未分配目录
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">用例入口URL</h4>
              <a 
                :href="currentTest.entryUrl" 
                target="_blank"
                class="text-primary-600 hover:text-primary-500 break-all"
              >
                {{ currentTest.entryUrl }}
              </a>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">用例等级</h4>
              <div class="flex items-center space-x-2">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  :class="getLevelClass(currentTest.level)"
                >
                  {{ currentTest.level || '中' }}
                </span>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">创建时间</h4>
              <p class="text-gray-900">{{ formatDateTime(currentTest.createdAt) }}</p>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-2">用例描述</h4>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-gray-900 whitespace-pre-wrap">{{ currentTest.description }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
        
        <!-- 右侧：页面截图（始终展示上传的图片） -->
        <BaseCard title="页面截图">
          <template v-if="currentTest?.screenshotUrl">
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <img
                :src="getScreenshotUrl(currentTest.screenshotUrl)"
                :alt="`${currentTest.title} 截图`"
                class="w-full h-auto"
                @error="handleImageError"
                @load="handleImageLoad"
              />
            </div>
            <p class="text-xs text-gray-500 mt-2">
              用例入口URL: {{ currentTest.entryUrl }}
            </p>
          </template>
          <template v-else>
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">暂无截图</h3>
              <p class="mt-1 text-sm text-gray-500">请在“新增用例”中上传页面截图后再查看。</p>
            </div>
          </template>
        </BaseCard>
      </div>








    </template>

    <!-- 删除确认模态框 -->
    <BaseModal
      v-model="showDeleteModal"
      title="确认删除"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        确定要删除测试 "{{ currentTest?.title }}" 吗？此操作不可撤销。
      </p>
      
      <template #footer>
        <BaseButton
          variant="outline"
          @click="showDeleteModal = false"
        >
          取消
        </BaseButton>
        <BaseButton
          variant="error"
          :loading="testStore.loading"
          @click="confirmDelete"
        >
          删除
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTestStore } from '@/stores/test'
import { useDirectoryStore } from '@/stores/directory'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import type { TestRecord } from '@/types'
import config from '@/config'

const router = useRouter()
const route = useRoute()
const testStore = useTestStore()
const directoryStore = useDirectoryStore()

const showDeleteModal = ref(false)

const currentTest = computed(() => testStore.currentTest)
const testId = computed(() => route.params.id as string)

// 获取选中的目录信息
const selectedDirectory = computed(() => {
  if (!currentTest.value?.directoryId) {
    return null
  }
  
  // 递归查找目录（包括子目录）
  const findDirectoryById = (directories: any[], targetId: string): any => {
    for (const dir of directories) {
      if (dir.id === targetId) {
        return dir
      }
      if (dir.children && dir.children.length > 0) {
        const found = findDirectoryById(dir.children, targetId)
        if (found) return found
      }
    }
    return null
  }
  
  return findDirectoryById(directoryStore.directories, currentTest.value!.directoryId)
})



const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取用例等级的样式类
const getLevelClass = (level?: string) => {
  switch (level) {
    case '高':
      return 'bg-red-100 text-red-800'
    case '中':
      return 'bg-yellow-100 text-yellow-800'
    case '低':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}





const handleDeleteTest = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!currentTest.value) return
  
  try {
    await testStore.deleteTest(currentTest.value.id)
    showDeleteModal.value = false
    router.push('/dashboard/test/records')
  } catch (error) {
    console.error('Delete test failed:', error)
  }
}



// 获取截图URL，避免路径重复
const getScreenshotUrl = (screenshotUrl: string) => {
  if (!screenshotUrl) return ''
  
  // 如果已经是完整的URL，直接返回
  if (screenshotUrl.startsWith('http')) {
    return screenshotUrl
  }
  
  // 如果以/screenshots开头，直接拼接baseURL
  if (screenshotUrl.startsWith('/screenshots')) {
    return `${config.api.baseURL}${screenshotUrl}`
  }
  
  // 其他情况，使用完整的screenshotPath
  return `${config.static.screenshotPath}${screenshotUrl}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('Failed to load screenshot image:', {
    src: img.src,
    currentTest: currentTest.value,
    screenshotUrl: currentTest.value?.screenshotUrl
  })
  img.style.display = 'none'
}

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('Screenshot image loaded successfully:', img.src)
}

onMounted(async () => {
  // 先加载测试详情
  if (testId.value) {
    try {
      await testStore.getTestDetail(testId.value)
    } catch (error) {
      console.error('Load test detail failed:', error)
    }
  }
  
  // 然后加载目录数据
  try {
    await directoryStore.fetchDirectoryTree()
  } catch (error) {
    console.error('Load directory tree failed:', error)
  }
})
</script>
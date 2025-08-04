<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">测试结果</h1>
        <p class="mt-1 text-sm text-gray-500">管理视频解析生成的测试结果</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">总结果</p>
            <p class="text-lg font-semibold text-gray-900">{{ testResultStore.statistics.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">待处理</p>
            <p class="text-lg font-semibold text-gray-900">{{ testResultStore.statistics.pending }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">处理中</p>
            <p class="text-lg font-semibold text-gray-900">{{ testResultStore.statistics.processing }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">已完成</p>
            <p class="text-lg font-semibold text-gray-900">{{ testResultStore.statistics.completed }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div class="flex items-center space-x-4">
            <div>
              <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
              <select
                id="status-filter"
                v-model="filters.status"
                @change="handleFilterChange"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            <div>
              <label for="severity-filter" class="block text-sm font-medium text-gray-700 mb-1">紧急程度</label>
              <select
                id="severity-filter"
                v-model="filters.severity"
                @change="handleFilterChange"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">全部程度</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label for="category-filter" class="block text-sm font-medium text-gray-700 mb-1">类别</label>
              <select
                id="category-filter"
                v-model="filters.category"
                @change="handleFilterChange"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">全部类别</option>
                <option value="功能测试">功能测试</option>
                <option value="UI测试">UI测试</option>
                <option value="性能测试">性能测试</option>
                <option value="兼容性测试">兼容性测试</option>
                <option value="安全测试">安全测试</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
              <input
                id="search"
                v-model="filters.search"
                type="text"
                placeholder="搜索问题描述、影响说明..."
                @input="handleSearchInput"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 测试结果列表 -->
      <div class="overflow-hidden">
        <div v-if="testResultStore.loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">加载中...</p>
        </div>

        <div v-else-if="testResultStore.error" class="p-8 text-center">
          <div class="text-red-600">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
            <p class="mt-1 text-sm text-gray-500">{{ testResultStore.error }}</p>
          </div>
        </div>

        <div v-else-if="!testResultStore.hasTestResults" class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无测试结果</h3>
          <p class="mt-1 text-sm text-gray-500">开始解析视频以生成测试结果</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="testResult in testResultStore.testResults"
            :key="testResult.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <!-- 标题和状态 -->
                <div class="flex items-center space-x-2 mb-2">
                  <h3 class="text-sm font-medium text-gray-900 truncate">{{ testResult.issue }}</h3>
                  <span :class="getStatusStyle(testResult.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ getStatusText(testResult.status) }}
                  </span>
                  <span :class="getSeverityStyle(testResult.severity)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ getSeverityText(testResult.severity) }}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ testResult.category }}
                  </span>
                </div>

                <!-- 影响说明 -->
                <p class="text-sm text-gray-600 mb-2">
                  <span class="font-medium">影响：</span>{{ testResult.impact }}
                </p>

                <!-- 改进建议 -->
                <p class="text-sm text-gray-600 mb-2">
                  <span class="font-medium">建议：</span>{{ testResult.recommendation }}
                </p>

                <!-- 关联视频信息 -->
                <div v-if="testResult.video" class="text-xs text-gray-400 mb-2">
                  <span class="font-medium">关联视频：</span>{{ testResult.video.name }}
                </div>

                <!-- 时间信息 -->
                <p class="text-xs text-gray-400">
                  创建时间: {{ formatDate(testResult.createdAt) }}
                  <span v-if="testResult.processedAt" class="ml-4">
                    处理时间: {{ formatDate(testResult.processedAt) }}
                  </span>
                </p>

                <!-- 处理备注 -->
                <p v-if="testResult.processingNote" class="text-xs text-gray-500 mt-1">
                  <span class="font-medium">处理备注：</span>{{ testResult.processingNote }}
                </p>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center space-x-2 ml-4">
                <button
                  @click="handlePlayVideo(testResult)"
                  class="text-sm text-blue-600 hover:text-blue-500"
                  title="播放关联视频"
                >
                  播放
                </button>
                <button
                  v-if="testResult.status !== 'completed'"
                  @click="handleProcessTestResult(testResult)"
                  class="text-sm text-green-600 hover:text-green-500"
                  title="标记为已处理"
                >
                  处理
                </button>
                <button
                  @click="handleDeleteTestResult(testResult.id)"
                  class="text-sm text-red-600 hover:text-red-500"
                  title="删除测试结果"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="testResultStore.pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              显示第 {{ (testResultStore.pagination.page - 1) * testResultStore.pagination.limit + 1 }} 到 
              {{ Math.min(testResultStore.pagination.page * testResultStore.pagination.limit, testResultStore.pagination.total) }} 条，
              共 {{ testResultStore.pagination.total }} 条记录
            </div>
            <div class="flex space-x-2">
              <button
                @click="handlePageChange(testResultStore.pagination.page - 1)"
                :disabled="testResultStore.pagination.page <= 1"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span class="px-3 py-1 text-sm text-gray-700">
                {{ testResultStore.pagination.page }} / {{ testResultStore.pagination.totalPages }}
              </span>
              <button
                @click="handlePageChange(testResultStore.pagination.page + 1)"
                :disabled="testResultStore.pagination.page >= testResultStore.pagination.totalPages"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 视频播放弹窗 -->
  <BaseVideoPlayer
    :visible="showVideoPlayer"
    :video-url="currentVideoUrl"
    :video-title="currentVideoTitle"
    :file-size="currentVideoFileSize"
    :upload-date="currentVideoUploadDate"
    :video-type="currentVideoType"
    :duration="currentVideoDuration"
    @close="handleCloseVideoPlayer"
  />
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useTestResultStore } from '@/stores/testResult'
import type { TestResult } from '@/types/testResult'
import BaseVideoPlayer from '@/components/base/BaseVideoPlayer.vue'

const testResultStore = useTestResultStore()

const filters = reactive({
  status: '',
  severity: '',
  category: '',
  search: ''
})

// 播放弹窗相关状态
const showVideoPlayer = ref(false)
const currentVideoUrl = ref('')
const currentVideoTitle = ref('')
const currentVideoFileSize = ref(0)
const currentVideoUploadDate = ref('')
const currentVideoType = ref('video/mp4')
const currentVideoDuration = ref(0)

// 获取状态样式
const getStatusStyle = (status: TestResult['status']) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  }
  return styles[status]
}

// 获取状态文本
const getStatusText = (status: TestResult['status']) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return texts[status]
}

// 获取紧急程度样式
const getSeverityStyle = (severity: TestResult['severity']) => {
  const styles = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }
  return styles[severity]
}

// 获取紧急程度文本
const getSeverityText = (severity: TestResult['severity']) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[severity]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理筛选变化
const handleFilterChange = () => {
  loadTestResults()
}

// 处理搜索输入
const handleSearchInput = () => {
  loadTestResults()
}

// 处理分页变化
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= testResultStore.pagination.totalPages) {
    loadTestResults({ page })
  }
}

// 加载测试结果列表
  const loadTestResults = async (additionalParams = {}) => {
    try {
      const params = {
        status: filters.status as any,
        severity: filters.severity as any,
        category: filters.category as any,
        search: filters.search,
        ...additionalParams
      }
      await testResultStore.getTestResults(params)
    } catch (error) {
      console.error('Failed to load test results:', error)
    }
  }

// 播放视频
const handlePlayVideo = async (testResult: TestResult) => {
  if (!testResult.video) {
    alert('关联视频信息不存在')
    return
  }
  
  // 从文件路径中提取文件名
  let fileName = testResult.video.originalName
  if (testResult.video.filePath) {
    const pathParts = testResult.video.filePath.split(/[/\\]/)
    fileName = pathParts[pathParts.length - 1] || testResult.video.originalName
  }
  
  // 构建视频URL
  const videoUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/videos/${fileName}`
  
  // 设置播放弹窗数据
  currentVideoUrl.value = videoUrl
  currentVideoTitle.value = testResult.video.name
  currentVideoFileSize.value = testResult.video.fileSize || 0
  currentVideoUploadDate.value = testResult.createdAt
  currentVideoType.value = testResult.video.mimeType || 'video/mp4'
  currentVideoDuration.value = 0
  
  // 显示播放弹窗
  showVideoPlayer.value = true
}

// 关闭视频播放弹窗
const handleCloseVideoPlayer = () => {
  showVideoPlayer.value = false
  // 清空当前视频数据
  currentVideoUrl.value = ''
  currentVideoTitle.value = ''
  currentVideoFileSize.value = 0
  currentVideoUploadDate.value = ''
  currentVideoType.value = 'video/mp4'
  currentVideoDuration.value = 0
}

// 处理测试结果
const handleProcessTestResult = async (testResult: TestResult) => {
  if (confirm('是否处理完成？')) {
    try {
      await testResultStore.updateTestResultStatus(testResult.id, {
        status: 'completed',
        processingNote: '已处理完成'
      })
      // 重新加载列表
      await loadTestResults()
    } catch (error) {
      console.error('Failed to process test result:', error)
    }
  }
}

// 删除测试结果
const handleDeleteTestResult = async (id: string) => {
  if (confirm('确定要删除这个测试结果吗？此操作不可恢复。')) {
    try {
      await testResultStore.deleteTestResult(id)
      // 重新加载列表
      await loadTestResults()
    } catch (error) {
      console.error('Failed to delete test result:', error)
    }
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTestResults()
})
</script> 
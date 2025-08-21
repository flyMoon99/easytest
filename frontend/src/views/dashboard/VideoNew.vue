<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新增视频</h1>
        <p class="mt-1 text-sm text-gray-500">上传视频文件，系统将自动解析视频信息</p>
        <div v-if="testPlanId || testCaseId" class="mt-2 text-xs text-gray-400">
          测试计划ID: {{ testPlanId || '未提供' }} | 用例ID: {{ testCaseId || '未提供' }}
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：测试计划和用例信息 -->
      <div class="space-y-6">
        <!-- 测试计划信息 -->
        <BaseCard title="测试计划信息">
          <div v-if="testPlanInfo" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">测试计划名称</label>
              <p class="text-lg font-semibold text-gray-900">{{ testPlanInfo.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">测试类型</label>
              <p class="text-gray-600">{{ testPlanInfo.testType }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">负责人</label>
              <p class="text-gray-600">{{ testPlanInfo.assignee }}</p>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">未找到测试计划信息</p>
          </div>
        </BaseCard>

        <!-- 测试用例信息 -->
        <BaseCard title="测试用例信息">
          <div v-if="testCaseInfo" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用例标题</label>
              <p class="text-lg font-semibold text-gray-900">{{ testCaseInfo.title }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用例级别</label>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-red-100 text-red-800': testCaseInfo.level === '高',
                      'bg-yellow-100 text-yellow-800': testCaseInfo.level === '中',
                      'bg-green-100 text-green-800': testCaseInfo.level === '低'
                    }">
                {{ testCaseInfo.level }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">测试内容描述</label>
              <p class="text-gray-600 text-sm leading-relaxed">{{ testCaseInfo.description }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用例入口URL</label>
              <a :href="testCaseInfo.entryUrl" target="_blank" class="text-primary-600 hover:text-primary-500 text-sm break-all">
                {{ testCaseInfo.entryUrl }}
              </a>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">未找到测试用例信息</p>
          </div>
        </BaseCard>
      </div>

      <!-- 右侧：视频上传表单 -->
      <div class="space-y-6">
        <BaseCard title="视频信息">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- 视频名称 -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                视频名称
              </label>
              <BaseInput
                id="name"
                v-model="form.name"
                type="text"
                placeholder="请输入视频名称"
                :error="errors.name"
                @blur="validateName"
                @input="validateName"
              />
              <p class="text-sm text-gray-500 mt-1">
                请为视频起一个描述性的名称，便于后续管理
              </p>
            </div>

            <!-- 视频说明 -->
            <div>
              <label for="testDescription" class="block text-sm font-medium text-gray-700 mb-2">
                视频说明
              </label>
              <textarea
                id="testDescription"
                v-model="form.testDescription"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="请描述视频备注信息..."
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': errors.testDescription }"
                @blur="validateTestDescription"
                @input="validateTestDescription"
              ></textarea>
              <p v-if="errors.testDescription" class="text-sm text-red-600 mt-1">{{ errors.testDescription }}</p>
            </div>

            <!-- 视频文件 -->
            <div>
              <label for="video" class="block text-sm font-medium text-gray-700 mb-2">
                选择视频文件
              </label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div v-if="!selectedFile" class="space-y-4">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div>
                    <label for="video-upload" class="cursor-pointer">
                      <span class="text-primary-600 hover:text-primary-500 font-medium">点击上传</span>
                      <span class="text-gray-500">或拖拽文件到此处</span>
                    </label>
                    <input
                      id="video-upload"
                      ref="fileInput"
                      type="file"
                      accept="video/*"
                      class="hidden"
                      @change="handleFileSelect"
                    />
                  </div>
                  <p class="text-xs text-gray-500">
                    支持 MP4、AVI、MOV、WMV、FLV、WebM、MKV、3GP、ASF 格式，最大 500MB
                  </p>
                </div>
                
                <div v-else class="space-y-4">
                  <div class="flex items-center justify-center">
                    <svg class="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                  <button
                    type="button"
                    @click="removeFile"
                    class="text-sm text-red-600 hover:text-red-500"
                  >
                    移除文件
                  </button>
                </div>
          </div>
          <p v-if="errors.video" class="text-sm text-red-600 mt-1">{{ errors.video }}</p>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-end space-x-4">
          <BaseButton
            type="button"
            variant="secondary"
            @click="handleReset"
            :disabled="videoStore.loading"
          >
            重置
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :loading="videoStore.loading"
            :disabled="!isFormValid"
          >
            上传视频
          </BaseButton>
        </div>
      </form>
    </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVideoStore } from '@/stores/video'
import { useTestPlanStore } from '@/stores/testPlan'
import { useTestStore } from '@/stores/test'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'

// Props
interface Props {
  testPlanId?: string
  testCaseId?: string
}

const props = withDefaults(defineProps<Props>(), {
  testPlanId: '',
  testCaseId: ''
})

// 表单数据
const form = reactive({
  name: '',
  testDescription: '',
  testPlanId: '',
  testCaseId: ''
})
const testPlanStore = useTestPlanStore()
const testStore = useTestStore()

const router = useRouter()
const route = useRoute()

// 从路由查询参数获取测试计划ID和用例ID
const testPlanId = computed(() => props.testPlanId || (route.query.testPlanId as string) || '')
const testCaseId = computed(() => props.testCaseId || (route.query.testCaseId as string) || '')

// 调试信息
console.log('VideoNew.vue - 接收到的参数:', {
  props: { testPlanId: props.testPlanId, testCaseId: props.testCaseId },
  routeQuery: route.query,
  computed: { testPlanId: testPlanId.value, testCaseId: testCaseId.value }
})

// 测试计划和用例信息
const testPlanInfo = ref(null)
const testCaseInfo = ref(null)

const videoStore = useVideoStore()

// 加载测试计划和用例信息
const loadTestPlanAndCaseInfo = async () => {
  try {
    if (testPlanId.value && testPlanId.value.trim()) {
      console.log('加载测试计划信息，ID:', testPlanId.value)
      const testPlan = await testPlanStore.getTestPlanDetail(testPlanId.value)
      testPlanInfo.value = testPlan
      console.log('测试计划信息加载成功:', testPlan)
    } else {
      console.log('测试计划ID为空，跳过加载')
    }
    
    if (testCaseId.value && testCaseId.value.trim()) {
      console.log('加载测试用例信息，ID:', testCaseId.value)
      const testCase = await testStore.getTestDetail(testCaseId.value)
      testCaseInfo.value = testCase
      console.log('测试用例信息加载成功:', testCase)
    } else {
      console.log('测试用例ID为空，跳过加载')
    }
  } catch (error) {
    console.error('加载测试计划或用例信息失败:', error)
    // 不抛出错误，让页面继续显示
  }
}

// 监听测试计划ID和用例ID的变化
watch([testPlanId, testCaseId], ([newTestPlanId, newTestCaseId]) => {
  form.testPlanId = newTestPlanId
  form.testCaseId = newTestCaseId
}, { immediate: true })

// 生命周期
onMounted(() => {
  loadTestPlanAndCaseInfo()
})

const errors = reactive({
  name: '',
  video: '',
  testDescription: ''
})

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const isFormValid = computed(() => {
  return form.name && 
         selectedFile.value && 
         testPlanId.value && 
         testCaseId.value && 
         !errors.name && 
         !errors.video && 
         !errors.testDescription
})

const validateName = () => {
  if (!form.name) {
    errors.name = '请输入视频名称'
  } else if (form.name.length < 1) {
    errors.name = '视频名称至少1个字符'
  } else if (form.name.length > 200) {
    errors.name = '视频名称不能超过200个字符'
  } else {
    errors.name = ''
  }
}

const validateTestDescription = () => {
  if (!form.testDescription) {
    errors.testDescription = '请输入测试说明'
  } else if (form.testDescription.length < 10) {
    errors.testDescription = '测试说明至少10个字符'
  } else if (form.testDescription.length > 500) {
    errors.testDescription = '测试说明不能超过500个字符'
  } else {
    errors.testDescription = ''
  }
}

const validateFile = () => {
  if (!selectedFile.value) {
    errors.video = '请选择视频文件'
    return
  }

  // 检查文件大小
  const maxSize = 500 * 1024 * 1024 // 500MB
  if (selectedFile.value.size > maxSize) {
    errors.video = '文件大小超过限制，最大支持 500MB'
    return
  }

  // 检查文件类型 - 支持多种MIME类型和文件扩展名
  const allowedMimeTypes = [
    'video/mp4',
    'video/avi', 
    'video/quicktime', // MOV文件的常见MIME类型
    'video/x-msvideo', // AVI文件的另一种MIME类型
    'video/x-ms-wmv', // WMV文件的MIME类型
    'video/x-flv', // FLV文件的MIME类型
    'video/webm',
    'video/x-matroska', // MKV文件的MIME类型
    'video/3gpp', // 3GP文件的MIME类型
    'video/x-ms-asf' // ASF文件的MIME类型
  ];
  
  const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp', '.asf'];
  
  // 检查MIME类型（不区分大小写）
  const mimeTypeLower = selectedFile.value.type.toLowerCase();
  const isAllowedMimeType = allowedMimeTypes.some(type => 
    type.toLowerCase() === mimeTypeLower
  );
  
  // 检查文件扩展名（不区分大小写）
  const fileExtension = selectedFile.value.name.substring(selectedFile.value.name.lastIndexOf('.')).toLowerCase();
  const isAllowedExtension = allowedExtensions.includes(fileExtension);
  
  if (!isAllowedMimeType && !isAllowedExtension) {
    errors.video = '不支持的文件类型，请上传 MP4、AVI、MOV、WMV、FLV、WebM、MKV、3GP 或 ASF 格式的视频'
    return
  }

  errors.video = ''
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    selectedFile.value = file
    validateFile()
    
    // 如果没有输入名称，使用文件名作为默认名称
    if (!form.name) {
      form.name = file.name.replace(/\.[^/.]+$/, '') // 移除扩展名
    }
  }
}

const removeFile = () => {
  selectedFile.value = null
  errors.video = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleSubmit = async () => {
  validateName()
  validateTestDescription()
  validateFile()
  
  // 验证测试计划ID和用例ID
  if (!testPlanId.value || !testPlanId.value.trim()) {
    alert('缺少测试计划ID，请从测试计划页面进入')
    return
  }
  
  if (!testCaseId.value || !testCaseId.value.trim()) {
    alert('缺少测试用例ID，请从测试计划页面进入')
    return
  }
  
  if (!isFormValid.value) return

  try {
    console.log('提交视频上传，测试计划ID:', testPlanId.value, '用例ID:', testCaseId.value)
    
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('testDescription', form.testDescription)
    formData.append('testPlanId', testPlanId.value)
    formData.append('testCaseId', testCaseId.value)
    formData.append('video', selectedFile.value!)

    const newVideo = await videoStore.uploadVideo(formData)
    console.log('视频上传成功:', newVideo)
    
    // 上传成功，跳转到视频列表页
    router.push('/dashboard/video/list')
  } catch (error) {
    console.error('Upload video failed:', error)
    // 错误信息已经在 store 中处理
  }
}

const handleReset = () => {
  form.name = ''
  form.testDescription = ''
  selectedFile.value = null
  errors.name = ''
  errors.video = ''
  errors.testDescription = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script> 
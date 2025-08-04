<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新增视频</h1>
        <p class="mt-1 text-sm text-gray-500">上传视频文件，系统将自动解析视频信息</p>
      </div>
    </div>

    <!-- 上传表单 -->
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

        <!-- 测试说明 -->
        <div>
          <label for="testDescription" class="block text-sm font-medium text-gray-700 mb-2">
            测试说明
          </label>
          <textarea
            id="testDescription"
            v-model="form.testDescription"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="请描述视频测试的目的、重点关注的测试点、预期结果等..."
            :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': errors.testDescription }"
            @blur="validateTestDescription"
            @input="validateTestDescription"
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">
            详细描述测试目标，帮助AI更精准地识别视频中的问题和改进点
          </p>
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
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '@/stores/video'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'

const router = useRouter()
const videoStore = useVideoStore()

const form = reactive({
  name: '',
  testDescription: ''
})

const errors = reactive({
  name: '',
  video: '',
  testDescription: ''
})

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const isFormValid = computed(() => {
  return form.name && selectedFile.value && !errors.name && !errors.video && !errors.testDescription
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
  
  if (!isFormValid.value) return

  try {
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('testDescription', form.testDescription)
    formData.append('video', selectedFile.value!)

    const newVideo = await videoStore.uploadVideo(formData)
    
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
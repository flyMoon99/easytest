<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新增用例</h1>
        <p class="text-gray-600">创建一个新的用例任务</p>
      </div>
      <BaseButton 
        variant="outline"
        @click="router.push('/dashboard/test/records')"
      >
        查看用例记录
      </BaseButton>
    </div>

    <!-- 用例表单 -->
    <BaseCard title="用例信息">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <BaseInput
          v-model="form.title"
          label="用例标题"
          placeholder="请输入用例标题，例如：用户登录功能测试"
          required
          :error-message="errors.title"
          @blur="validateTitle"
        />

        <BaseInput
          v-model="form.entryUrl"
          type="url"
          label="用例入口URL"
          placeholder="请输入用例页面的URL，例如：https://example.com/login"
          required
          :error-message="errors.entryUrl"
          @blur="validateEntryUrl"
        />

        <!-- 用例等级选择 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            用例等级
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="form.level"
                value="高"
                class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
              />
              <span class="ml-2 text-sm text-gray-700">高</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="form.level"
                value="中"
                class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500"
              />
              <span class="ml-2 text-sm text-gray-700">中</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="form.level"
                value="低"
                class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
              />
              <span class="ml-2 text-sm text-gray-700">低</span>
            </label>
          </div>
          <p class="text-sm text-gray-500">
            选择用例的重要程度，默认为"中"
          </p>
        </div>

        <!-- 目录选择 -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            选择目录
            <span class="text-red-500 ml-1">*</span>
          </label>
          <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div v-if="!form.directoryId" class="text-center py-8">
              <p class="text-gray-500 mb-4">请选择一个目录来组织您的用例</p>
              <button
                type="button"
                @click="showDirectorySelector = true"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                选择目录
              </button>
            </div>
            <div v-else class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900">{{ selectedDirectoryName }}</span>
                <span class="text-xs text-gray-500">({{ selectedDirectoryPath }})</span>
              </div>
              <button
                type="button"
                @click="showDirectorySelector = true"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                更改
              </button>
            </div>
          </div>
          <p v-if="errors.directoryId" class="text-sm text-red-600">
            {{ errors.directoryId }}
          </p>
        </div>

        <!-- 目录选择器模态框 -->
        <BaseModal
          v-model="showDirectorySelector"
          title="选择目录"
          size="lg"
        >
          <div class="h-96">
            <DirectoryTree
              :readonly="true"
              @select="handleDirectorySelect"
            />
          </div>
          <template #footer>
            <div class="flex justify-end space-x-3">
              <BaseButton
                variant="outline"
                @click="showDirectorySelector = false"
              >
                关闭
              </BaseButton>
            </div>
          </template>
        </BaseModal>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            测试内容描述
            <span class="text-red-500 ml-1">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="6"
            class="input-base resize-none"
            placeholder="请用自然语言详细描述测试步骤和预期结果，例如：&#10;1. 访问登录页面&#10;2. 输入正确的用户名和密码&#10;3. 点击登录按钮&#10;4. 验证是否成功跳转到首页&#10;5. 检查用户信息是否正确显示"
            required
            @blur="validateDescription"
          ></textarea>
          <p v-if="errors.description" class="text-sm text-red-600">
            {{ errors.description }}
          </p>
          <p class="text-sm text-gray-500">
            请描述测试流程（至少5个字符）
          </p>
        </div>

        <!-- 上传截图（可选） -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">
            上传页面截图（可选）
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            @change="onFileChange"
            class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          <p class="text-xs text-gray-500">支持 PNG / JPG / JPEG / WEBP，最大 10MB。上传后将直接进入“已截图”状态，可立即进行AI解析。</p>
          <p v-if="fileError" class="text-sm text-red-600">{{ fileError }}</p>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <div class="flex justify-end space-x-4">
            <BaseButton
              type="button"
              variant="outline"
              @click="handleReset"
            >
              重置
            </BaseButton>
            <BaseButton
              type="submit"
              :loading="testStore.loading"
              :disabled="!isFormValid"
            >
              保存
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseCard>

    <!-- 使用说明 -->
    <BaseCard title="使用说明">
      <div class="prose max-w-none">
        <h4 class="text-base font-medium text-gray-900 mb-3">如何编写测试用例？</h4>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start space-x-2">
            <span class="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>明确测试目标：</strong>清楚说明要测试的功能或流程</span>
          </li>
          <li class="flex items-start space-x-2">
            <span class="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>详细步骤：</strong>按顺序列出每个操作步骤</span>
          </li>
          <li class="flex items-start space-x-2">
            <span class="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>预期结果：</strong>说明每步操作的预期结果</span>
          </li>
          <li class="flex items-start space-x-2">
            <span class="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>数据准备：</strong>如需特定数据，请在描述中说明</span>
          </li>
        </ul>
        
        <h4 class="text-base font-medium text-gray-900 mb-3 mt-6">示例</h4>
        <div class="bg-gray-50 p-4 rounded-lg text-sm">
          <p class="font-medium text-gray-900 mb-2">用例标题：电商网站商品搜索功能</p>
          <p class="text-gray-700">
            <strong>用例描述：</strong><br>
            1. 打开网站首页，验证搜索框是否存在<br>
            2. 在搜索框中输入"手机"关键词<br>
            3. 点击搜索按钮或按回车键<br>
            4. 验证搜索结果页面是否正常加载<br>
            5. 检查搜索结果中是否包含相关商品<br>
            6. 点击第一个商品进入详情页<br>
            7. 验证商品详情页面信息是否完整
          </p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTestStore } from '@/stores/test'
import { useDirectoryStore } from '@/stores/directory'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import DirectoryTree from '@/components/directory/DirectoryTree.vue'

const router = useRouter()
const testStore = useTestStore()
const directoryStore = useDirectoryStore()

const form = reactive({
  title: '',
  entryUrl: '',
  description: '',
  directoryId: '',
  level: '中' // 默认等级为中
})

const screenshotFile = ref<File | null>(null)
const fileError = ref('')
const showDirectorySelector = ref(false)
const tempSelectedDirectory = ref<{ id: string; name: string; path: string } | null>(null)

const errors = reactive({
  title: '',
  entryUrl: '',
  description: '',
  directoryId: '',
  level: ''
})

const isFormValid = computed(() => {
  return (
    form.title && 
    form.entryUrl && 
    form.description &&
    form.directoryId &&
    !errors.title && 
    !errors.entryUrl && 
    !errors.description &&
    !errors.directoryId &&
    !errors.level
  )
})

const validateTitle = () => {
  if (!form.title) {
    errors.title = '请输入用例标题'
  } else if (form.title.length < 5) {
    errors.title = '用例标题至少5个字符'
  } else if (form.title.length > 100) {
    errors.title = '用例标题不能超过100个字符'
  } else {
    errors.title = ''
  }
}

const validateEntryUrl = () => {
  if (!form.entryUrl) {
    errors.entryUrl = '请输入用例入口URL'
  } else if (!/^https?:\/\/.+/.test(form.entryUrl)) {
    errors.entryUrl = '请输入有效的URL地址'
  } else {
    errors.entryUrl = ''
  }
}

const validateDescription = () => {
  if (!form.description) {
    errors.description = '请输入用例内容描述'
  } else if (form.description.length < 5) {
    errors.description = '用例描述至少5个字符，请详细描述测试步骤'
  } else if (form.description.length > 2000) {
    errors.description = '用例描述不能超过2000个字符'
  } else {
    errors.description = ''
  }
}

const validateDirectory = () => {
  if (!form.directoryId) {
    errors.directoryId = '请选择一个目录'
  } else {
    errors.directoryId = ''
  }
}

const handleSubmit = async () => {
  validateTitle()
  validateEntryUrl()
  validateDescription()
  validateDirectory()
  
  if (!isFormValid.value) return

  try {
    const newTest = await testStore.createTest({
      title: form.title,
      entryUrl: form.entryUrl,
      description: form.description,
      directoryId: form.directoryId,
      level: form.level,
      screenshotFile: screenshotFile.value || undefined
    })
    
    // 创建成功，跳转到用例详情页
    router.push(`/dashboard/test/detail/${newTest.id}`)
  } catch (error) {
    console.error('Create test failed:', error)
    // 这里可以显示错误消息
  }
}

const handleReset = () => {
  form.title = ''
  form.entryUrl = ''
  form.description = ''
  form.directoryId = ''
  form.level = '中'
  screenshotFile.value = null
  fileError.value = ''
  errors.title = ''
  errors.entryUrl = ''
  errors.description = ''
  errors.directoryId = ''
  errors.level = ''
  tempSelectedDirectory.value = null
}

const onFileChange = (e: Event) => {
  fileError.value = ''
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) {
    screenshotFile.value = null
    return
  }
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowed.includes(file.type)) {
    fileError.value = '不支持的图片类型，请上传 PNG/JPG/JPEG/WEBP 格式'
    screenshotFile.value = null
    return
  }
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    fileError.value = '图片大小超过限制，最大支持 10MB'
    screenshotFile.value = null
    return
  }
  screenshotFile.value = file
}

// 目录选择相关方法
const handleDirectorySelect = (directory: any) => {
  // 立即选中目录，无需确认
  form.directoryId = directory.id
  tempSelectedDirectory.value = {
    id: directory.id,
    name: directory.name,
    path: directory.path
  }
  // 关闭弹窗
  showDirectorySelector.value = false
  // 清除错误
  errors.directoryId = ''
}

const confirmDirectorySelect = () => {
  if (tempSelectedDirectory.value) {
    form.directoryId = tempSelectedDirectory.value.id
    showDirectorySelector.value = false
    validateDirectory()
  }
}

// 计算属性
const selectedDirectoryName = computed(() => {
  if (!form.directoryId) return ''
  // 优先使用临时选中的目录信息
  if (tempSelectedDirectory.value && tempSelectedDirectory.value.id === form.directoryId) {
    return tempSelectedDirectory.value.name
  }
  // 从store中查找
  const directory = directoryStore.directories.find(d => d.id === form.directoryId)
  return directory?.name || ''
})

const selectedDirectoryPath = computed(() => {
  if (!form.directoryId) return ''
  // 优先使用临时选中的目录信息
  if (tempSelectedDirectory.value && tempSelectedDirectory.value.id === form.directoryId) {
    return tempSelectedDirectory.value.path
  }
  // 从store中查找
  const directory = directoryStore.directories.find(d => d.id === form.directoryId)
  return directory?.path || ''
})

// 生命周期
onMounted(async () => {
  // 加载目录树
  if (directoryStore.directories.length === 0) {
    await directoryStore.fetchDirectoryTree()
  }
})
</script> 
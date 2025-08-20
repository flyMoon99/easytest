<template>
  <Teleport to="body">
    <div
      v-if="directory"
      class="fixed inset-0 z-50"
      @click="$emit('close')"
    >
      <div
        class="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @click.stop
      >
        <!-- 创建子目录 -->
        <button
          @click="handleAction('create')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <PlusIcon class="h-4 w-4" />
          <span>创建子目录</span>
        </button>

        <!-- 编辑目录 -->
        <button
          @click="handleAction('edit')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <PencilIcon class="h-4 w-4" />
          <span>编辑目录</span>
        </button>

        <div class="border-t border-gray-100 my-1"></div>

        <!-- 归档/恢复 -->
        <button
          v-if="directory.status === 'active'"
          @click="handleAction('archive')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <ArchiveBoxIcon class="h-4 w-4" />
          <span>归档目录</span>
        </button>
        
        <button
          v-else-if="directory.status === 'archived'"
          @click="handleAction('restore')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <ArchiveBoxArrowDownIcon class="h-4 w-4" />
          <span>恢复目录</span>
        </button>

        <div class="border-t border-gray-100 my-1"></div>

        <!-- 删除目录 -->
        <button
          @click="handleAction('delete')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
        >
          <TrashIcon class="h-4 w-4" />
          <span>删除目录</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Directory, DirectoryAction } from '@/types/directory'
import {
  PlusIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ArchiveBoxArrowDownIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  directory: Directory
  position: { x: number; y: number }
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'action': [action: DirectoryAction]
}>()

// 方法
const handleAction = (action: DirectoryAction) => {
  emit('action', action)
}
</script>

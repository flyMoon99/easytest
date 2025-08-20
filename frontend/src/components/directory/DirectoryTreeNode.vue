<template>
  <div
    class="directory-tree-node"
    :class="{
      'selected': directory.selected,
      'dragging': isDragging,
      'drop-target': isDropTarget
    }"
  >
    <!-- 目录节点 -->
    <div
      class="directory-node"
      :style="{ paddingLeft: `${level * 20 + 8}px` }"
      draggable="true"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu.prevent="handleContextMenu"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @dragleave="handleDragLeave"
    >
      <!-- 展开/折叠图标 -->
      <button
        v-if="hasChildren"
        @click.stop="handleToggle"
        class="expand-button"
        :class="{ 'expanded': directory.expanded }"
      >
        <ChevronRightIcon class="h-4 w-4 transition-transform duration-200" />
      </button>
      <div v-else class="w-4"></div>

      <!-- 目录图标 -->
      <div class="directory-icon" :style="{ color: directory.color }">
        <component
          :is="getDirectoryIcon()"
          class="h-4 w-4"
        />
      </div>

      <!-- 目录名称 -->
      <span class="directory-name" :title="directory.description">
        {{ directory.name }}
      </span>

      <!-- 统计信息 -->
      <div v-if="showStatistics" class="directory-stats">
        <span class="text-xs text-gray-500">
          {{ directory.statistics.totalCases }}
        </span>
      </div>

      <!-- 状态标识 -->
      <div v-if="directory.status === 'archived'" class="status-badge archived">
        <ArchiveBoxIcon class="h-3 w-3" />
      </div>

      <!-- 操作按钮 -->
      <div class="directory-actions">
        <button
          @click.stop="handleCreateChild"
          class="action-button"
          title="创建子目录"
        >
          <PlusIcon class="h-3 w-3" />
        </button>
        <button
          @click.stop="handleEdit"
          class="action-button"
          title="编辑目录"
        >
          <PencilIcon class="h-3 w-3" />
        </button>
        <button
          @click.stop="handleDelete"
          class="action-button text-red-500 hover:text-red-700"
          title="删除目录"
        >
          <TrashIcon class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- 子目录 -->
    <div
      v-if="directory.expanded && hasChildren"
      class="children-container"
    >
      <DirectoryTreeNode
        v-for="child in directory.children"
        :key="child.id"
        :directory="child"
        :level="level + 1"
        :show-statistics="showStatistics"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @create-child="$emit('create-child', $event)"
        @move="$emit('move', $event.sourceDirectory, $event.targetParent)"
      />
    </div>

    <!-- 上下文菜单 -->
    <DirectoryContextMenu
      v-if="showContextMenu"
      :directory="directory"
      :position="contextMenuPosition"
      @close="handleCloseContextMenu"
      @action="handleContextAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DirectoryTreeNode, Directory, DirectoryAction } from '@/types/directory'
import { directoryUtils } from '@/services/directoryApi'
import DirectoryContextMenu from './DirectoryContextMenu.vue'
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  ArchiveBoxIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  directory: DirectoryTreeNode
  level: number
  showStatistics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showStatistics: true
})

// 调试输出
console.log(`DirectoryTreeNode - ${props.directory.name}:`, {
  level: props.level,
  directoryLevel: props.directory.level,
  paddingLeft: `${props.level * 20 + 8}px`
})

// Emits
const emit = defineEmits<{
  'select': [directory: DirectoryTreeNode]
  'toggle': [directory: DirectoryTreeNode]
  'edit': [directory: DirectoryTreeNode]
  'delete': [directory: DirectoryTreeNode]
  'create-child': [directory: DirectoryTreeNode]
  'move': [data: { sourceDirectory: DirectoryTreeNode; targetParent: Directory | null }]
}>()

// 响应式数据
const isDragging = ref(false)
const isDropTarget = ref(false)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

// 计算属性
const hasChildren = computed(() => {
  return props.directory.children && props.directory.children.length > 0
})

// 方法
const getDirectoryIcon = () => {
  const iconName = directoryUtils.getDirectoryIcon(props.directory, props.directory.expanded)
  
  switch (iconName) {
    case 'folder-open':
      return FolderOpenIcon
    case 'archive-box':
      return ArchiveBoxIcon
    default:
      return FolderIcon
  }
}

const handleClick = () => {
  emit('select', props.directory)
}

const handleDoubleClick = () => {
  if (hasChildren.value) {
    handleToggle()
  }
}

const handleToggle = () => {
  emit('toggle', props.directory)
}

const handleEdit = () => {
  emit('edit', props.directory)
}

const handleDelete = () => {
  emit('delete', props.directory)
}

const handleCreateChild = () => {
  emit('create-child', props.directory)
}

const handleContextMenu = (event: MouseEvent) => {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const handleCloseContextMenu = () => {
  showContextMenu.value = false
}

const handleContextAction = (action: DirectoryAction) => {
  showContextMenu.value = false
  
  switch (action) {
    case 'create':
      handleCreateChild()
      break
    case 'edit':
      handleEdit()
      break
    case 'delete':
      handleDelete()
      break
    // 其他操作...
  }
}

// 拖拽相关方法
const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return
  
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'directory',
    directory: props.directory
  }))
}

const handleDragEnd = () => {
  isDragging.value = false
}

const handleDragOver = (event: DragEvent) => {
  if (!event.dataTransfer) return
  
  const data = event.dataTransfer.getData('application/json')
  if (!data) return
  
  try {
    const dragData = JSON.parse(data)
    if (dragData.type === 'directory' && dragData.directory.id !== props.directory.id) {
      event.preventDefault()
      isDropTarget.value = true
    }
  } catch (error) {
    // 忽略解析错误
  }
}

const handleDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return
  
  isDropTarget.value = false
  
  const data = event.dataTransfer.getData('application/json')
  if (!data) return
  
  try {
    const dragData = JSON.parse(data)
    if (dragData.type === 'directory') {
      emit('move', {
        sourceDirectory: dragData.directory,
        targetParent: props.directory
      })
    }
  } catch (error) {
    console.error('处理拖拽数据失败:', error)
  }
}

const handleDragLeave = () => {
  isDropTarget.value = false
}
</script>

<style scoped>
.directory-tree-node {
  @apply select-none;
}

.directory-node {
  @apply flex items-center py-1 px-2 rounded-md cursor-pointer transition-colors duration-150;
  @apply hover:bg-gray-100;
}

.directory-node.selected {
  @apply bg-primary-100 text-primary-800;
}

.directory-node.dragging {
  @apply opacity-50;
}

.directory-node.drop-target {
  @apply bg-primary-200 ring-2 ring-primary-400;
}

.expand-button {
  @apply p-0.5 rounded hover:bg-gray-200 transition-colors;
}

.expand-button.expanded svg {
  @apply transform rotate-90;
}

.directory-icon {
  @apply flex-shrink-0 ml-1 mr-2;
}

.directory-name {
  @apply flex-1 truncate text-sm font-medium;
}

.directory-stats {
  @apply flex-shrink-0 ml-2;
}

.status-badge {
  @apply flex-shrink-0 ml-1 p-0.5 rounded;
}

.status-badge.archived {
  @apply bg-gray-200 text-gray-600;
}

.directory-actions {
  @apply flex-shrink-0 ml-2 flex items-center space-x-1 opacity-0 transition-opacity;
}

.directory-node:hover .directory-actions {
  @apply opacity-100;
}

.action-button {
  @apply p-1 rounded hover:bg-gray-200 transition-colors;
}

.children-container {
  @apply relative;
}

/* 连接线 */
.children-container::before {
  content: '';
  @apply absolute left-2 top-0 bottom-0 w-px bg-gray-200;
  margin-left: calc(var(--level, 0) * 20px + 8px);
}
</style>

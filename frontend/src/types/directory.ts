// 用例目录相关类型定义

/**
 * 目录状态枚举
 */
export type DirectoryStatus = 'active' | 'archived' | 'deleted'

/**
 * 目录统计信息
 */
export interface DirectoryStatistics {
  totalCases: number
  completedCases: number
  pendingCases: number
  failedCases: number
}

/**
 * 目录基础信息
 */
export interface DirectoryBase {
  name: string
  description?: string
  parentId?: string | null
  color?: string
  icon?: string
  sortOrder?: number
  status?: DirectoryStatus
}

/**
 * 完整的目录信息
 */
export interface Directory extends DirectoryBase {
  id: string
  memberId: string
  path: string
  level: number
  statistics: DirectoryStatistics
  createdAt: string
  updatedAt: string
  // 关联数据
  parent?: Directory | null
  children?: Directory[]
}

/**
 * 创建目录的表单数据
 */
export interface CreateDirectoryForm extends DirectoryBase {
  name: string // 必填
}

/**
 * 更新目录的表单数据
 */
export interface UpdateDirectoryForm extends Partial<DirectoryBase> {
  // 所有字段都是可选的
}

/**
 * 移动目录的数据
 */
export interface MoveDirectoryData {
  parentId: string | null
  sortOrder?: number
}

/**
 * 目录树节点（用于前端渲染）
 */
export interface DirectoryTreeNode extends Directory {
  expanded?: boolean // 是否展开
  selected?: boolean // 是否选中
  loading?: boolean // 是否加载中
  children: DirectoryTreeNode[]
}

/**
 * 批量排序数据
 */
export interface BatchSortItem {
  id: string
  sortOrder: number
}

/**
 * 目录统计详情
 */
export interface DirectoryStatisticsDetail {
  directory: DirectoryStatistics & {
    completionRate: number
  }
  children: DirectoryStatistics & {
    totalDirectories: number
  }
}

/**
 * API响应类型
 */
export interface DirectoryResponse {
  success: boolean
  message: string
  data: Directory
  timestamp: string
}

export interface DirectoryListResponse {
  success: boolean
  message: string
  data: {
    directories: Directory[]
    total: number
  }
  timestamp: string
}

export interface DirectoryStatisticsResponse {
  success: boolean
  message: string
  data: DirectoryStatisticsDetail
  timestamp: string
}

/**
 * 目录操作类型
 */
export type DirectoryAction = 
  | 'create'
  | 'edit'
  | 'delete'
  | 'move'
  | 'archive'
  | 'restore'

/**
 * 目录操作选项
 */
export interface DirectoryActionOptions {
  action: DirectoryAction
  directory: Directory
  targetParent?: Directory | null
}

/**
 * 目录搜索过滤选项
 */
export interface DirectoryFilterOptions {
  keyword?: string
  status?: DirectoryStatus[]
  parentId?: string | null
  includeArchived?: boolean
}

/**
 * 目录拖拽数据
 */
export interface DirectoryDragData {
  draggedDirectory: Directory
  targetDirectory?: Directory | null
  dropPosition: 'before' | 'after' | 'inside'
}

/**
 * 目录上下文菜单项
 */
export interface DirectoryContextMenuItem {
  id: string
  label: string
  icon: string
  action: DirectoryAction
  disabled?: boolean
  separator?: boolean
}

/**
 * 目录表单验证规则
 */
export interface DirectoryFormRules {
  name: Array<{
    required?: boolean
    message: string
    min?: number
    max?: number
    trigger?: string
  }>
  description?: Array<{
    max?: number
    message: string
    trigger?: string
  }>
}

/**
 * 目录操作权限
 */
export interface DirectoryPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canMove: boolean
  canArchive: boolean
}

/**
 * 目录Pinia Store状态
 */
export interface DirectoryState {
  // 目录数据
  directories: Directory[]
  directoryTree: DirectoryTreeNode[]
  currentDirectory: Directory | null
  
  // UI状态
  loading: boolean
  treeLoading: boolean
  selectedDirectoryId: string | null
  expandedDirectoryIds: Set<string>
  
  // 搜索和过滤
  searchKeyword: string
  filterOptions: DirectoryFilterOptions
  
  // 操作状态
  dragging: boolean
  editing: boolean
  creating: boolean
}

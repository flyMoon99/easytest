import api from './api'
import type {
  Directory,
  DirectoryResponse,
  DirectoryListResponse,
  DirectoryStatisticsResponse,
  CreateDirectoryForm,
  UpdateDirectoryForm,
  MoveDirectoryData,
  BatchSortItem,
  DirectoryFilterOptions
} from '@/types/directory'

/**
 * 目录管理API服务
 */
export const directoryAPI = {
  /**
   * 获取目录树结构
   * @param options 过滤选项
   */
  getDirectoryTree: (options: DirectoryFilterOptions = {}): Promise<DirectoryListResponse> => {
    const params = new URLSearchParams()
    
    if (options.includeArchived !== undefined) {
      params.append('includeArchived', options.includeArchived.toString())
    }
    
    const url = `/test-directories${params.toString() ? `?${params.toString()}` : ''}`
    return api.get(url)
  },

  /**
   * 获取目录详情
   * @param id 目录ID
   */
  getDirectoryDetail: (id: string): Promise<DirectoryResponse> => 
    api.get(`/test-directories/${id}`),

  /**
   * 创建新目录
   * @param data 目录数据
   */
  createDirectory: (data: CreateDirectoryForm): Promise<DirectoryResponse> => 
    api.post('/test-directories', data),

  /**
   * 更新目录信息
   * @param id 目录ID
   * @param data 更新数据
   */
  updateDirectory: (id: string, data: UpdateDirectoryForm): Promise<DirectoryResponse> => 
    api.put(`/test-directories/${id}`, data),

  /**
   * 删除目录
   * @param id 目录ID
   * @param force 是否强制删除（包括子目录）
   */
  deleteDirectory: (id: string, force = false): Promise<{ success: boolean; message: string; data: { id: string } }> => {
    const url = `/test-directories/${id}${force ? '?force=true' : ''}`
    return api.delete(url)
  },

  /**
   * 移动目录
   * @param id 目录ID
   * @param data 移动数据
   */
  moveDirectory: (id: string, data: MoveDirectoryData): Promise<DirectoryResponse> => 
    api.post(`/test-directories/${id}/move`, data),

  /**
   * 获取目录统计信息
   * @param id 目录ID
   */
  getDirectoryStatistics: (id: string): Promise<DirectoryStatisticsResponse> => 
    api.get(`/test-directories/${id}/statistics`),

  /**
   * 批量更新目录排序
   * @param sortData 排序数据
   */
  batchUpdateSort: (sortData: BatchSortItem[]): Promise<{ success: boolean; message: string; data: { updated: number } }> => 
    api.put('/test-directories/batch/sort', { directories: sortData }),

  /**
   * 归档目录
   * @param id 目录ID
   */
  archiveDirectory: (id: string): Promise<DirectoryResponse> => 
    api.put(`/test-directories/${id}`, { status: 'archived' }),

  /**
   * 恢复归档目录
   * @param id 目录ID
   */
  restoreDirectory: (id: string): Promise<DirectoryResponse> => 
    api.put(`/test-directories/${id}`, { status: 'active' }),

  /**
   * 搜索目录
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  searchDirectories: async (keyword: string, options: DirectoryFilterOptions = {}): Promise<Directory[]> => {
    const response = await directoryAPI.getDirectoryTree({
      ...options,
      keyword
    })
    
    // 在客户端进行搜索过滤（因为后端返回的是树结构）
    const filterDirectories = (directories: Directory[]): Directory[] => {
      const filtered: Directory[] = []
      
      directories.forEach(dir => {
        const matchesKeyword = keyword 
          ? dir.name.toLowerCase().includes(keyword.toLowerCase()) ||
            dir.description?.toLowerCase().includes(keyword.toLowerCase())
          : true
          
        const matchesStatus = options.status 
          ? options.status.includes(dir.status || 'active')
          : true
          
        if (matchesKeyword && matchesStatus) {
          const filteredDir = { ...dir }
          if (dir.children) {
            filteredDir.children = filterDirectories(dir.children)
          }
          filtered.push(filteredDir)
        } else if (dir.children) {
          // 即使当前目录不匹配，也要检查子目录
          const filteredChildren = filterDirectories(dir.children)
          if (filteredChildren.length > 0) {
            filtered.push({
              ...dir,
              children: filteredChildren
            })
          }
        }
      })
      
      return filtered
    }
    
    return filterDirectories(response.data.directories)
  },

  /**
   * 检查目录名称是否重复
   * @param name 目录名称
   * @param parentId 父目录ID
   * @param excludeId 排除的目录ID（用于编辑时）
   */
  checkNameDuplicate: async (
    name: string, 
    parentId: string | null = null, 
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const response = await directoryAPI.getDirectoryTree()
      
      const checkDuplicateInLevel = (directories: Directory[], targetParentId: string | null): boolean => {
        return directories.some(dir => {
          if (dir.parentId === targetParentId && 
              dir.name === name && 
              dir.id !== excludeId) {
            return true
          }
          if (dir.children) {
            return checkDuplicateInLevel(dir.children, targetParentId)
          }
          return false
        })
      }
      
      return checkDuplicateInLevel(response.data.directories, parentId)
    } catch (error) {
      console.error('检查目录名称重复失败:', error)
      return false
    }
  },

  /**
   * 获取目录路径
   * @param id 目录ID
   */
  getDirectoryPath: async (id: string): Promise<string[]> => {
    try {
      const response = await directoryAPI.getDirectoryDetail(id)
      const directory = response.data
      
      const pathSegments: string[] = []
      let current: Directory | null = directory
      
      while (current) {
        pathSegments.unshift(current.name)
        current = current.parent || null
      }
      
      return pathSegments
    } catch (error) {
      console.error('获取目录路径失败:', error)
      return []
    }
  },

  /**
   * 获取目录的所有父级目录
   * @param id 目录ID
   */
  getDirectoryAncestors: async (id: string): Promise<Directory[]> => {
    try {
      const response = await directoryAPI.getDirectoryDetail(id)
      const directory = response.data
      
      const ancestors: Directory[] = []
      let current: Directory | null = directory.parent || null
      
      while (current) {
        ancestors.unshift(current)
        current = current.parent || null
      }
      
      return ancestors
    } catch (error) {
      console.error('获取父级目录失败:', error)
      return []
    }
  },

  /**
   * 检查目录是否可以移动到目标位置
   * @param sourceId 源目录ID
   * @param targetParentId 目标父目录ID
   */
  canMoveDirectory: async (sourceId: string, targetParentId: string | null): Promise<boolean> => {
    try {
      // 不能移动到自身
      if (sourceId === targetParentId) {
        return false
      }
      
      // 如果目标是null（根目录），则可以移动
      if (targetParentId === null) {
        return true
      }
      
      // 检查是否会形成循环引用
      const targetAncestors = await directoryAPI.getDirectoryAncestors(targetParentId)
      return !targetAncestors.some(ancestor => ancestor.id === sourceId)
    } catch (error) {
      console.error('检查目录移动权限失败:', error)
      return false
    }
  }
}

/**
 * 目录工具函数
 */
export const directoryUtils = {
  /**
   * 将平铺的目录数组转换为树形结构
   * @param directories 目录数组
   */
  buildDirectoryTree: (directories: Directory[]): Directory[] => {
    const directoryMap = new Map<string, Directory & { children: Directory[] }>()
    const rootDirectories: Directory[] = []
    
    // 创建目录映射
    directories.forEach(dir => {
      directoryMap.set(dir.id, { ...dir, children: [] })
    })
    
    // 构建树形结构
    directories.forEach(dir => {
      const dirWithChildren = directoryMap.get(dir.id)!
      
      if (dir.parentId && directoryMap.has(dir.parentId)) {
        const parent = directoryMap.get(dir.parentId)!
        parent.children.push(dirWithChildren)
      } else {
        rootDirectories.push(dirWithChildren)
      }
    })
    
    // 排序
    const sortDirectories = (dirs: Directory[]): Directory[] => {
      return dirs
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name))
        .map(dir => ({
          ...dir,
          children: dir.children ? sortDirectories(dir.children) : []
        }))
    }
    
    return sortDirectories(rootDirectories)
  },

  /**
   * 展开目录树到指定目录
   * @param tree 目录树
   * @param targetId 目标目录ID
   * @param expandedIds 当前展开的目录ID集合
   */
  expandToDirectory: (
    tree: Directory[], 
    targetId: string, 
    expandedIds: Set<string>
  ): Set<string> => {
    const newExpandedIds = new Set(expandedIds)
    
    const findAndExpand = (directories: Directory[], path: string[] = []): boolean => {
      for (const dir of directories) {
        const currentPath = [...path, dir.id]
        
        if (dir.id === targetId) {
          // 找到目标目录，展开路径上的所有父目录
          path.forEach(id => newExpandedIds.add(id))
          return true
        }
        
        if (dir.children && findAndExpand(dir.children, currentPath)) {
          newExpandedIds.add(dir.id)
          return true
        }
      }
      return false
    }
    
    findAndExpand(tree)
    return newExpandedIds
  },

  /**
   * 获取目录的显示图标
   * @param directory 目录信息
   * @param expanded 是否展开
   */
  getDirectoryIcon: (directory: Directory, expanded = false): string => {
    if (directory.icon && directory.icon !== 'folder') {
      return directory.icon
    }
    
    // 根据状态和展开状态返回默认图标
    if (directory.status === 'archived') {
      return 'archive-box'
    }
    
    return expanded ? 'folder-open' : 'folder'
  },

  /**
   * 格式化目录路径
   * @param directory 目录信息
   * @param separator 分隔符
   */
  formatDirectoryPath: (directory: Directory, separator = ' / '): string => {
    const pathSegments = directory.path.split('/')
    return pathSegments.join(separator)
  },

  /**
   * 计算目录完成率
   * @param statistics 统计信息
   */
  calculateCompletionRate: (statistics: { totalCases: number; completedCases: number }): number => {
    if (statistics.totalCases === 0) return 0
    return Math.round((statistics.completedCases / statistics.totalCases) * 100)
  }
}

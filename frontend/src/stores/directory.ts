import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Directory,
  DirectoryTreeNode,
  DirectoryState,
  CreateDirectoryForm,
  UpdateDirectoryForm,
  MoveDirectoryData,
  BatchSortItem,
  DirectoryFilterOptions,
  DirectoryStatisticsDetail
} from '@/types/directory'
import { directoryAPI, directoryUtils } from '@/services/directoryApi'

export const useDirectoryStore = defineStore('directory', () => {
  // ===== 状态 =====
  const directories = ref<Directory[]>([])
  const currentDirectory = ref<Directory | null>(null)
  
  // UI状态
  const loading = ref(false)
  const treeLoading = ref(false)
  const selectedDirectoryId = ref<string | null>(null)
  const expandedDirectoryIds = ref<Set<string>>(new Set())
  
  // 搜索和过滤
  const searchKeyword = ref('')
  const filterOptions = ref<DirectoryFilterOptions>({
    includeArchived: false
  })
  
  // 操作状态
  const dragging = ref(false)
  const editing = ref(false)
  const creating = ref(false)

  // ===== 计算属性 =====
  
  /**
   * 目录树结构
   */
  const directoryTree = computed((): DirectoryTreeNode[] => {
    // 直接使用后端返回的树形结构，不需要重新构建
    // const tree = directoryUtils.buildDirectoryTree(directories.value) // 删除这行
    
    // 转换为TreeNode格式
    const convertToTreeNode = (dirs: Directory[]): DirectoryTreeNode[] => {
      return dirs.map(dir => ({
        ...dir,
        expanded: expandedDirectoryIds.value.has(dir.id),
        selected: selectedDirectoryId.value === dir.id,
        loading: false,
        children: dir.children ? convertToTreeNode(dir.children) : []
      }))
    }
    
    // 直接使用 directories.value，因为后端已经返回了树形结构
    return convertToTreeNode(directories.value)
  })

  /**
   * 过滤后的目录树
   */
  const filteredDirectoryTree = computed((): DirectoryTreeNode[] => {
    if (!searchKeyword.value) {
      return directoryTree.value
    }
    
    const filterTree = (nodes: DirectoryTreeNode[]): DirectoryTreeNode[] => {
      return nodes.reduce((filtered: DirectoryTreeNode[], node) => {
        const matchesKeyword = node.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                               node.description?.toLowerCase().includes(searchKeyword.value.toLowerCase())
        
        const filteredChildren = node.children ? filterTree(node.children) : []
        
        if (matchesKeyword || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren,
            expanded: filteredChildren.length > 0 ? true : node.expanded
          })
        }
        
        return filtered
      }, [])
    }
    
    return filterTree(directoryTree.value)
  })

  /**
   * 根目录列表
   */
  const rootDirectories = computed((): Directory[] => {
    return directories.value.filter(dir => !dir.parentId)
  })

  /**
   * 选中的目录
   */
  const selectedDirectory = computed((): Directory | null => {
    if (!selectedDirectoryId.value) return null
    return directories.value.find(dir => dir.id === selectedDirectoryId.value) || null
  })

  /**
   * 目录映射表（便于快速查找）
   */
  const directoryMap = computed((): Map<string, Directory> => {
    const map = new Map<string, Directory>()
    directories.value.forEach(dir => {
      map.set(dir.id, dir)
    })
    return map
  })

  // ===== 操作方法 =====

  /**
   * 获取目录树
   */
  const fetchDirectoryTree = async (options: DirectoryFilterOptions = {}) => {
    treeLoading.value = true
    try {
      const response = await directoryAPI.getDirectoryTree({
        ...filterOptions.value,
        ...options
      })
      directories.value = response.data.directories
    } catch (error) {
      console.error('获取目录树失败:', error)
      throw error
    } finally {
      treeLoading.value = false
    }
  }

  /**
   * 获取目录详情
   */
  const fetchDirectoryDetail = async (id: string) => {
    loading.value = true
    try {
      const response = await directoryAPI.getDirectoryDetail(id)
      currentDirectory.value = response.data
      
      // 更新本地目录列表中的数据
      const index = directories.value.findIndex(dir => dir.id === id)
      if (index !== -1) {
        directories.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('获取目录详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建目录
   */
  const createDirectory = async (data: CreateDirectoryForm) => {
    creating.value = true
    try {
      const response = await directoryAPI.createDirectory(data)
      const newDirectory = response.data
      
      // 重新获取完整的目录树以确保层级关系正确
      await fetchDirectoryTree()
      
      // 如果有父目录，展开父目录
      if (newDirectory.parentId) {
        expandedDirectoryIds.value.add(newDirectory.parentId)
      }
      
      // 选中新创建的目录
      selectedDirectoryId.value = newDirectory.id
      
      return newDirectory
    } catch (error) {
      console.error('创建目录失败:', error)
      throw error
    } finally {
      creating.value = false
    }
  }

  /**
   * 更新目录
   */
  const updateDirectory = async (id: string, data: UpdateDirectoryForm) => {
    editing.value = true
    try {
      const response = await directoryAPI.updateDirectory(id, data)
      const updatedDirectory = response.data
      
      // 更新本地目录列表
      const index = directories.value.findIndex(dir => dir.id === id)
      if (index !== -1) {
        directories.value[index] = updatedDirectory
      }
      
      // 更新当前目录
      if (currentDirectory.value?.id === id) {
        currentDirectory.value = updatedDirectory
      }
      
      return updatedDirectory
    } catch (error) {
      console.error('更新目录失败:', error)
      throw error
    } finally {
      editing.value = false
    }
  }

  /**
   * 删除目录
   */
  const deleteDirectory = async (id: string, force = false) => {
    loading.value = true
    try {
      await directoryAPI.deleteDirectory(id, force)
      
      // 从本地目录列表中移除
      directories.value = directories.value.filter(dir => dir.id !== id)
      
      // 如果删除的是当前选中的目录，清除选中状态
      if (selectedDirectoryId.value === id) {
        selectedDirectoryId.value = null
        currentDirectory.value = null
      }
      
      // 如果删除的是当前目录，清除当前目录
      if (currentDirectory.value?.id === id) {
        currentDirectory.value = null
      }
    } catch (error) {
      console.error('删除目录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 移动目录
   */
  const moveDirectory = async (id: string, data: MoveDirectoryData) => {
    loading.value = true
    try {
      const response = await directoryAPI.moveDirectory(id, data)
      const movedDirectory = response.data
      
      // 更新本地目录列表
      const index = directories.value.findIndex(dir => dir.id === id)
      if (index !== -1) {
        directories.value[index] = movedDirectory
      }
      
      // 展开新的父目录
      if (data.parentId) {
        expandedDirectoryIds.value.add(data.parentId)
      }
      
      return movedDirectory
    } catch (error) {
      console.error('移动目录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量更新排序
   */
  const batchUpdateSort = async (sortData: BatchSortItem[]) => {
    loading.value = true
    try {
      await directoryAPI.batchUpdateSort(sortData)
      
      // 更新本地排序
      sortData.forEach(({ id, sortOrder }) => {
        const directory = directories.value.find(dir => dir.id === id)
        if (directory) {
          directory.sortOrder = sortOrder
        }
      })
    } catch (error) {
      console.error('批量更新排序失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取目录统计信息
   */
  const fetchDirectoryStatistics = async (id: string): Promise<DirectoryStatisticsDetail> => {
    try {
      const response = await directoryAPI.getDirectoryStatistics(id)
      
      // 更新本地目录的统计信息
      const directory = directories.value.find(dir => dir.id === id)
      if (directory) {
        directory.statistics = response.data.directory
      }
      
      return response.data
    } catch (error) {
      console.error('获取目录统计信息失败:', error)
      throw error
    }
  }

  /**
   * 搜索目录
   */
  const searchDirectories = async (keyword: string) => {
    searchKeyword.value = keyword
    if (!keyword) return
    
    try {
      const results = await directoryAPI.searchDirectories(keyword, filterOptions.value)
      
      // 自动展开搜索结果的父目录
      results.forEach(dir => {
        if (dir.parentId) {
          expandedDirectoryIds.value.add(dir.parentId)
        }
      })
    } catch (error) {
      console.error('搜索目录失败:', error)
      throw error
    }
  }

  /**
   * 清除搜索
   */
  const clearSearch = () => {
    searchKeyword.value = ''
  }

  /**
   * 选中目录
   */
  const selectDirectory = (id: string | null) => {
    selectedDirectoryId.value = id
    if (id) {
      // 展开到选中的目录
      expandedDirectoryIds.value = directoryUtils.expandToDirectory(
        directoryTree.value,
        id,
        expandedDirectoryIds.value
      )
    }
  }

  /**
   * 切换目录展开状态
   */
  const toggleDirectoryExpanded = (id: string) => {
    if (expandedDirectoryIds.value.has(id)) {
      expandedDirectoryIds.value.delete(id)
    } else {
      expandedDirectoryIds.value.add(id)
    }
  }

  /**
   * 展开所有目录
   */
  const expandAllDirectories = () => {
    const allIds = new Set<string>()
    
    const collectIds = (dirs: Directory[]) => {
      dirs.forEach(dir => {
        allIds.add(dir.id)
        if (dir.children) {
          collectIds(dir.children)
        }
      })
    }
    
    collectIds(directories.value)
    expandedDirectoryIds.value = allIds
  }

  /**
   * 折叠所有目录
   */
  const collapseAllDirectories = () => {
    expandedDirectoryIds.value.clear()
  }

  /**
   * 设置过滤选项
   */
  const setFilterOptions = (options: Partial<DirectoryFilterOptions>) => {
    filterOptions.value = { ...filterOptions.value, ...options }
  }

  /**
   * 开始拖拽
   */
  const startDragging = () => {
    dragging.value = true
  }

  /**
   * 结束拖拽
   */
  const endDragging = () => {
    dragging.value = false
  }

  /**
   * 重置状态
   */
  const resetState = () => {
    directories.value = []
    currentDirectory.value = null
    selectedDirectoryId.value = null
    expandedDirectoryIds.value.clear()
    searchKeyword.value = ''
    filterOptions.value = { includeArchived: false }
    loading.value = false
    treeLoading.value = false
    dragging.value = false
    editing.value = false
    creating.value = false
  }

  /**
   * 获取目录的子目录
   */
  const getChildDirectories = (parentId: string | null): Directory[] => {
    return directories.value.filter(dir => dir.parentId === parentId)
  }

  /**
   * 获取目录的父目录链
   */
  const getDirectoryBreadcrumb = (id: string): Directory[] => {
    const breadcrumb: Directory[] = []
    let current = directoryMap.value.get(id)
    
    while (current) {
      breadcrumb.unshift(current)
      current = current.parentId ? directoryMap.value.get(current.parentId) : undefined
    }
    
    return breadcrumb
  }

  /**
   * 检查目录是否可以移动到目标位置
   */
  const canMoveToTarget = async (sourceId: string, targetParentId: string | null): Promise<boolean> => {
    return await directoryAPI.canMoveDirectory(sourceId, targetParentId)
  }

  return {
    // 状态
    directories,
    currentDirectory,
    loading,
    treeLoading,
    selectedDirectoryId,
    expandedDirectoryIds,
    searchKeyword,
    filterOptions,
    dragging,
    editing,
    creating,
    
    // 计算属性
    directoryTree,
    filteredDirectoryTree,
    rootDirectories,
    selectedDirectory,
    directoryMap,
    
    // 方法
    fetchDirectoryTree,
    fetchDirectoryDetail,
    createDirectory,
    updateDirectory,
    deleteDirectory,
    moveDirectory,
    batchUpdateSort,
    fetchDirectoryStatistics,
    searchDirectories,
    clearSearch,
    selectDirectory,
    toggleDirectoryExpanded,
    expandAllDirectories,
    collapseAllDirectories,
    setFilterOptions,
    startDragging,
    endDragging,
    resetState,
    getChildDirectories,
    getDirectoryBreadcrumb,
    canMoveToTarget
  }
})

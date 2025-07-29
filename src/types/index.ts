export * from './auth'
export * from './test'
export * from './api'

// 通用类型定义
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface MenuItem {
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
}

export interface BreadcrumbItem {
  name: string
  path?: string
}

export type Theme = 'light' | 'dark'
export type Language = 'zh-CN' | 'en-US' 
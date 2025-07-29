// 用户信息接口
export interface User {
  _id: string
  email: string
  phone: string
  memberId: string
  nickname: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  statusText?: string
  registerDays?: number
  lastLoginAt?: string
  createdAt: string
  updatedAt?: string
}

// 登录表单接口
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

// 注册表单接口
export interface RegisterForm {
  email: string
  phone: string
  password: string
  confirmPassword: string
  nickname?: string
}

// 认证响应接口
export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    token: string
  }
  timestamp: string
}

// 认证状态接口
export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
} 
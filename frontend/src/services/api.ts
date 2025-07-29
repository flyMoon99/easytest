import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { LoginForm, RegisterForm, AuthResponse } from '@/types/auth'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和令牌过期
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (userData: RegisterForm): Promise<AuthResponse> => 
    api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials: LoginForm): Promise<AuthResponse> => 
    api.post('/auth/login', credentials),
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<AuthResponse> => 
    api.get('/auth/me'),
  
  // 用户登出
  logout: (): Promise<AuthResponse> => 
    api.post('/auth/logout'),
  
  // 刷新令牌
  refreshToken: (): Promise<AuthResponse> => 
    api.post('/auth/refresh'),
  
  // 获取登录历史
  getLoginHistory: (params = {}): Promise<AuthResponse> => 
    api.get('/auth/login-history', { params })
}

// 健康检查API
export const healthAPI = {
  check: (): Promise<AuthResponse> => api.get('/health')
}

// 通用API
export const commonAPI = {
  getInfo: (): Promise<AuthResponse> => api.get('/')
}

export default api 
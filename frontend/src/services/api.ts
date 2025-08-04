import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { LoginForm, RegisterForm, AuthResponse } from '@/types/auth'
import type { TestRecord, TestForm } from '@/types/test'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 120000, // 增加到120秒，适应AI分析的时间需求
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
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 尝试刷新令牌
        const refreshResponse = await api.post('/auth/refresh')
        const newToken = refreshResponse.data.token
        
        // 更新存储的令牌
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage
        storage.setItem('token', newToken)
        
        // 重新发送原始请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // 刷新失败，清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
      }
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

// 测试用例相关API
export const testCaseAPI = {
  // 创建测试用例
  create: (testData: TestForm): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.post('/testcases', testData),
  
  // 获取测试用例列表
  getList: (params = {}): Promise<{ 
    success: boolean; 
    data: { 
      testCases: TestRecord[]; 
      pagination: any; 
      statistics: any 
    }; 
    message: string 
  }> => 
    api.get('/testcases', { params }),
  
  // 获取测试用例详情
  getDetail: (id: string): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.get(`/testcases/${id}`),
  
  // 更新测试用例
  update: (id: string, testData: Partial<TestForm>): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.put(`/testcases/${id}`, testData),
  
  // 删除测试用例
  delete: (id: string): Promise<{ success: boolean; message: string }> => 
    api.delete(`/testcases/${id}`),
  
  // 更新测试用例状态
  updateStatus: (id: string, statusData: any): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.patch(`/testcases/${id}/status`, statusData),
  
  // 获取统计信息
  getStatistics: (): Promise<{ success: boolean; data: any; message: string }> => 
    api.get('/testcases/statistics'),
  
  // 执行测试
  execute: (id: string): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.post(`/testcases/${id}/execute`),
  
  // AI分析
  analyze: (id: string, options: { aiModel: string; testType: string }): Promise<{ success: boolean; data: TestRecord; message: string }> => 
    api.post(`/testcases/${id}/analyze`, options)
}

// 通用API
export const commonAPI = {
  getInfo: (): Promise<AuthResponse> => api.get('/')
}

export default api
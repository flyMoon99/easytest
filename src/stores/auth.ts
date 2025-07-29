import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm, RegisterForm } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化 - 从本地存储恢复状态
  const initAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user data:', error)
        clearAuth()
      }
    }
  }

  // 登录
  const login = async (credentials: LoginForm) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 添加内置模拟账户验证
      if (credentials.email !== 'test@example.com' || credentials.password !== 'password123') {
        throw new Error('用户名或密码不正确')
      }

      // 模拟用户数据
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        emailAbbr: credentials.email.substring(0, 2).toUpperCase(),
        createdAt: new Date().toISOString()
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      // 保存到状态
      user.value = mockUser
      token.value = mockToken
      
      // 持久化
      if (credentials.remember) {
        localStorage.setItem('auth_token', mockToken)
        localStorage.setItem('auth_user', JSON.stringify(mockUser))
      } else {
        sessionStorage.setItem('auth_token', mockToken)
        sessionStorage.setItem('auth_user', JSON.stringify(mockUser))
      }
      
      return { success: true, user: mockUser, token: mockToken }
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData: RegisterForm) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟用户数据
      const mockUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        emailAbbr: userData.email.substring(0, 2).toUpperCase(),
        createdAt: new Date().toISOString()
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      // 保存到状态
      user.value = mockUser
      token.value = mockToken
      
      // 持久化
      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      
      return { success: true, user: mockUser, token: mockToken }
    } catch (error) {
      console.error('Registration failed:', error)
      throw new Error('注册失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    clearAuth()
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (!token.value) return false
    
    try {
      // 这里应该调用API验证token
      // 模拟验证过程
      await new Promise(resolve => setTimeout(resolve, 500))
      return isAuthenticated.value
    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuth()
      return false
    }
  }

  // 初始化
  initAuth()

  return {
    // 状态
    user,
    token,
    loading,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    login,
    register,
    logout,
    checkAuth,
    clearAuth
  }
}) 
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api'
import type { User, LoginForm, RegisterForm, AuthResponse } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const userInitials = computed(() => {
    if (!user.value?.nickname) return 'U'
    return user.value.nickname.slice(0, 2).toUpperCase()
  })

  // 从本地存储初始化状态
  const initializeAuth = () => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Failed to parse saved auth data:', e)
        clearAuth()
      }
    }
  }

  // 保存认证信息到本地存储
  const saveAuth = (userData: User, authToken: string, rememberMe = false) => {
    user.value = userData
    token.value = authToken
    
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('token', authToken)
    storage.setItem('user', JSON.stringify(userData))
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    error.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  // 用户注册
  const register = async (formData: RegisterForm, rememberMe = false) => {
    loading.value = true
    error.value = null
    
    try {
      const response: AuthResponse = await authAPI.register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        nickname: formData.nickname
      })

      if (response.success && response.data) {
        saveAuth(response.data.user, response.data.token, rememberMe)
        return { success: true, message: response.message }
      } else {
        error.value = response.message || '注册失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      error.value = err.message || '注册失败，请稍后重试'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // 用户登录
  const login = async (formData: LoginForm, rememberMe = false) => {
    loading.value = true
    error.value = null
    
    try {
      const response: AuthResponse = await authAPI.login({
        email: formData.email,
        password: formData.password
      })

      if (response.success && response.data) {
        saveAuth(response.data.user, response.data.token, rememberMe)
        return { success: true, message: response.message }
      } else {
        error.value = response.message || '登录失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      error.value = err.message || '登录失败，请检查邮箱和密码'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // 用户登出
  const logout = async () => {
    loading.value = true
    error.value = null
    
    try {
      if (token.value) {
        await authAPI.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuth()
      loading.value = false
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (!token.value) return false
    
    loading.value = true
    error.value = null
    
    try {
      const response = await authAPI.getCurrentUser()
      
      if (response.success && response.data) {
        user.value = response.data
        // 更新本地存储的用户信息
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify(response.data))
        return true
      } else {
        error.value = response.message || '获取用户信息失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败'
      return false
    } finally {
      loading.value = false
    }
  }

  // 刷新令牌
  const refreshToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await authAPI.refreshToken()
      
      if (response.success && response.data?.token) {
        token.value = response.data.token
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage
        storage.setItem('token', response.data.token)
        return true
      }
      return false
    } catch (err) {
      console.error('Token refresh failed:', err)
      return false
    }
  }

  // 获取登录历史
  const getLoginHistory = async (params = {}) => {
    if (!token.value) return null
    
    try {
      const response = await authAPI.getLoginHistory(params)
      return response.success ? response.data : null
    } catch (err) {
      console.error('Failed to get login history:', err)
      return null
    }
  }

  // 初始化认证状态
  initializeAuth()

  return {
    // 状态
    user,
    token,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    userInitials,
    
    // 方法
    register,
    login,
    logout,
    fetchCurrentUser,
    refreshToken,
    getLoginHistory,
    clearAuth,
    initializeAuth
  }
}) 
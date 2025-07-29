import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { title: '易测平台 - 智能化测试解决方案' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '用户登录 - 易测平台', guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { title: '用户注册 - 易测平台', guest: true }
    },
    {
      path: '/dashboard',
      component: () => import('@/components/layout/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/Dashboard.vue'),
          meta: { title: '仪表板 - 易测平台' }
        },
        {
          path: 'test/new',
          name: 'test-new',
          component: () => import('@/views/dashboard/TestNew.vue'),
          meta: { title: '新增测试 - 易测平台' }
        },
        {
          path: 'test/records',
          name: 'test-records',
          component: () => import('@/views/dashboard/TestRecords.vue'),
          meta: { title: '测试记录 - 易测平台' }
        },
        {
          path: 'test/detail/:id',
          name: 'test-detail',
          component: () => import('@/views/dashboard/TestDetail.vue'),
          meta: { title: '测试详情 - 易测平台' },
          props: true
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面未找到 - 易测平台' }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  
  // 检查是否需要认证
  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // 已登录用户访问登录/注册页面时重定向到仪表板
  if (to.meta?.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router 
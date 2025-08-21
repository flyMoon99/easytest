// 全局配置文件
export const config = {
  // API配置
  api: {
    // 从环境变量获取API基础URL，如果没有则使用默认值
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:10061',
    // API路径前缀
    apiPrefix: '/api',
    // 完整的API URL
    get apiURL() {
      return `${this.baseURL}${this.apiPrefix}`
    },
    // 超时时间（毫秒）
    timeout: 120000
  },
  
  // 视频服务配置
  video: {
    // 视频文件访问URL
    get baseURL() {
      return config.api.baseURL
    },
    // 视频文件路径
    get videoPath() {
      return `${this.baseURL}/videos`
    }
  },
  
  // 静态资源配置
  static: {
    // 截图文件访问URL
    get screenshotPath() {
      return `${config.api.baseURL}/screenshots`
    }
  },
  
  // 前端配置
  frontend: {
    // 前端端口
    port: 10060,
    // 前端URL
    get baseURL() {
      return `http://localhost:${this.port}`
    }
  }
}

// 导出默认配置
export default config

// AI服务配置
export const getAiConfig = () => ({
  // 通义千问配置
  qwen: {
    apiKey: process.env.QWEN_API_KEY || 'your_qwen_api_key_here',
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
    // 使用视觉语言模型以支持图像理解
    model: process.env.QWEN_MODEL || 'qwen-vl-max',
    maxTokens: 2000,
    temperature: 0.1,
    timeout: 60000, // 60秒超时
    maxRetries: 3,  // 最大重试次数
    retryDelay: 2000 // 重试延迟（毫秒）
  },
  
  // ChatGPT配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.1,
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 2000
  },
  
  // Gemini 2.0 Flash配置
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'your_gemini_api_key_here',
    baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    maxTokens: 4000,
    temperature: 0.1,
    timeout: 60000, // 60秒超时
    maxRetries: 3,  // 最大重试次数
    retryDelay: 2000 // 重试延迟（毫秒）
  },
  
  // 默认AI模型
  defaultModel: 'qwen-vl-max',
  
  // 支持的AI模型列表
  supportedModels: [
    {
      id: 'qwen-vl-max',
      name: '通义千问VL-Max',
      provider: 'qwen',
      description: '阿里云通义千问视觉语言大模型，支持图像理解和分析'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'ChatGPT (GPT-3.5 Turbo)',
      provider: 'openai',
      description: 'OpenAI ChatGPT模型，支持智能对话和文本生成'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'gemini',
      description: 'Google Gemini 2.0 Flash模型，支持文本和视觉理解'
    }
  ]
});

// 为了向后兼容，保留aiConfig导出
export const aiConfig = getAiConfig();

export default getAiConfig; 
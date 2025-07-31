import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import axios from 'axios'
import { aiConfig } from '../config/ai.js'

// 初始化Gemini
const genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey)

// 初始化OpenAI
const openai = new OpenAI({
  apiKey: aiConfig.openai.apiKey,
  baseURL: aiConfig.openai.baseURL
})

/**
 * 发送AI消息（非流式）
 * @param {string} message - 用户消息
 * @param {string} model - 模型ID
 * @param {string} userId - 用户ID
 * @returns {Promise<{content: string, model: string}>}
 */
export const sendAiMessage = async (message, model, userId) => {
  try {
    console.log(`发送AI消息: ${model}, 用户: ${userId}`)
    
    let response
    switch (model) {
      case 'gemini-2.0-flash':
        response = await sendGeminiMessage(message)
        break
      case 'qwen-vl-max':
        response = await sendQwenMessage(message)
        break
      case 'gpt-3.5-turbo':
        response = await sendOpenAIMessage(message)
        break
      default:
        throw new Error(`不支持的模型: ${model}`)
    }
    
    return {
      content: response,
      model: model
    }
    
  } catch (error) {
    console.error('AI消息发送失败:', error)
    throw new Error(`AI对话失败: ${error.message}`)
  }
}

/**
 * 流式发送AI消息
 * @param {string} message - 用户消息
 * @param {string} model - 模型ID
 * @param {string} userId - 用户ID
 * @param {Response} res - Express响应对象
 */
export const sendAiMessageStream = async (message, model, userId, res) => {
  try {
    console.log(`流式发送AI消息: ${model}, 用户: ${userId}`)
    
    // 发送开始处理消息
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: '开始处理AI对话...',
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    let response
    switch (model) {
      case 'gemini-2.0-flash':
        response = await sendGeminiMessageStream(message, res)
        break
      case 'qwen-vl-max':
        response = await sendQwenMessageStream(message, res)
        break
      case 'gpt-3.5-turbo':
        response = await sendOpenAIMessageStream(message, res)
        break
      default:
        throw new Error(`不支持的模型: ${model}`)
    }
    
    // 发送完成消息
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      response: response,
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    res.end()
    
  } catch (error) {
    console.error('流式AI消息发送失败:', error)
    
    // 发送错误消息
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: `AI对话失败: ${error.message}`,
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    res.end()
  }
}

/**
 * 发送Gemini消息（非流式）
 */
const sendGeminiMessage = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model })
    
    const prompt = `你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。

用户问题: ${message}

请提供详细、专业的回答:`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
    
  } catch (error) {
    console.error('Gemini消息发送失败:', error)
    throw new Error(`Gemini服务调用失败: ${error.message}`)
  }
}

/**
 * 流式发送Gemini消息
 */
const sendGeminiMessageStream = async (message, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model })
    
    const prompt = `你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。

用户问题: ${message}

请提供详细、专业的回答:`
    
    const result = await model.generateContentStream(prompt)
    let fullResponse = ''
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullResponse += chunkText
      
      // 发送流式消息
      res.write(`data: ${JSON.stringify({
        type: 'message',
        content: chunkText,
        timestamp: new Date().toISOString()
      })}\n\n`)
    }
    
    return fullResponse
    
  } catch (error) {
    console.error('流式Gemini消息发送失败:', error)
    throw new Error(`Gemini流式服务调用失败: ${error.message}`)
  }
}

/**
 * 发送通义千问消息（非流式）
 */
const sendQwenMessage = async (message) => {
  try {
    const response = await axios.post(
      `${aiConfig.qwen.baseURL}/services/aigc/text-generation/generation`,
      {
        model: aiConfig.qwen.model,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。'
            },
            {
              role: 'user',
              content: message
            }
          ]
        },
        parameters: {
          max_tokens: aiConfig.qwen.maxTokens,
          temperature: aiConfig.qwen.temperature
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${aiConfig.qwen.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: aiConfig.qwen.timeout
      }
    )
    
    if (response.data.output && response.data.output.text) {
      return response.data.output.text
    } else {
      throw new Error('通义千问响应格式错误')
    }
    
  } catch (error) {
    console.error('通义千问消息发送失败:', error)
    
    // 如果是API错误，返回友好的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data
      throw new Error(`通义千问API错误: ${errorData.message || errorData.code || '未知错误'}`)
    }
    
    throw new Error(`通义千问服务调用失败: ${error.message}`)
  }
}

/**
 * 流式发送通义千问消息
 */
const sendQwenMessageStream = async (message, res) => {
  try {
    console.log('开始调用通义千问流式API...')
    console.log('API配置:', {
      baseURL: aiConfig.qwen.baseURL,
      model: aiConfig.qwen.model,
      timeout: aiConfig.qwen.timeout
    })
    
    const response = await axios.post(
      `${aiConfig.qwen.baseURL}/services/aigc/text-generation/generation`,
      {
        model: aiConfig.qwen.model,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。'
            },
            {
              role: 'user',
              content: message
            }
          ]
        },
        parameters: {
          max_tokens: aiConfig.qwen.maxTokens,
          temperature: aiConfig.qwen.temperature,
          stream: true,
          incremental_output: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${aiConfig.qwen.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        timeout: aiConfig.qwen.timeout,
        responseType: 'stream'
      }
    )
    
    console.log('通义千问API响应状态:', response.status)
    console.log('响应头:', response.headers)
    
    let fullResponse = ''
    
    response.data.on('data', (chunk) => {
      console.log('接收到原始数据块:', chunk.toString())
      const lines = chunk.toString().split('\n')
      console.log('分割后的行数:', lines.length)
      
      for (const line of lines) {
          console.log('处理行:', JSON.stringify(line))
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.slice(5) // 移除"data:"前缀
              console.log('提取的JSON字符串:', jsonStr)
              const data = JSON.parse(jsonStr)
              console.log('解析后的数据:', JSON.stringify(data, null, 2))
              
              if (data.output && data.output.text && data.output.text.trim()) {
                console.log('找到文本内容:', data.output.text)
                fullResponse += data.output.text
                
                // 发送流式消息
                res.write(`data: ${JSON.stringify({
                  type: 'message',
                  content: data.output.text,
                  timestamp: new Date().toISOString()
                })}\n\n`)
              } else {
                console.log('数据结构不包含有效的output.text:', data)
              }
            } catch (parseError) {
              console.error('解析通义千问流式数据失败:', parseError)
              console.error('原始行内容:', line)
            }
          } else if (line.trim()) {
            console.log('非data行:', line)
          }
        }
    })
    
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve(fullResponse)
      })
      
      response.data.on('error', (error) => {
        reject(error)
      })
    })
    
  } catch (error) {
    console.error('流式通义千问消息发送失败:', error)
    console.error('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    })
    
    if (error.response?.status === 400) {
      throw new Error(`通义千问API请求参数错误 (400): ${error.response?.data?.message || error.message}`)
    } else if (error.response?.status === 401) {
      throw new Error(`通义千问API认证失败 (401): 请检查API密钥`)
    } else if (error.response?.status === 429) {
      throw new Error(`通义千问API请求频率限制 (429): 请稍后重试`)
    } else {
      throw new Error(`通义千问流式服务调用失败: ${error.message}`)
    }
  }
}

/**
 * 发送OpenAI消息（非流式）
 */
const sendOpenAIMessage = async (message) => {
  try {
    const response = await openai.chat.completions.create({
      model: aiConfig.openai.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: aiConfig.openai.maxTokens,
      temperature: aiConfig.openai.temperature
    })
    
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content
    } else {
      throw new Error('OpenAI响应格式错误')
    }
    
  } catch (error) {
    console.error('OpenAI消息发送失败:', error)
    
    // 如果是API错误，返回友好的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data
      throw new Error(`OpenAI API错误: ${errorData.error?.message || errorData.message || '未知错误'}`)
    }
    
    throw new Error(`OpenAI服务调用失败: ${error.message}`)
  }
}

/**
 * 流式发送OpenAI消息
 */
const sendOpenAIMessageStream = async (message, res) => {
  try {
    console.log('开始调用OpenAI流式API...')
    console.log('API配置:', {
      baseURL: aiConfig.openai.baseURL,
      model: aiConfig.openai.model
    })
    
    const stream = await openai.chat.completions.create({
      model: aiConfig.openai.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的软件测试专家，专门帮助用户解决测试相关的问题。请用中文回答用户的问题，提供专业、实用的建议。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: aiConfig.openai.maxTokens,
      temperature: aiConfig.openai.temperature,
      stream: true
    })
    
    console.log('OpenAI API流式响应已建立')
    
    let fullResponse = ''
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        console.log('接收到OpenAI流式内容:', content)
        fullResponse += content
        
        // 发送流式消息
        res.write(`data: ${JSON.stringify({
          type: 'message',
          content: content,
          timestamp: new Date().toISOString()
        })}\n\n`)
      }
    }
    
    console.log('OpenAI流式响应完成，总长度:', fullResponse.length)
    return fullResponse
    
  } catch (error) {
    console.error('流式OpenAI消息发送失败:', error)
    console.error('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    })
    
    if (error.response?.status === 400) {
      throw new Error(`OpenAI API请求参数错误 (400): ${error.response?.data?.error?.message || error.message}`)
    } else if (error.response?.status === 401) {
      throw new Error(`OpenAI API认证失败 (401): 请检查API密钥`)
    } else if (error.response?.status === 429) {
      throw new Error(`OpenAI API请求频率限制 (429): 请稍后重试`)
    } else {
      throw new Error(`OpenAI流式服务调用失败: ${error.message}`)
    }
  }
}
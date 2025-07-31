import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { serverErrorResponse, successResponse } from '../utils/response.js'

const router = express.Router()

/**
 * 发送AI对话消息（非流式）
 * POST /api/ai-chat/send
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, model } = req.body
    
    if (!message || !model) {
      return res.status(400).json({
        success: false,
        message: '消息内容和模型参数不能为空'
      })
    }

    // 导入AI服务
    const { sendAiMessage } = await import('../services/aiChatService.js')
    
    // 调用AI服务
    const response = await sendAiMessage(message, model, req.user._id)
    
    return successResponse(res, {
      response: response.content,
      model: model,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('AI对话失败:', error)
    return serverErrorResponse(res, 'AI对话失败: ' + error.message)
  }
})

/**
 * 流式AI对话（使用Server-Sent Events）
 * POST /api/ai-chat/stream
 */
router.post('/stream', authenticateToken, async (req, res) => {
  const { message, model } = req.body
  
  try {
    if (!message || !model) {
      return res.status(400).json({
        success: false,
        message: '消息内容和模型参数不能为空'
      })
    }

    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // 发送连接建立消息
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'SSE连接已建立',
      timestamp: new Date().toISOString()
    })}\n\n`)

    // 导入AI服务
    const { sendAiMessageStream } = await import('../services/aiChatService.js')
    
    // 调用流式AI服务
    await sendAiMessageStream(message, model, req.user._id, res)
    
  } catch (error) {
    console.error('流式AI对话失败:', error)
    
    // 发送错误消息
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: `AI对话失败: ${error.message}`,
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    res.end()
  }
})

export default router 
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import Video from '../models/Video.js';
import Joi from 'joi';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: function (req, file, cb) {
    // 检查文件类型 - 支持多种MIME类型和文件扩展名
    const allowedMimeTypes = [
      'video/mp4',
      'video/avi', 
      'video/quicktime', // MOV文件的常见MIME类型
      'video/x-msvideo', // AVI文件的另一种MIME类型
      'video/x-ms-wmv', // WMV文件的MIME类型
      'video/x-flv', // FLV文件的MIME类型
      'video/webm',
      'video/x-matroska', // MKV文件的MIME类型
      'video/3gpp', // 3GP文件的MIME类型
      'video/x-ms-asf' // ASF文件的MIME类型
    ];
    
    // 检查MIME类型（不区分大小写）
    const mimeTypeLower = file.mimetype.toLowerCase();
    const isAllowedMimeType = allowedMimeTypes.some(type => 
      type.toLowerCase() === mimeTypeLower
    );
    
    // 检查文件扩展名（不区分大小写）
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp', '.asf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isAllowedExtension = allowedExtensions.includes(fileExtension);
    
    // 如果MIME类型或扩展名任一匹配，则允许上传
    if (isAllowedMimeType || isAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 验证模式
const createVideoSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    'string.min': '视频名称至少1个字符',
    'string.max': '视频名称最多200个字符',
    'any.required': '视频名称是必填项'
  })
});

const updateVideoSchema = Joi.object({
  name: Joi.string().min(1).max(200).messages({
    'string.min': '视频名称至少1个字符',
    'string.max': '视频名称最多200个字符'
  })
});

/**
 * 上传视频
 * POST /api/videos/upload
 */
router.post('/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的视频文件', 400);
    }

    // 验证请求数据
    const { error, value } = createVideoSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const { name } = value;

    // 处理MIME类型 - Chrome不支持video/quicktime，统一使用video/mp4
    let mimeType = req.file.mimetype;
    if (mimeType === 'video/quicktime') {
      mimeType = 'video/mp4';
    }

    // 创建视频记录
    const video = new Video({
      memberId: req.user._id,
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      filePath: req.file.path,
      mimeType: mimeType,
      parseStatus: 'pending'
    });

    await video.save();

    return successResponse(res, video, '视频上传成功', 201);
  } catch (error) {
    console.error('上传视频失败:', error);
    
    // 如果是文件类型错误
    if (error.message === '不支持的文件类型') {
      return errorResponse(res, '不支持的文件类型，请上传 MP4、AVI、MOV、WMV、FLV、WebM、MKV、3GP 或 ASF 格式的视频', 400);
    }
    
    // 如果是文件大小错误
    if (error.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, '文件大小超过限制，最大支持 500MB', 400);
    }
    
    return serverErrorResponse(res, '上传视频失败');
  }
});

/**
 * 获取视频列表
 * GET /api/videos
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, parseStatus, search } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = { memberId: req.user._id };
    
    if (parseStatus) {
      query.parseStatus = parseStatus;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('查询视频列表，用户ID:', req.user._id)
    console.log('查询条件:', query)

    // 查询视频
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await Video.countDocuments(query);

    // 获取统计信息
    const statistics = await Video.getStatistics(req.user._id);

    console.log('查询结果:', {
      videosCount: videos.length,
      total,
      statistics
    })

    return successResponse(res, {
      videos,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistics
    }, '获取视频列表成功');
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return serverErrorResponse(res, '获取视频列表失败');
  }
});

/**
 * 获取视频详情
 * GET /api/videos/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    return successResponse(res, video, '获取视频详情成功');
  } catch (error) {
    console.error('获取视频详情失败:', error);
    return serverErrorResponse(res, '获取视频详情失败');
  }
});

/**
 * 更新视频信息
 * PUT /api/videos/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证请求数据
    const { error, value } = updateVideoSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    // 如果视频正在解析中，不允许修改
    if (video.parseStatus === 'processing') {
      return errorResponse(res, '视频正在解析中，无法修改', 400);
    }

    // 更新视频信息
    Object.assign(video, value);
    video.updatedAt = new Date();
    await video.save();

    return successResponse(res, video, '视频信息更新成功');
  } catch (error) {
    console.error('更新视频信息失败:', error);
    return serverErrorResponse(res, '更新视频信息失败');
  }
});

/**
 * 删除视频
 * DELETE /api/videos/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    // 如果视频正在解析中，不允许删除
    if (video.parseStatus === 'processing') {
      return errorResponse(res, '视频正在解析中，无法删除', 400);
    }

    // 删除文件
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    // 删除缩略图
    if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) {
      fs.unlinkSync(video.thumbnailPath);
    }

    await Video.findByIdAndDelete(id);

    return successResponse(res, null, '视频删除成功');
  } catch (error) {
    console.error('删除视频失败:', error);
    return serverErrorResponse(res, '删除视频失败');
  }
});

/**
 * 更新视频解析状态
 * PATCH /api/videos/:id/parse-status
 */
router.patch('/:id/parse-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { parseStatus, parseResult } = req.body;

    if (!['pending', 'processing', 'completed', 'failed'].includes(parseStatus)) {
      return errorResponse(res, '无效的解析状态值', 400);
    }

    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    // 更新解析状态和相关数据
    const updateData = { parseStatus };
    if (parseResult) updateData.parseResult = parseResult;

    await video.updateParseStatus(parseStatus, updateData);

    return successResponse(res, video, '视频解析状态更新成功');
  } catch (error) {
    console.error('更新视频解析状态失败:', error);
    return serverErrorResponse(res, '更新视频解析状态失败');
  }
});

/**
 * 检查视频文件是否存在
 * GET /api/videos/:id/check-file
 */
router.get('/:id/check-file', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    // 检查文件是否存在
    const fileExists = fs.existsSync(video.filePath);
    const fileStats = fileExists ? fs.statSync(video.filePath) : null;

    return successResponse(res, {
      fileExists,
      filePath: video.filePath,
      fileSize: fileStats?.size,
      originalName: video.originalName,
      mimeType: video.mimeType
    }, '文件检查完成');
  } catch (error) {
    console.error('检查视频文件失败:', error);
    return serverErrorResponse(res, '检查视频文件失败');
  }
});

/**
 * 获取视频统计信息
 * GET /api/videos/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await Video.getStatistics(req.user._id);
    return successResponse(res, statistics, '获取统计信息成功');
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return serverErrorResponse(res, '获取统计信息失败');
  }
});

/**
 * 使用Gemini解析视频内容
 * POST /api/videos/:id/parse-with-gemini
 */
router.post('/:id/parse-with-gemini', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找视频记录
    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    // 检查视频文件是否存在
    if (!fs.existsSync(video.filePath)) {
      return errorResponse(res, '视频文件不存在', 404);
    }

    // 更新状态为处理中
    await video.updateParseStatus('processing');

    try {
      // 导入Gemini分析服务
      const { analyzeVideoWithGemini } = await import('../services/aiService.js');
      
      // 调用Gemini分析
      const analysisResult = await analyzeVideoWithGemini(video.filePath, video.name);
      
      if (analysisResult.success) {
        // 确保分析结果符合MongoDB模型要求
        const validatedAnalysis = analysisResult.analysis;
        
        // 更新解析结果
        const updateData = {
          parseStatus: 'completed',
          parseResult: {
            success: true,
            message: 'Gemini分析完成',
            errorDetails: '',
            duration: 0, // 暂时设为0，后续可以添加视频时长检测
            resolution: {
              width: 0, // 暂时设为0，后续可以添加视频分辨率检测
              height: 0
            },
            frameRate: 0, // 暂时设为0，后续可以添加帧率检测
            geminiAnalysis: validatedAnalysis
          }
        };
        
        await video.updateParseStatus('completed', updateData);
        
        return successResponse(res, {
          video: video,
          analysis: validatedAnalysis
        }, '视频解析成功');
      } else {
        throw new Error(analysisResult.error || 'Gemini分析失败');
      }
      
    } catch (analysisError) {
      console.error('Gemini分析失败:', analysisError);
      
      // 更新状态为失败
      const updateData = {
        parseStatus: 'failed',
        parseResult: {
          success: false,
          message: 'Gemini分析失败',
          errorDetails: analysisError.message,
          duration: 0,
          resolution: {
            width: 0,
            height: 0
          },
          frameRate: 0,
          geminiAnalysis: {
            summary: '分析失败',
            testAnalysis: {
              functionalIssues: [],
              uiIssues: [],
              performanceIssues: [],
              compatibilityIssues: [],
              securityIssues: []
            },
            overallAssessment: {
              qualityScore: 0,
              criticalIssues: 0,
              majorIssues: 0,
              minorIssues: 0,
              recommendations: []
            },
            testRecommendations: []
          }
        }
      };
      
      await video.updateParseStatus('failed', updateData);
      
      return errorResponse(res, `Gemini分析失败: ${analysisError.message}`, 500);
    }
    
  } catch (error) {
    console.error('视频解析失败:', error);
    return serverErrorResponse(res, '视频解析失败');
  }
});

/**
 * 流式解析视频（使用Server-Sent Events）
 * POST /api/videos/:id/parse-stream
 */
router.post('/:id/parse-stream', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送连接建立消息
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'SSE连接已建立',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 查找视频记录
    const video = await Video.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!video) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: '视频不存在',
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
      return;
    }

    // 检查视频文件是否存在
    if (!fs.existsSync(video.filePath)) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: '视频文件不存在',
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
      return;
    }

    // 发送开始解析消息
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      step: '开始解析',
      progress: 10,
      message: '正在初始化Gemini解析任务...',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 更新状态为处理中
    await video.updateParseStatus('processing');

    // 发送状态更新消息
    res.write(`data: ${JSON.stringify({
      type: 'status',
      status: 'processing',
      message: '视频状态已更新为处理中',
      timestamp: new Date().toISOString()
    })}\n\n`);

    try {
      // 导入Gemini分析服务
      const { analyzeVideoWithGemini } = await import('../services/aiService.js');
      
      // 发送文件检查消息
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        step: '检查视频文件',
        progress: 20,
        message: '正在检查视频文件...',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 获取文件信息
      const stats = fs.statSync(video.filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      res.write(`data: ${JSON.stringify({
        type: 'info',
        message: `视频文件大小: ${fileSizeInMB.toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 发送API调用消息
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        step: '调用Gemini API',
        progress: 40,
        message: '正在调用Gemini API进行视频分析...',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 调用Gemini分析
      const analysisResult = await analyzeVideoWithGemini(video.filePath, video.name);
      
      // 发送分析完成消息
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        step: 'AI分析完成',
        progress: 80,
        message: 'Gemini AI分析已完成',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 发送原始响应内容
      if (analysisResult.rawResponse) {
        res.write(`data: ${JSON.stringify({
          type: 'raw_response',
          message: 'Gemini原始响应内容:',
          content: analysisResult.rawResponse,
          isJson: analysisResult.isJsonResponse || false,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }

      if (analysisResult.success) {
        // 发送保存结果消息
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          step: '保存结果',
          progress: 90,
          message: '正在保存分析结果到数据库...',
          timestamp: new Date().toISOString()
        })}\n\n`);

        // 确保分析结果符合MongoDB模型要求
        const validatedAnalysis = analysisResult.analysis;
        
        // 更新解析结果
        const updateData = {
          parseStatus: 'completed',
          parseResult: {
            success: true,
            message: 'Gemini分析完成',
            errorDetails: '',
            duration: 0, // 暂时设为0，后续可以添加视频时长检测
            resolution: {
              width: 0, // 暂时设为0，后续可以添加视频分辨率检测
              height: 0
            },
            frameRate: 0, // 暂时设为0，后续可以添加帧率检测
            geminiAnalysis: validatedAnalysis
          }
        };
        
        await video.updateParseStatus('completed', updateData);
        
        // 发送完成消息
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          step: '解析完成',
          progress: 100,
          message: '视频解析成功完成！',
          timestamp: new Date().toISOString()
        })}\n\n`);

        res.write(`data: ${JSON.stringify({
          type: 'success',
          message: '视频解析成功',
          analysis: validatedAnalysis,
          timestamp: new Date().toISOString()
        })}\n\n`);

        res.write(`data: ${JSON.stringify({
          type: 'status',
          status: 'completed',
          message: '视频状态已更新为完成',
          timestamp: new Date().toISOString()
        })}\n\n`);

      } else {
        throw new Error(analysisResult.error || 'Gemini分析失败');
      }
      
    } catch (analysisError) {
      console.error('Gemini分析失败:', analysisError);
      
      // 发送错误消息
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: `Gemini分析失败: ${analysisError.message}`,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 更新状态为失败
      const updateData = {
        parseStatus: 'failed',
        parseResult: {
          success: false,
          message: 'Gemini分析失败',
          errorDetails: analysisError.message,
          duration: 0,
          resolution: {
            width: 0,
            height: 0
          },
          frameRate: 0,
          geminiAnalysis: {
            summary: '分析失败',
            testAnalysis: {
              functionalIssues: [],
              uiIssues: [],
              performanceIssues: [],
              compatibilityIssues: [],
              securityIssues: []
            },
            overallAssessment: {
              qualityScore: 0,
              criticalIssues: 0,
              majorIssues: 0,
              minorIssues: 0,
              recommendations: []
            },
            testRecommendations: []
          }
        }
      };
      
      await video.updateParseStatus('failed', updateData);
      
      res.write(`data: ${JSON.stringify({
        type: 'status',
        status: 'failed',
        message: '视频状态已更新为失败',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }
    
    // 发送结束消息
    res.write(`data: ${JSON.stringify({
      type: 'end',
      message: '解析流程结束',
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    console.error('流式解析失败:', error);
    
    // 发送错误消息
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: `流式解析失败: ${error.message}`,
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    res.end();
  }
});

/**
 * 测试Gemini API连接
 * POST /api/videos/test-gemini
 */
router.post('/test-gemini', authenticateToken, async (req, res) => {
  try {
    // 导入Gemini测试服务
    const { testGeminiConnection } = await import('../services/aiService.js');
    
    // 测试Gemini连接
    const result = await testGeminiConnection();
    
    if (result.success) {
      return successResponse(res, {
        success: true,
        response: result.response
      }, 'Gemini连接测试成功');
    } else {
      return errorResponse(res, result.error, 500);
    }
    
  } catch (error) {
    console.error('Gemini连接测试失败:', error);
    return serverErrorResponse(res, 'Gemini连接测试失败');
  }
});

export default router;
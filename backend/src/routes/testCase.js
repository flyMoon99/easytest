import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import TestCase from '../models/TestCase.js';
import { analyzeScreenshotAndGenerateScripts, getAvailableModels } from '../services/aiService.js';
import { detectTestType, getAvailableTestTypes } from '../services/promptService.js';
import Joi from 'joi';

const router = express.Router();

// 配置图片上传（保存到 public/screenshots）
const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, screenshotsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `screenshot-${unique}${ext}`);
  }
});

const allowedImageMimes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]);

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = allowedImageMimes.has((file.mimetype || '').toLowerCase());
    if (!ok) {
      return cb(new Error('不支持的图片类型'));
    }
    cb(null, true);
  }
});

// 验证模式
const createTestCaseSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': '测试标题至少5个字符',
    'string.max': '测试标题最多100个字符',
    'any.required': '测试标题是必填项'
  }),
  entryUrl: Joi.string().uri().required().messages({
    'string.uri': '请输入有效的URL地址',
    'any.required': '测试入口URL是必填项'
  }),
  description: Joi.string().min(5).max(2000).required().messages({
    'string.min': '测试描述至少5个字符',
    'string.max': '测试描述最多2000个字符',
    'any.required': '测试内容描述是必填项'
  }),
  directoryId: Joi.string().required().messages({
    'any.required': '目录是必填项'
  }),
  level: Joi.string().valid('高', '中', '低').optional().messages({
    'any.only': '用例等级只能是高、中、低'
  })
});

const updateTestCaseSchema = Joi.object({
  title: Joi.string().min(5).max(100).messages({
    'string.min': '测试标题至少5个字符',
    'string.max': '测试标题最多100个字符'
  }),
  entryUrl: Joi.string().uri().messages({
    'string.uri': '请输入有效的URL地址'
  }),
  description: Joi.string().min(5).max(2000).messages({
    'string.min': '测试描述至少5个字符',
    'string.max': '测试描述最多2000个字符'
  }),
  level: Joi.string().valid('高', '中', '低').messages({
    'any.only': '用例等级只能是高、中、低'
  })
});

/**
 * 创建测试用例（支持multipart图片上传）
 * POST /api/testcases
 */
router.post('/', authenticateToken, uploadImage.single('screenshot'), async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = createTestCaseSchema.validate(req.body, { allowUnknown: true, stripUnknown: true });
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const { title, entryUrl, description, directoryId, level } = value;

    // 判断是否上传了图片
    const hasScreenshot = !!req.file;
    const relativeScreenshotPath = hasScreenshot
      ? `/screenshots/${req.file.filename}`
      : '';

    // 创建测试用例
    const testCase = new TestCase({
      memberId: req.user._id,
      directoryId,
      title,
      entryUrl,
      description,
      level: level || '中', // 默认等级为中
      screenshotUrl: relativeScreenshotPath
    });

    await testCase.save();

    return successResponse(res, testCase, '测试用例创建成功', 201);
  } catch (error) {
    console.error('创建测试用例失败:', error);
    // 处理上传相关错误
    if (error.message === '不支持的图片类型') {
      return errorResponse(res, '不支持的图片类型，请上传 PNG/JPG/JPEG/WEBP 格式', 400);
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, '图片大小超过限制，最大支持 10MB', 400);
    }
    return serverErrorResponse(res, '创建测试用例失败');
  }
});

/**
 * 获取测试用例列表
 * GET /api/testcases
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, all } = req.query;
    
    // 如果请求所有用例（用于选择器）
    if (all === 'true') {
      const query = { memberId: req.user._id };
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const testCases = await TestCase.find(query)
        .populate('directoryId', 'name path')
        .sort({ createdAt: -1 })
        .lean();

      // 格式化数据
      const formattedCases = testCases.map(testCase => {
        const directoryPath = testCase.directoryId ? 
          testCase.directoryId.path.split('/').filter(Boolean) : [];
        
        return {
          id: testCase._id.toString(),
          title: testCase.title,
          level: testCase.level || '中',
          directoryPath: directoryPath
        };
      });

      return successResponse(res, { testCases: formattedCases });
    }

    // 常规列表查询
    const query = { memberId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [testCases, total] = await Promise.all([
      TestCase.find(query)
        .populate('directoryId', 'name path')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TestCase.countDocuments(query)
    ]);

    // 格式化数据
    const formattedCases = testCases.map(testCase => {
      const directoryPath = testCase.directoryId ? 
        testCase.directoryId.path.split('/').filter(Boolean) : [];
      
      return {
        id: testCase._id.toString(),
        title: testCase.title,
        entryUrl: testCase.entryUrl,
        description: testCase.description,
        level: testCase.level || '中',
        directoryPath: directoryPath,
        screenshotUrl: testCase.screenshotUrl,
        createdAt: testCase.createdAt,
        updatedAt: testCase.updatedAt
      };
    });

    return successResponse(res, {
      testCases: formattedCases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取测试用例列表失败:', error);
    return serverErrorResponse(res, '获取测试用例列表失败');
  }
});

/**
 * 获取测试用例详情
 * GET /api/testcases/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    }).populate('directoryId', 'name path');

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    // 格式化数据
    const directoryPath = testCase.directoryId ? 
      testCase.directoryId.path.split('/').filter(Boolean) : [];

    const formattedTestCase = {
      id: testCase._id.toString(),
      title: testCase.title,
      entryUrl: testCase.entryUrl,
      description: testCase.description,
      level: testCase.level || '中',
      directoryPath: directoryPath,
      screenshotUrl: testCase.screenshotUrl,
      playwrightScripts: testCase.playwrightScripts || [],
      aiAnalysis: testCase.aiAnalysis,
      videoUrl: testCase.videoUrl,
      createdAt: testCase.createdAt,
      updatedAt: testCase.updatedAt
    };

    return successResponse(res, formattedTestCase);
  } catch (error) {
    console.error('获取测试用例详情失败:', error);
    return serverErrorResponse(res, '获取测试用例详情失败');
  }
});

/**
 * 更新测试用例
 * PUT /api/testcases/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证请求数据
    const { error, value } = updateTestCaseSchema.validate(req.body, { allowUnknown: true, stripUnknown: true });
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    // 更新测试用例
    Object.assign(testCase, value);
    testCase.updatedAt = new Date();
    await testCase.save();

    return successResponse(res, testCase, '测试用例更新成功');
  } catch (error) {
    console.error('更新测试用例失败:', error);
    return serverErrorResponse(res, '更新测试用例失败');
  }
});

/**
 * 删除测试用例
 * DELETE /api/testcases/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    await TestCase.findByIdAndDelete(id);

    return successResponse(res, null, '测试用例删除成功');
  } catch (error) {
    console.error('删除测试用例失败:', error);
    return serverErrorResponse(res, '删除测试用例失败');
  }
});

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import TestResult from '../models/TestResult.js';
import Video from '../models/Video.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// 获取测试结果列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      severity, 
      category,
      videoId,
      search 
    } = req.query;
    
    const memberId = req.user.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 构建查询条件
    const query = { memberId };
    
    if (status) {
      query.status = status;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (videoId) {
      query.videoId = videoId;
    }
    
    if (search) {
      query.$or = [
        { issue: { $regex: search, $options: 'i' } },
        { impact: { $regex: search, $options: 'i' } },
        { recommendation: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 执行查询
    const [testResults, total] = await Promise.all([
      TestResult.find(query)
        .populate('videoId', 'name originalName filePath mimeType fileSize')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TestResult.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // 将videoId字段重命名为video以匹配前端期望
    const formattedResults = testResults.map(result => {
      const resultObj = result.toObject();
      resultObj.video = resultObj.videoId;
      delete resultObj.videoId;
      return resultObj;
    });
    
    successResponse(res, {
      testResults: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('获取测试结果列表失败:', error);
    errorResponse(res, '获取测试结果列表失败', 500);
  }
});

// 获取单个测试结果详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;
    
    const testResult = await TestResult.findOne({ _id: id, memberId })
      .populate('videoId', 'name originalName filePath mimeType fileSize');
    
    if (!testResult) {
      return errorResponse(res, '测试结果不存在', 404);
    }
    
    // 将videoId字段重命名为video以匹配前端期望
    const resultObj = testResult.toObject();
    resultObj.video = resultObj.videoId;
    delete resultObj.videoId;
    
    successResponse(res, { testResult: resultObj });
    
  } catch (error) {
    console.error('获取测试结果详情失败:', error);
    errorResponse(res, '获取测试结果详情失败', 500);
  }
});

// 创建测试结果
router.post('/', authenticateToken, async (req, res) => {
  try {
    const memberId = req.user.id;
    const { videoId, issue, impact, recommendation, severity, category } = req.body;
    
    // 验证视频是否存在且属于当前用户
    const video = await Video.findOne({ _id: videoId, memberId });
    if (!video) {
      return errorResponse(res, '视频不存在或无权限访问', 404);
    }
    
    const testResult = new TestResult({
      memberId,
      videoId,
      issue,
      impact,
      recommendation,
      severity: severity || 'medium',
      category: category || '其他'
    });
    
    await testResult.save();
    
    successResponse(res, { testResult }, '测试结果创建成功');
    
  } catch (error) {
    console.error('创建测试结果失败:', error);
    errorResponse(res, '创建测试结果失败', 500);
  }
});

// 批量创建测试结果
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const memberId = req.user.id;
    const { videoId, testResults } = req.body;
    
    // 验证视频是否存在且属于当前用户
    const video = await Video.findOne({ _id: videoId, memberId });
    if (!video) {
      return errorResponse(res, '视频不存在或无权限访问', 404);
    }
    
    // 验证测试结果数据
    if (!Array.isArray(testResults) || testResults.length === 0) {
      return errorResponse(res, '测试结果数据格式错误', 400);
    }
    
    // 创建测试结果记录
    const testResultDocs = testResults.map(result => ({
      memberId,
      videoId,
      issue: result.issue,
      impact: result.impact,
      recommendation: result.recommendation,
      severity: result.severity || 'medium',
      category: result.category || '其他'
    }));
    
    const createdTestResults = await TestResult.insertMany(testResultDocs);
    
    successResponse(res, { 
      testResults: createdTestResults,
      count: createdTestResults.length 
    }, `成功创建 ${createdTestResults.length} 条测试结果`);
    
  } catch (error) {
    console.error('批量创建测试结果失败:', error);
    errorResponse(res, '批量创建测试结果失败', 500);
  }
});

// 更新测试结果状态
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;
    const { status, processingNote } = req.body;
    
    const testResult = await TestResult.findOne({ _id: id, memberId });
    
    if (!testResult) {
      return errorResponse(res, '测试结果不存在', 404);
    }
    
    await testResult.updateStatus(status, processingNote);
    
    successResponse(res, { testResult }, '状态更新成功');
    
  } catch (error) {
    console.error('更新测试结果状态失败:', error);
    errorResponse(res, '更新测试结果状态失败', 500);
  }
});

// 更新测试结果
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;
    const { issue, impact, recommendation, severity, category } = req.body;
    
    const testResult = await TestResult.findOne({ _id: id, memberId });
    
    if (!testResult) {
      return errorResponse(res, '测试结果不存在', 404);
    }
    
    // 更新字段
    if (issue !== undefined) testResult.issue = issue;
    if (impact !== undefined) testResult.impact = impact;
    if (recommendation !== undefined) testResult.recommendation = recommendation;
    if (severity !== undefined) testResult.severity = severity;
    if (category !== undefined) testResult.category = category;
    
    await testResult.save();
    
    successResponse(res, { testResult }, '测试结果更新成功');
    
  } catch (error) {
    console.error('更新测试结果失败:', error);
    errorResponse(res, '更新测试结果失败', 500);
  }
});

// 删除测试结果
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;
    
    const testResult = await TestResult.findOne({ _id: id, memberId });
    
    if (!testResult) {
      return errorResponse(res, '测试结果不存在', 404);
    }
    
    await TestResult.deleteOne({ _id: id });
    
    successResponse(res, null, '测试结果删除成功');
    
  } catch (error) {
    console.error('删除测试结果失败:', error);
    errorResponse(res, '删除测试结果失败', 500);
  }
});

// 获取测试结果统计信息
router.get('/statistics/summary', authenticateToken, async (req, res) => {
  try {
    const memberId = req.user.id;
    
    const statistics = await TestResult.getStatistics(memberId);
    
    successResponse(res, { statistics });
    
  } catch (error) {
    console.error('获取测试结果统计失败:', error);
    errorResponse(res, '获取测试结果统计失败', 500);
  }
});

export default router; 
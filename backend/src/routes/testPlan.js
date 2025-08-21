import express from 'express';
import Joi from 'joi';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import TestPlan from '../models/TestPlan.js';

const router = express.Router();

// 验证模式
const createTestPlanSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'string.max': '计划名称最多100个字符',
    'any.required': '计划名称是必填项'
  }),
  description: Joi.string().max(2000).optional().messages({
    'string.max': '计划描述最多2000个字符'
  }),
  status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').default('draft').messages({
    'any.only': '状态必须是 draft、active、completed 或 cancelled'
  }),
  testType: Joi.string().max(50).required().messages({
    'string.max': '测试类型最多50个字符',
    'any.required': '测试类型是必填项'
  }),
  assignee: Joi.string().max(50).required().messages({
    'string.max': '测试负责人最多50个字符',
    'any.required': '测试负责人是必填项'
  }),
  startTime: Joi.date().required().messages({
    'any.required': '开始时间是必填项'
  }),
  endTime: Joi.date().required().messages({
    'any.required': '结束时间是必填项'
  })
});

const updateTestPlanSchema = Joi.object({
  name: Joi.string().max(100).messages({
    'string.max': '计划名称最多100个字符'
  }),
  description: Joi.string().max(2000).messages({
    'string.max': '计划描述最多2000个字符'
  }),
  status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').messages({
    'any.only': '状态必须是 draft、active、completed 或 cancelled'
  }),
  testType: Joi.string().max(50).messages({
    'string.max': '测试类型最多50个字符'
  }),
  assignee: Joi.string().max(50).messages({
    'string.max': '测试负责人最多50个字符'
  }),
  startTime: Joi.date(),
  endTime: Joi.date()
});

/**
 * 创建测试计划
 * POST /api/test-plans
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = createTestPlanSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    // 创建测试计划
    const testPlan = new TestPlan({
      memberId: req.user._id,
      ...value,
      startTime: new Date(value.startTime),
      endTime: new Date(value.endTime)
    });

    await testPlan.save();

    return successResponse(res, testPlan, '测试计划创建成功', 201);
  } catch (error) {
    console.error('创建测试计划失败:', error);
    return serverErrorResponse(res, '创建测试计划失败');
  }
});

/**
 * 获取测试计划列表
 * GET /api/test-plans
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search
    };

    const result = await TestPlan.getTestPlanList(req.user._id, options);
    return successResponse(res, result);
  } catch (error) {
    console.error('获取测试计划列表失败:', error);
    return serverErrorResponse(res, '获取测试计划列表失败');
  }
});

/**
 * 获取测试计划详情
 * GET /api/test-plans/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testPlan = await TestPlan.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 更新统计信息
    await testPlan.updateStatistics();

    return successResponse(res, testPlan, '获取测试计划详情成功');
  } catch (error) {
    console.error('获取测试计划详情失败:', error);
    return serverErrorResponse(res, '获取测试计划详情失败');
  }
});

/**
 * 更新测试计划
 * PUT /api/test-plans/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证请求数据
    const { error, value } = updateTestPlanSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const testPlan = await TestPlan.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 更新测试计划
    Object.assign(testPlan, value);
    
    // 如果更新了时间字段，确保格式正确
    if (value.startTime) {
      testPlan.startTime = new Date(value.startTime);
    }
    if (value.endTime) {
      testPlan.endTime = new Date(value.endTime);
    }
    
    testPlan.updatedAt = new Date();
    await testPlan.save();

    return successResponse(res, testPlan, '测试计划更新成功');
  } catch (error) {
    console.error('更新测试计划失败:', error);
    return serverErrorResponse(res, '更新测试计划失败');
  }
});

/**
 * 删除测试计划
 * DELETE /api/test-plans/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testPlan = await TestPlan.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 检查是否有关联的测试用例
    const TestPlanTestCase = (await import('../models/TestPlanTestCase.js')).default;
    const testCaseCount = await TestPlanTestCase.countDocuments({
      testPlanId: id,
      memberId: req.user._id
    });

    if (testCaseCount > 0) {
      return errorResponse(res, `无法删除测试计划，该计划下还有 ${testCaseCount} 个测试用例`, 400);
    }

    await TestPlan.findByIdAndDelete(id);

    return successResponse(res, null, '测试计划删除成功');
  } catch (error) {
    console.error('删除测试计划失败:', error);
    return serverErrorResponse(res, '删除测试计划失败');
  }
});

/**
 * 获取测试计划统计信息
 * GET /api/test-plans/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await TestPlan.getTestPlanStatistics(req.user._id);
    return successResponse(res, statistics, '获取测试计划统计信息成功');
  } catch (error) {
    console.error('获取测试计划统计信息失败:', error);
    return serverErrorResponse(res, '获取测试计划统计信息失败');
  }
});

/**
 * 获取测试计划关联的测试用例
 * GET /api/test-plans/:id/related-cases
 */
router.get('/:id/related-cases', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 验证测试计划是否存在
    const testPlan = await TestPlan.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 获取关联的测试用例
    const TestPlanTestCase = (await import('../models/TestPlanTestCase.js')).default;
    const result = await TestPlanTestCase.getTestPlanCasesWithDetails(id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return successResponse(res, result, '获取关联测试用例成功');
  } catch (error) {
    console.error('获取关联测试用例失败:', error);
    return serverErrorResponse(res, '获取关联测试用例失败');
  }
});

/**
 * 关联测试用例到测试计划
 * POST /api/test-plans/:id/associate-cases
 */
router.post('/:id/associate-cases', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { caseIds } = req.body;

    // 验证测试计划是否存在
    const testPlan = await TestPlan.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 验证用例ID数组
    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return errorResponse(res, '请选择要关联的测试用例', 400);
    }

    // 获取TestCase和TestPlanTestCase模型
    const TestCase = (await import('../models/TestCase.js')).default;
    const TestPlanTestCase = (await import('../models/TestPlanTestCase.js')).default;

    // 验证用例是否存在且属于当前用户
    const testCases = await TestCase.find({
      _id: { $in: caseIds },
      memberId: req.user._id
    });

    if (testCases.length !== caseIds.length) {
      return errorResponse(res, '部分测试用例不存在或无权限访问', 400);
    }

    // 批量创建关联关系
    await TestPlanTestCase.batchCreateAssociations(id, caseIds, req.user._id);

    // 更新测试计划统计信息
    await testPlan.updateStatistics();

    return successResponse(res, {
      associatedCount: testCases.length
    }, `成功关联 ${testCases.length} 个测试用例`);
  } catch (error) {
    console.error('关联测试用例失败:', error);
    return serverErrorResponse(res, '关联测试用例失败');
  }
});

/**
 * 更新测试计划用例的执行结果
 * PUT /api/test-plans/:id/cases/:caseId/result
 */
router.put('/:id/cases/:caseId/result', authenticateToken, async (req, res) => {
  try {
    const { id: testPlanId, caseId } = req.params;
    const { result, executionDescription } = req.body;

    // 验证测试计划是否存在
    const testPlan = await TestPlan.findOne({
      _id: testPlanId,
      memberId: req.user._id
    });

    if (!testPlan) {
      return errorResponse(res, '测试计划不存在', 404);
    }

    // 验证结果值
    const validResults = ['pass', 'fail', 'blocked', 'skipped', 'notExecuted'];
    if (!validResults.includes(result)) {
      return errorResponse(res, '无效的执行结果', 400);
    }

    // 获取TestPlanTestCase模型
    const TestPlanTestCase = (await import('../models/TestPlanTestCase.js')).default;

    // 先查找现有的记录
    const existingRecord = await TestPlanTestCase.findOne({
      testPlanId,
      testCaseId: caseId,
      memberId: req.user._id
    });

    if (!existingRecord) {
      return errorResponse(res, '测试用例不存在或无权访问', 404);
    }

    // 更新用例结果
    existingRecord.result = result;
    existingRecord.executionDescription = executionDescription || '';
    existingRecord.executionCount = (existingRecord.executionCount || 0) + 1;
    existingRecord.lastExecutionTime = new Date();
    existingRecord.lastExecutor = req.user.username || req.user.email || '未知用户';
    
    await existingRecord.save();
    
    const testPlanTestCase = existingRecord;

    if (!testPlanTestCase) {
      return errorResponse(res, '测试用例不存在或无权访问', 404);
    }

    // 更新测试计划统计信息
    await testPlan.updateStatistics();

    return successResponse(res, testPlanTestCase, '用例执行结果更新成功');
  } catch (error) {
    console.error('更新用例执行结果失败:', error);
    return serverErrorResponse(res, '更新用例执行结果失败');
  }
});

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import TestPlan from '../models/TestPlan.js';
import Joi from 'joi';

const router = express.Router();

// 数据验证schema
const createTestPlanSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': '计划名称不能为空',
    'string.min': '计划名称至少1个字符',
    'string.max': '计划名称最多100个字符',
    'any.required': '计划名称是必填项'
  }),
  description: Joi.string().trim().max(2000).allow('').optional().messages({
    'string.max': '计划描述最多2000个字符'
  }),
  status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').default('draft').messages({
    'any.only': '状态必须是 draft、active、completed 或 cancelled'
  }),
  testType: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': '测试类型不能为空',
    'string.min': '测试类型至少1个字符',
    'string.max': '测试类型最多50个字符',
    'any.required': '测试类型是必填项'
  }),
  assignee: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': '测试负责人不能为空',
    'string.min': '测试负责人至少1个字符',
    'string.max': '测试负责人最多50个字符',
    'any.required': '测试负责人是必填项'
  }),
  startTime: Joi.date().required().messages({
    'any.required': '开始时间是必填项',
    'date.base': '开始时间格式不正确'
  }),
  endTime: Joi.date().greater(Joi.ref('startTime')).required().messages({
    'any.required': '结束时间是必填项',
    'date.base': '结束时间格式不正确',
    'date.greater': '结束时间必须晚于开始时间'
  })
});

const updateTestPlanSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': '计划名称不能为空',
    'string.min': '计划名称至少1个字符',
    'string.max': '计划名称最多100个字符'
  }),
  description: Joi.string().trim().max(2000).allow('').optional().messages({
    'string.max': '计划描述最多2000个字符'
  }),
  status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').optional().messages({
    'any.only': '状态必须是 draft、active、completed 或 cancelled'
  }),
  testType: Joi.string().trim().min(1).max(50).optional().messages({
    'string.empty': '测试类型不能为空',
    'string.min': '测试类型至少1个字符',
    'string.max': '测试类型最多50个字符'
  }),
  assignee: Joi.string().trim().min(1).max(50).optional().messages({
    'string.empty': '测试负责人不能为空',
    'string.min': '测试负责人至少1个字符',
    'string.max': '测试负责人最多50个字符'
  }),
  startTime: Joi.date().optional().messages({
    'date.base': '开始时间格式不正确'
  }),
  endTime: Joi.date().optional().messages({
    'date.base': '结束时间格式不正确'
  })
}).custom((value, helpers) => {
  // 如果同时提供了开始时间和结束时间，验证结束时间晚于开始时间
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    return helpers.error('date.greater');
  }
  return value;
}, 'validate date range');

/**
 * 获取测试计划列表
 * GET /api/test-plans
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
      sortBy,
      sortOrder
    };

    const result = await TestPlan.getTestPlanList(req.user._id, options);
    const statistics = await TestPlan.getTestPlanStatistics(req.user._id);

    return successResponse(res, {
      testPlans: result.testPlans,
      pagination: result.pagination,
      statistics
    }, '获取测试计划列表成功');
  } catch (error) {
    console.error('获取测试计划列表失败:', error);
    return serverErrorResponse(res, '获取测试计划列表失败');
  }
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

    const {
      name,
      description,
      status,
      testType,
      assignee,
      startTime,
      endTime
    } = value;

    // 创建测试计划
    const testPlan = new TestPlan({
      memberId: req.user._id,
      name,
      description,
      status,
      testType,
      assignee,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    await testPlan.save();

    return successResponse(res, testPlan, '测试计划创建成功');
  } catch (error) {
    console.error('创建测试计划失败:', error);
    return serverErrorResponse(res, '创建测试计划失败');
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
    const TestCase = (await import('../models/TestCase.js')).default;
    const testCaseCount = await TestCase.countDocuments({
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
    const TestCase = (await import('../models/TestCase.js')).default;
    const TestCaseDirectory = (await import('../models/TestCaseDirectory.js')).default;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const testCases = await TestCase.find({
      testPlanId: id,
      memberId: req.user._id
    })
    .populate('directoryId', 'name path')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    // 处理数据格式
    const formattedCases = testCases.map(testCase => {
      const directoryPath = testCase.directoryId ? 
        testCase.directoryId.path.split('/').filter(Boolean) : [];
      
      // 根据执行结果确定最终结果
      let result = 'notExecuted';
      if (testCase.result && testCase.result.success !== undefined) {
        result = testCase.result.success ? 'pass' : 'fail';
      }
      
      // 根据状态确定用例等级（这里可以根据实际业务逻辑调整）
      let level = '中';
      if (testCase.status === 'completed' && testCase.result && testCase.result.success) {
        level = '高';
      } else if (testCase.status === 'failed') {
        level = '低';
      }
      
      return {
        id: testCase._id.toString(),
        title: testCase.title,
        status: testCase.status,
        assignee: testCase.assignee || '未分配',
        updatedAt: testCase.updatedAt,
        directoryPath: directoryPath,
        level: level,
        result: result,
        executionCount: 1, // 默认值，实际应该从执行历史中统计
        relatedBugs: '', // 默认值，实际应该从Bug关联中获取
        lastExecutor: testCase.assignee || '未分配',
        lastExecutionTime: testCase.completedAt || testCase.updatedAt
      };
    });

    const total = await TestCase.countDocuments({
      testPlanId: id,
      memberId: req.user._id
    });

    return successResponse(res, {
      testCases: formattedCases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }, '获取关联测试用例成功');
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

    // 获取TestCase模型
    const TestCase = (await import('../models/TestCase.js')).default;

    // 验证用例是否存在且属于当前用户
    const testCases = await TestCase.find({
      _id: { $in: caseIds },
      memberId: req.user._id
    });

    if (testCases.length !== caseIds.length) {
      return errorResponse(res, '部分测试用例不存在或无权限访问', 400);
    }

    // 更新用例的testPlanId
    await TestCase.updateMany(
      { _id: { $in: caseIds } },
      { testPlanId: id }
    );

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

export default router;

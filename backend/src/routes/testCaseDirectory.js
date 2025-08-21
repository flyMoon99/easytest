import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import TestCaseDirectory from '../models/TestCaseDirectory.js';
import Joi from 'joi';

const router = express.Router();

// 数据验证schema
const createDirectorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': '目录名称不能为空',
    'string.min': '目录名称至少1个字符',
    'string.max': '目录名称最多100个字符',
    'any.required': '目录名称是必填项'
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': '目录描述最多500个字符'
  }),
  parentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional().messages({
    'string.pattern.base': '父目录ID格式不正确'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': '颜色格式不正确，请使用#RRGGBB格式'
  }),
  icon: Joi.string().max(50).optional().messages({
    'string.max': '图标名称最多50个字符'
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.min': '排序顺序不能为负数'
  })
});

const updateDirectorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': '目录名称不能为空',
    'string.min': '目录名称至少1个字符',
    'string.max': '目录名称最多100个字符'
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': '目录描述最多500个字符'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': '颜色格式不正确，请使用#RRGGBB格式'
  }),
  icon: Joi.string().max(50).optional().messages({
    'string.max': '图标名称最多50个字符'
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.min': '排序顺序不能为负数'
  }),
  status: Joi.string().valid('active', 'archived').optional().messages({
    'any.only': '状态只能是active或archived'
  })
});

const moveDirectorySchema = Joi.object({
  parentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).required().messages({
    'string.pattern.base': '父目录ID格式不正确',
    'any.required': '父目录ID是必填项'
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.min': '排序顺序不能为负数'
  })
});

/**
 * 获取目录树结构
 * GET /api/test-directories
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { includeArchived = 'false' } = req.query;
    const includeArchivedBool = includeArchived === 'true';
    
    const directoryTree = await TestCaseDirectory.getDirectoryTree(
      req.user._id,
      includeArchivedBool
    );
    
    return successResponse(res, {
      directories: directoryTree,
      total: directoryTree.length
    }, '获取目录树成功');
    
  } catch (error) {
    console.error('获取目录树失败:', error);
    return serverErrorResponse(res, '获取目录树失败', error);
  }
});

/**
 * 创建新目录
 * POST /api/test-directories
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('创建目录 - 请求数据:', req.body);
    
    // 数据验证
    const { error, value } = createDirectorySchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }
    
    const { name, description, parentId, color, icon, sortOrder } = value;
    console.log('创建目录 - 验证后的数据:', { name, description, parentId, color, icon, sortOrder });
    
    // 检查父目录是否存在且属于当前用户
    if (parentId) {
      const parentDirectory = await TestCaseDirectory.findOne({
        _id: parentId,
        memberId: req.user._id,
        status: { $ne: 'deleted' }
      });
      
      if (!parentDirectory) {
        return errorResponse(res, '父目录不存在或无权限访问', 404);
      }
      
      // 检查层级深度限制
      if (parentDirectory.level >= 9) {
        return errorResponse(res, '目录层级不能超过10层', 400);
      }
    }
    
    // 检查同级目录名称是否重复
    const isDuplicate = await TestCaseDirectory.checkNameDuplicate(
      req.user._id,
      name,
      parentId
    );
    
    if (isDuplicate) {
      return errorResponse(res, '同级目录下已存在相同名称的目录', 409);
    }
    
    // 创建目录
    const directory = new TestCaseDirectory({
      memberId: req.user._id,
      name,
      description: description || '',
      parentId: parentId || null,
      color: color || '#1f2937',
      icon: icon || 'folder',
      sortOrder: sortOrder || 0
    });
    
    await directory.save();
    
    // 返回创建的目录信息
    const populatedDirectory = await TestCaseDirectory.findById(directory._id)
      .populate('parent', 'name path');
    
    return successResponse(res, populatedDirectory, '创建目录成功', 201);
    
  } catch (error) {
    console.error('创建目录失败:', error);
    return serverErrorResponse(res, '创建目录失败', error);
  }
});

/**
 * 获取目录详情
 * GET /api/test-directories/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const directory = await TestCaseDirectory.findOne({
      _id: id,
      memberId: req.user._id,
      status: { $ne: 'deleted' }
    })
    .populate('parent', 'name path')
    .populate('children', 'name description path level sortOrder statistics status color icon');
    
    if (!directory) {
      return errorResponse(res, '目录不存在或无权限访问', 404);
    }
    
    return successResponse(res, directory, '获取目录详情成功');
    
  } catch (error) {
    console.error('获取目录详情失败:', error);
    return serverErrorResponse(res, '获取目录详情失败', error);
  }
});

/**
 * 更新目录信息
 * PUT /api/test-directories/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 数据验证
    const { error, value } = updateDirectorySchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }
    
    // 查找目录
    const directory = await TestCaseDirectory.findOne({
      _id: id,
      memberId: req.user._id,
      status: { $ne: 'deleted' }
    });
    
    if (!directory) {
      return errorResponse(res, '目录不存在或无权限访问', 404);
    }
    
    // 如果更新名称，检查是否重复
    if (value.name && value.name !== directory.name) {
      const isDuplicate = await TestCaseDirectory.checkNameDuplicate(
        req.user._id,
        value.name,
        directory.parentId,
        directory._id
      );
      
      if (isDuplicate) {
        return errorResponse(res, '同级目录下已存在相同名称的目录', 409);
      }
    }
    
    // 更新目录信息
    Object.assign(directory, value);
    await directory.save();
    
    // 返回更新后的目录信息
    const updatedDirectory = await TestCaseDirectory.findById(directory._id)
      .populate('parent', 'name path');
    
    return successResponse(res, updatedDirectory, '更新目录成功');
    
  } catch (error) {
    console.error('更新目录失败:', error);
    return serverErrorResponse(res, '更新目录失败', error);
  }
});

/**
 * 删除目录
 * DELETE /api/test-directories/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { force = 'false' } = req.query;
    const forceDelete = force === 'true';
    
    // 查找目录
    const directory = await TestCaseDirectory.findOne({
      _id: id,
      memberId: req.user._id,
      status: { $ne: 'deleted' }
    });
    
    if (!directory) {
      return errorResponse(res, '目录不存在或无权限访问', 404);
    }
    
    // 检查是否有子目录
    const hasChildren = await TestCaseDirectory.countDocuments({
      parentId: id,
      status: { $ne: 'deleted' }
    });
    
    if (hasChildren > 0 && !forceDelete) {
      return errorResponse(res, '目录下存在子目录，请先删除子目录或使用强制删除', 400);
    }
    
    if (forceDelete) {
      // 强制删除：递归删除所有子目录
      await directory.deleteOne();
    } else {
      // 软删除：标记为已删除
      directory.status = 'deleted';
      await directory.save();
    }
    
    return successResponse(res, { id }, '删除目录成功');
    
  } catch (error) {
    console.error('删除目录失败:', error);
    return serverErrorResponse(res, '删除目录失败', error);
  }
});

/**
 * 移动目录
 * POST /api/test-directories/:id/move
 */
router.post('/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 数据验证
    const { error, value } = moveDirectorySchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }
    
    const { parentId, sortOrder } = value;
    
    // 查找要移动的目录
    const directory = await TestCaseDirectory.findOne({
      _id: id,
      memberId: req.user._id,
      status: { $ne: 'deleted' }
    });
    
    if (!directory) {
      return errorResponse(res, '目录不存在或无权限访问', 404);
    }
    
    // 检查新父目录
    if (parentId) {
      const newParent = await TestCaseDirectory.findOne({
        _id: parentId,
        memberId: req.user._id,
        status: { $ne: 'deleted' }
      });
      
      if (!newParent) {
        return errorResponse(res, '目标父目录不存在或无权限访问', 404);
      }
      
      // 检查是否会形成循环引用
      if (parentId === id) {
        return errorResponse(res, '不能将目录移动到自身', 400);
      }
      
      // 检查是否移动到自己的子目录（避免循环引用）
      let current = newParent;
      while (current.parentId) {
        if (current.parentId.toString() === id) {
          return errorResponse(res, '不能将目录移动到自己的子目录下', 400);
        }
        current = await TestCaseDirectory.findById(current.parentId);
        if (!current) break;
      }
      
      // 检查层级深度限制
      if (newParent.level >= 9) {
        return errorResponse(res, '移动后目录层级不能超过10层', 400);
      }
    }
    
    // 检查目标位置是否已存在同名目录
    const isDuplicate = await TestCaseDirectory.checkNameDuplicate(
      req.user._id,
      directory.name,
      parentId,
      directory._id
    );
    
    if (isDuplicate) {
      return errorResponse(res, '目标位置已存在相同名称的目录', 409);
    }
    
    // 更新目录位置
    directory.parentId = parentId;
    if (sortOrder !== undefined) {
      directory.sortOrder = sortOrder;
    }
    
    await directory.save();
    
    // 返回更新后的目录信息
    const updatedDirectory = await TestCaseDirectory.findById(directory._id)
      .populate('parent', 'name path');
    
    return successResponse(res, updatedDirectory, '移动目录成功');
    
  } catch (error) {
    console.error('移动目录失败:', error);
    return serverErrorResponse(res, '移动目录失败', error);
  }
});

/**
 * 获取目录统计信息
 * GET /api/test-directories/:id/statistics
 */
router.get('/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找目录
    const directory = await TestCaseDirectory.findOne({
      _id: id,
      memberId: req.user._id,
      status: { $ne: 'deleted' }
    });
    
    if (!directory) {
      return errorResponse(res, '目录不存在或无权限访问', 404);
    }
    
    // 更新统计信息
    await directory.updateStatistics();
    
    // 获取子目录统计
    const childStats = await TestCaseDirectory.aggregate([
      {
        $match: {
          parentId: directory._id,
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: null,
          totalDirectories: { $sum: 1 },
          totalCases: { $sum: '$statistics.totalCases' },
          completedCases: { $sum: '$statistics.completedCases' },
          pendingCases: { $sum: '$statistics.pendingCases' },
          failedCases: { $sum: '$statistics.failedCases' }
        }
      }
    ]);
    
    const stats = {
      directory: {
        totalCases: directory.statistics.totalCases,
        completedCases: directory.statistics.completedCases,
        pendingCases: directory.statistics.pendingCases,
        failedCases: directory.statistics.failedCases,
        completionRate: directory.statistics.totalCases > 0 
          ? Math.round((directory.statistics.completedCases / directory.statistics.totalCases) * 100)
          : 0
      },
      children: childStats[0] || {
        totalDirectories: 0,
        totalCases: 0,
        completedCases: 0,
        pendingCases: 0,
        failedCases: 0
      }
    };
    
    return successResponse(res, stats, '获取目录统计信息成功');
    
  } catch (error) {
    console.error('获取目录统计信息失败:', error);
    return serverErrorResponse(res, '获取目录统计信息失败', error);
  }
});

/**
 * 批量更新目录排序
 * PUT /api/test-directories/batch/sort
 */
router.put('/batch/sort', authenticateToken, async (req, res) => {
  try {
    const { directories } = req.body;
    
    if (!Array.isArray(directories) || directories.length === 0) {
      return errorResponse(res, '目录排序数据格式不正确', 400);
    }
    
    // 验证数据格式
    const sortSchema = Joi.array().items(
      Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        sortOrder: Joi.number().integer().min(0).required()
      })
    );
    
    const { error } = sortSchema.validate(directories);
    if (error) {
      return errorResponse(res, '目录排序数据格式不正确', 400);
    }
    
    // 批量更新排序
    const updatePromises = directories.map(({ id, sortOrder }) =>
      TestCaseDirectory.updateOne(
        { 
          _id: id, 
          memberId: req.user._id,
          status: { $ne: 'deleted' }
        },
        { 
          sortOrder,
          updatedAt: new Date()
        }
      )
    );
    
    await Promise.all(updatePromises);
    
    return successResponse(res, { updated: directories.length }, '批量更新排序成功');
    
  } catch (error) {
    console.error('批量更新排序失败:', error);
    return serverErrorResponse(res, '批量更新排序失败', error);
  }
});

export default router;

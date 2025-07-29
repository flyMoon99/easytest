import express from 'express';
import { generateToken } from '../config/jwt.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { authenticateToken, getClientIp, getUserAgent } from '../middleware/auth.js';
import Member from '../models/Member.js';
import LoginHistory from '../models/LoginHistory.js';

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, phone, password, nickname } = req.body;
    
    // 检查邮箱是否已存在
    const existingEmail = await Member.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponse(res, '该邮箱已被注册', 409);
    }
    
    // 检查手机号是否已存在
    const existingPhone = await Member.findOne({ phone });
    if (existingPhone) {
      return errorResponse(res, '该手机号已被注册', 409);
    }
    
    // 生成会员ID
    const memberId = Member.generateMemberId();
    
    // 创建新用户
    const newMember = new Member({
      email: email.toLowerCase(),
      phone,
      memberId,
      password,
      nickname: nickname || `用户${memberId.slice(-4)}`,
      status: 'active'
    });
    
    await newMember.save();
    
    // 生成JWT令牌
    const token = generateToken({
      userId: newMember._id,
      email: newMember.email,
      memberId: newMember.memberId
    });
    
    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: newMember._id,
      email: newMember.email,
      phone: newMember.phone,
      memberId: newMember.memberId,
      nickname: newMember.nickname,
      status: newMember.status,
      createdAt: newMember.createdAt
    };
    
    return successResponse(res, {
      user: userResponse,
      token
    }, '注册成功', 201);
    
  } catch (error) {
    console.error('注册错误:', error);
    return serverErrorResponse(res, '注册失败', error);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);
    
    // 查找用户（包含密码字段）
    const user = await Member.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, '邮箱或密码错误', 401);
    }
    
    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // 记录失败的登录尝试
      await LoginHistory.create({
        memberId: user._id,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: '密码错误'
      });
      
      return errorResponse(res, '邮箱或密码错误', 401);
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      return errorResponse(res, '账户已被禁用', 403);
    }
    
    // 更新最后登录信息
    await user.updateLastLogin(ipAddress);
    
    // 记录成功的登录历史
    await LoginHistory.create({
      memberId: user._id,
      ipAddress,
      userAgent,
      status: 'success'
    });
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user._id,
      email: user.email,
      memberId: user.memberId
    });
    
    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      memberId: user.memberId,
      nickname: user.nickname,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
    
    return successResponse(res, {
      user: userResponse,
      token
    }, '登录成功');
    
  } catch (error) {
    console.error('登录错误:', error);
    return serverErrorResponse(res, '登录失败', error);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // 获取用户登录统计
    const loginStats = await LoginHistory.getLoginStats(user._id, 30);
    
    const userResponse = {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      memberId: user.memberId,
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      statusText: user.statusText,
      registerDays: user.registerDays,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      loginStats: loginStats
    };
    
    return successResponse(res, userResponse, '获取用户信息成功');
    
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return serverErrorResponse(res, '获取用户信息失败', error);
  }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 记录登出历史
    await LoginHistory.create({
      memberId: req.user._id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      status: 'success',
      loginMethod: 'logout'
    });
    
    return successResponse(res, null, '登出成功');
    
  } catch (error) {
    console.error('登出错误:', error);
    return serverErrorResponse(res, '登出失败', error);
  }
});

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // 生成新的JWT令牌
    const newToken = generateToken({
      userId: user._id,
      email: user.email,
      memberId: user.memberId
    });
    
    return successResponse(res, {
      token: newToken
    }, '令牌刷新成功');
    
  } catch (error) {
    console.error('刷新令牌错误:', error);
    return serverErrorResponse(res, '刷新令牌失败', error);
  }
});

/**
 * 获取登录历史
 * GET /api/auth/login-history
 */
router.get('/login-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const loginHistory = await LoginHistory.find({ memberId: req.user._id })
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('memberId', 'email memberId nickname');
    
    const total = await LoginHistory.countDocuments({ memberId: req.user._id });
    
    return successResponse(res, {
      loginHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, '获取登录历史成功');
    
  } catch (error) {
    console.error('获取登录历史错误:', error);
    return serverErrorResponse(res, '获取登录历史失败', error);
  }
});

export default router; 
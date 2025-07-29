import { verifyToken } from '../config/jwt.js';
import { authErrorResponse, forbiddenResponse } from '../utils/response.js';
import Member from '../models/Member.js';

/**
 * JWT认证中间件
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return authErrorResponse(res, '访问令牌缺失');
    }
    
    // 验证JWT令牌
    const decoded = verifyToken(token);
    
    // 查找用户
    const user = await Member.findById(decoded.userId).select('-password');
    if (!user) {
      return authErrorResponse(res, '用户不存在');
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      return forbiddenResponse(res, '账户已被禁用');
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
    
  } catch (error) {
    return authErrorResponse(res, '无效的访问令牌');
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // 没有令牌也继续执行
    }
    
    const decoded = verifyToken(token);
    const user = await Member.findById(decoded.userId).select('-password');
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // 令牌无效但不阻止请求继续
    next();
  }
};

/**
 * 角色验证中间件
 * @param {Array} roles - 允许的角色数组
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return authErrorResponse(res, '需要登录');
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return forbiddenResponse(res, '权限不足');
    }
    
    next();
  };
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return authErrorResponse(res, '需要登录');
  }
  
  if (req.user.role !== 'admin') {
    return forbiddenResponse(res, '需要管理员权限');
  }
  
  next();
};

/**
 * 获取客户端IP地址
 */
export const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

/**
 * 获取用户代理信息
 */
export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  getClientIp,
  getUserAgent
}; 
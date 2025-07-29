/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 * @param {object} res - Express响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - 状态码
 */
export const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 错误响应
 * @param {object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - 状态码
 * @param {any} error - 错误详情
 */
export const errorResponse = (res, message = '操作失败', statusCode = 400, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * 验证错误响应
 * @param {object} res - Express响应对象
 * @param {Array} errors - 验证错误数组
 */
export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: '数据验证失败',
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * 认证错误响应
 * @param {object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const authErrorResponse = (res, message = '认证失败') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 权限错误响应
 * @param {object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const forbiddenResponse = (res, message = '权限不足') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 资源不存在响应
 * @param {object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const notFoundResponse = (res, message = '资源不存在') => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 服务器错误响应
 * @param {object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {any} error - 错误详情
 */
export const serverErrorResponse = (res, message = '服务器内部错误', error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message || error;
  }
  
  return res.status(500).json(response);
};

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  authErrorResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse
}; 
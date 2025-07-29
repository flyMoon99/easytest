import Joi from 'joi';
import { validationErrorResponse } from '../utils/response.js';

/**
 * 通用验证中间件
 * @param {object} schema - Joi验证模式
 * @returns {function} Express中间件函数
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return validationErrorResponse(res, errors);
    }
    
    req.body = value;
    next();
  };
};

/**
 * 用户注册验证模式
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '请输入有效的手机号码',
      'any.required': '手机号是必填项'
    }),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .required()
    .messages({
      'string.min': '密码至少6位',
      'string.max': '密码最多50位',
      'string.pattern.base': '密码应包含字母、数字和特殊字符',
      'any.required': '密码是必填项'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '两次输入的密码不一致',
      'any.required': '请确认密码'
    }),
  
  nickname: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '昵称最多50个字符'
    })
});

/**
 * 用户登录验证模式
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码是必填项'
    })
});

/**
 * 密码重置验证模式
 */
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    })
});

/**
 * 用户信息更新验证模式
 */
export const updateProfileSchema = Joi.object({
  nickname: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '昵称最多50个字符'
    }),
  
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': '请输入有效的手机号码'
    }),
  
  avatar: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': '头像URL格式不正确'
    })
});

/**
 * 分页查询验证模式
 */
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码最小为1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量最小为1',
      'number.max': '每页数量最大为100'
    }),
  
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'lastLoginAt')
    .default('createdAt')
    .messages({
      'any.only': '排序字段只能是 createdAt, updatedAt, lastLoginAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序顺序只能是 asc 或 desc'
    })
});

export default {
  validate,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
  paginationSchema
}; 
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * 加密密码
 * @param {string} password - 原始密码
 * @returns {Promise<string>} 加密后的密码
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('密码加密失败');
  }
};

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<boolean>} 验证结果
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('密码验证失败');
  }
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {object} 验证结果
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('密码至少6位');
  }
  
  if (password.length > 50) {
    errors.push('密码最多50位');
  }
  
  // 检查是否包含数字
  if (!/\d/.test(password)) {
    errors.push('密码应包含数字');
  }
  
  // 检查是否包含字母
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码应包含字母');
  }
  
  // 检查是否包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码应包含特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : 'weak'
  };
};

export default {
  hashPassword,
  comparePassword,
  validatePasswordStrength
}; 
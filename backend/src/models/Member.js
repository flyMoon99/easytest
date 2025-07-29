import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const memberSchema = new mongoose.Schema({
  // 基础信息
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  
  phone: {
    type: String,
    required: [true, '手机号是必填项'],
    unique: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  
  memberId: {
    type: String,
    required: [true, '会员ID是必填项'],
    unique: true,
    trim: true,
    minlength: [6, '会员ID至少6位'],
    maxlength: [20, '会员ID最多20位']
  },
  
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码至少6位'],
    select: false // 查询时默认不返回密码字段
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    required: true
  },
  
  // 用户信息
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, '昵称最多50个字符']
  },
  
  avatar: {
    type: String,
    default: ''
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // 最后登录信息
  lastLoginAt: {
    type: Date
  },
  
  lastLoginIp: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：用户状态文本
memberSchema.virtual('statusText').get(function() {
  const statusMap = {
    active: '正常',
    inactive: '未激活',
    suspended: '已暂停'
  };
  return statusMap[this.status] || '未知';
});

// 虚拟字段：注册天数
memberSchema.virtual('registerDays').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 密码加密中间件
memberSchema.pre('save', async function(next) {
  // 只有在密码被修改时才重新加密
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
memberSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 更新最后登录信息
memberSchema.methods.updateLastLogin = function(ipAddress) {
  this.lastLoginAt = new Date();
  this.lastLoginIp = ipAddress;
  return this.save();
};

// 生成会员ID的静态方法
memberSchema.statics.generateMemberId = function() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ET${timestamp.slice(-6)}${random}`;
};

// 索引优化
memberSchema.index({ email: 1 });
memberSchema.index({ phone: 1 });
memberSchema.index({ memberId: 1 });
memberSchema.index({ status: 1 });
memberSchema.index({ createdAt: -1 });

const Member = mongoose.model('Member', memberSchema);

export default Member; 
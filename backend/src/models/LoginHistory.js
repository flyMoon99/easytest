import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 登录信息
  loginTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  ipAddress: {
    type: String,
    required: [true, 'IP地址是必填项'],
    trim: true
  },
  
  userAgent: {
    type: String,
    required: [true, '用户代理是必填项'],
    trim: true
  },
  
  // 登录状态
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
    default: 'success'
  },
  
  // 失败原因（仅在登录失败时记录）
  failureReason: {
    type: String,
    trim: true,
    maxlength: [200, '失败原因最多200个字符']
  },
  
  // 地理位置信息（可选）
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  
  // 设备信息
  device: {
    type: String, // mobile, desktop, tablet
    enum: ['mobile', 'desktop', 'tablet', 'unknown']
  },
  
  // 浏览器信息
  browser: {
    name: String,
    version: String
  },
  
  // 操作系统信息
  os: {
    name: String,
    version: String
  },
  
  // 会话信息
  sessionId: {
    type: String,
    trim: true
  },
  
  // 登录方式
  loginMethod: {
    type: String,
    enum: ['password', 'token', 'oauth'],
    default: 'password'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：登录状态文本
loginHistorySchema.virtual('statusText').get(function() {
  return this.status === 'success' ? '成功' : '失败';
});

// 虚拟字段：登录时间格式化
loginHistorySchema.virtual('loginTimeFormatted').get(function() {
  return this.loginTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// 虚拟字段：IP地址脱敏
loginHistorySchema.virtual('ipAddressMasked').get(function() {
  if (!this.ipAddress) return '';
  const parts = this.ipAddress.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return this.ipAddress;
});

// 静态方法：获取用户登录历史
loginHistorySchema.statics.getUserLoginHistory = function(memberId, limit = 10) {
  return this.find({ memberId })
    .sort({ loginTime: -1 })
    .limit(limit)
    .populate('memberId', 'email memberId nickname');
};

// 静态方法：获取登录统计
loginHistorySchema.statics.getLoginStats = function(memberId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        memberId: new mongoose.Types.ObjectId(memberId),
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$loginTime" }
        },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
        },
        totalCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// 静态方法：清理旧记录
loginHistorySchema.statics.cleanOldRecords = function(days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    loginTime: { $lt: cutoffDate }
  });
};

// 索引优化
loginHistorySchema.index({ memberId: 1, loginTime: -1 });
loginHistorySchema.index({ loginTime: -1 });
loginHistorySchema.index({ status: 1 });
loginHistorySchema.index({ ipAddress: 1 });
loginHistorySchema.index({ createdAt: -1 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

export default LoginHistory; 
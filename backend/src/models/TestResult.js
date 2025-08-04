import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 关联视频
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: [true, '视频ID是必填项'],
    index: true
  },
  
  // 问题描述
  issue: {
    type: String,
    required: [true, '问题描述是必填项'],
    trim: true,
    minlength: [1, '问题描述至少1个字符'],
    maxlength: [1000, '问题描述最多1000个字符']
  },
  
  // 影响说明
  impact: {
    type: String,
    required: [true, '影响说明是必填项'],
    trim: true,
    minlength: [1, '影响说明至少1个字符'],
    maxlength: [1000, '影响说明最多1000个字符']
  },
  
  // 改进建议
  recommendation: {
    type: String,
    required: [true, '改进建议是必填项'],
    trim: true,
    minlength: [1, '改进建议至少1个字符'],
    maxlength: [1000, '改进建议最多1000个字符']
  },
  
  // 紧急程度
  severity: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
    required: true,
    index: true
  },
  
  // 类别
  category: {
    type: String,
    required: [true, '类别是必填项'],
    trim: true,
    enum: ['功能测试', 'UI测试', '性能测试', '兼容性测试', '安全测试', '其他'],
    default: '其他'
  },
  
  // 状态（是否处理）
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // 处理备注
  processingNote: {
    type: String,
    trim: true,
    maxlength: [500, '处理备注最多500个字符']
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  processedAt: {
    type: Date
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
testResultSchema.index({ memberId: 1, createdAt: -1 });
testResultSchema.index({ videoId: 1, createdAt: -1 });
testResultSchema.index({ severity: 1, createdAt: -1 });
testResultSchema.index({ status: 1, createdAt: -1 });
testResultSchema.index({ category: 1, createdAt: -1 });
testResultSchema.index({ memberId: 1, status: 1 });
testResultSchema.index({ memberId: 1, severity: 1 });

// 实例方法
testResultSchema.methods.updateStatus = function(status, note = '') {
  this.status = status;
  this.updatedAt = new Date();
  
  if (status === 'completed') {
    this.processedAt = new Date();
    this.processingNote = note;
  }
  
  return this.save();
};

// 静态方法
testResultSchema.statics.getStatistics = async function(memberId) {
  const stats = await this.aggregate([
    { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  result.completionRate = result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
  
  return result;
};

// 中间件
testResultSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TestResult = mongoose.model('TestResult', testResultSchema);

export default TestResult; 
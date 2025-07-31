import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 基础信息
  title: {
    type: String,
    required: [true, '测试标题是必填项'],
    trim: true,
    minlength: [5, '测试标题至少5个字符'],
    maxlength: [100, '测试标题最多100个字符']
  },
  
  entryUrl: {
    type: String,
    required: [true, '测试入口URL是必填项'],
    trim: true,
    match: [/^https?:\/\/.+/, '请输入有效的URL地址']
  },
  
  description: {
    type: String,
    required: [true, '测试内容描述是必填项'],
    trim: true,
    minlength: [5, '测试描述至少5个字符'],
    maxlength: [2000, '测试描述最多2000个字符']
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['pending', 'screened', 'analyzed', 'completed', 'failed'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // 截图地址
  screenshotUrl: {
    type: String,
    default: '',
    trim: true
  },
  
  // 执行结果
  result: {
    success: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    errorDetails: {
      type: String,
      default: ''
    }
  },
  
  // 执行时间信息
  duration: {
    type: Number, // 执行时长（毫秒）
    default: 0
  },
  
  startedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  // 生成的脚本信息
  playwrightScripts: [{
    step: {
      type: Number,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    selector: String,
    value: String,
    description: String,
    explanation: String, // AI生成的操作说明
    screenshot: String,
    timestamp: Number
  }],
  
  // AI分析结果
  aiAnalysis: {
    analysis: {
      type: String,
      default: ''
    },
    aiModel: {
      type: String,
      default: ''
    },
    testType: {
      type: String,
      default: ''
    },
    analyzedAt: {
      type: Date
    }
  },
  
  // 录屏文件
  videoUrl: {
    type: String,
    default: ''
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
testCaseSchema.index({ memberId: 1, createdAt: -1 });
testCaseSchema.index({ status: 1, createdAt: -1 });
testCaseSchema.index({ memberId: 1, status: 1 });

// 实例方法
testCaseSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  this.updatedAt = new Date();
  
  if (status === 'screened') {
    this.startedAt = new Date();
  } else if (status === 'completed' || status === 'failed') {
    this.completedAt = new Date();
    if (this.startedAt) {
      this.duration = this.completedAt - this.startedAt;
    }
  }
  
  // 合并额外数据
  Object.assign(this, additionalData);
  
  return this.save();
};

// 静态方法
testCaseSchema.statics.getStatistics = async function(memberId) {
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
    screened: 0,
    analyzed: 0,
    completed: 0,
    failed: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  result.successRate = result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
  
  return result;
};

// 中间件
testCaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;
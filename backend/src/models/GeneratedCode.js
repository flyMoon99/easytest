import mongoose from 'mongoose';

const generatedCodeSchema = new mongoose.Schema({
  // 关联测试用例
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    required: [true, '测试用例ID是必填项'],
    index: true
  },
  
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 代码内容
  codeContent: {
    // 完整测试代码
    fullScript: {
      type: String,
      required: [true, '完整测试代码是必填项']
    },
    
    // 测试函数代码
    testFunction: {
      type: String,
      default: ''
    },
    
    // 设置代码
    setupCode: {
      type: String,
      default: ''
    },
    
    // 清理代码
    teardownCode: {
      type: String,
      default: ''
    },
    
    // 依赖项
    dependencies: [{
      type: String
    }]
  },
  
  // 版本管理
  version: {
    major: {
      type: Number,
      required: true,
      default: 1
    },
    minor: {
      type: Number,
      required: true,
      default: 0
    },
    patch: {
      type: Number,
      required: true,
      default: 0
    },
    full: {
      type: String,
      required: true,
      default: '1.0.0'
    }
  },
  
  // 代码元数据
  metadata: {
    // 生成使用的AI模型
    aiModel: {
      type: String,
      required: [true, 'AI模型是必填项']
    },
    
    // 使用的提示词
    prompt: {
      type: String,
      default: ''
    },
    
    // 代码质量评分
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // 代码复杂度
    complexity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 预估执行时间（秒）
    estimatedDuration: {
      type: Number,
      default: 30
    },
    
    // 代码行数
    lineCount: {
      type: Number,
      default: 0
    },
    
    // 代码大小（字节）
    size: {
      type: Number,
      default: 0
    }
  },
  
  // 优化历史
  optimizationHistory: [{
    version: {
      type: String,
      required: true
    },
    changes: {
      type: String,
      required: true
    },
    improvedAt: {
      type: Date,
      default: Date.now
    },
    aiModel: {
      type: String,
      required: true
    },
    beforeScore: {
      type: Number,
      min: 0,
      max: 100
    },
    afterScore: {
      type: Number,
      min: 0,
      max: 100
    },
    improvement: {
      type: Number,
      default: 0
    }
  }],
  
  // 执行统计
  executionStats: {
    // 总执行次数
    totalExecutions: {
      type: Number,
      default: 0
    },
    
    // 成功执行次数
    successfulExecutions: {
      type: Number,
      default: 0
    },
    
    // 失败执行次数
    failedExecutions: {
      type: Number,
      default: 0
    },
    
    // 平均执行时间（毫秒）
    averageExecutionTime: {
      type: Number,
      default: 0
    },
    
    // 最短执行时间（毫秒）
    minExecutionTime: {
      type: Number,
      default: 0
    },
    
    // 最长执行时间（毫秒）
    maxExecutionTime: {
      type: Number,
      default: 0
    },
    
    // 成功率
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // 最后执行时间
    lastExecutedAt: {
      type: Date
    }
  },
  
  // 标签和分类
  tags: [{
    type: String,
    trim: true
  }],
  
  category: {
    type: String,
    enum: ['functional', 'ui', 'navigation', 'form', 'api', 'performance', 'other'],
    default: 'functional'
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'deprecated'],
    default: 'draft',
    index: true
  },
  
  // 共享和权限
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // 创建和更新信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '创建者是必填项']
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
generatedCodeSchema.index({ testCaseId: 1, 'version.full': -1 });
generatedCodeSchema.index({ memberId: 1, createdAt: -1 });
generatedCodeSchema.index({ status: 1, isPublic: 1 });
generatedCodeSchema.index({ tags: 1 });
generatedCodeSchema.index({ category: 1 });

// 实例方法
generatedCodeSchema.methods.updateExecutionStats = function(executionResult) {
  const stats = this.executionStats;
  
  stats.totalExecutions += 1;
  
  if (executionResult.success) {
    stats.successfulExecutions += 1;
  } else {
    stats.failedExecutions += 1;
  }
  
  // 更新执行时间统计
  if (executionResult.duration) {
    if (stats.minExecutionTime === 0 || executionResult.duration < stats.minExecutionTime) {
      stats.minExecutionTime = executionResult.duration;
    }
    if (executionResult.duration > stats.maxExecutionTime) {
      stats.maxExecutionTime = executionResult.duration;
    }
    
    // 计算平均执行时间
    const totalTime = stats.averageExecutionTime * (stats.totalExecutions - 1) + executionResult.duration;
    stats.averageExecutionTime = totalTime / stats.totalExecutions;
  }
  
  // 计算成功率
  stats.successRate = stats.totalExecutions > 0 ? 
    Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0;
  
  stats.lastExecutedAt = new Date();
  
  return this.save();
};

// 静态方法
generatedCodeSchema.statics.getLatestVersion = async function(testCaseId) {
  return await this.findOne({ testCaseId })
    .sort({ 'version.full': -1 })
    .limit(1);
};

generatedCodeSchema.statics.getActiveVersion = async function(testCaseId) {
  return await this.findOne({ 
    testCaseId, 
    status: 'active' 
  });
};

generatedCodeSchema.statics.getVersionHistory = async function(testCaseId) {
  return await this.find({ testCaseId })
    .sort({ 'version.full': -1 })
    .select('version metadata status createdAt');
};

generatedCodeSchema.statics.findSimilarCodes = async function(tags, category, limit = 10) {
  const query = {
    isPublic: true,
    status: 'active'
  };
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  if (category) {
    query.category = category;
  }
  
  return await this.find(query)
    .sort({ 'executionStats.successRate': -1, 'metadata.qualityScore': -1 })
    .limit(limit)
    .populate('testCaseId', 'title description');
};

// 中间件：自动计算代码统计信息
generatedCodeSchema.pre('save', function(next) {
  // 计算代码行数
  if (this.codeContent.fullScript) {
    this.metadata.lineCount = this.codeContent.fullScript.split('\n').length;
    this.metadata.size = Buffer.byteLength(this.codeContent.fullScript, 'utf8');
  }
  
  // 生成完整版本号
  this.version.full = `${this.version.major}.${this.version.minor}.${this.version.patch}`;
  
  next();
});

const GeneratedCode = mongoose.model('GeneratedCode', generatedCodeSchema);

export default GeneratedCode;

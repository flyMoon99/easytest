import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 基础信息
  name: {
    type: String,
    required: [true, '视频名称是必填项'],
    trim: true,
    minlength: [1, '视频名称至少1个字符'],
    maxlength: [200, '视频名称最多200个字符']
  },
  
  // 文件信息
  originalName: {
    type: String,
    required: [true, '原始文件名是必填项'],
    trim: true
  },
  
  fileSize: {
    type: Number, // 文件大小（字节）
    required: [true, '文件大小是必填项']
  },
  
  filePath: {
    type: String,
    required: [true, '文件路径是必填项'],
    trim: true
  },
  
  mimeType: {
    type: String,
    required: [true, '文件类型是必填项'],
    trim: true
  },
  
  // 解析状态
  parseStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // 解析结果
  parseResult: {
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
    },
    duration: {
      type: Number, // 视频时长（秒）
      default: 0
    },
    resolution: {
      width: Number,
      height: Number
    },
    frameRate: {
      type: Number,
      default: 0
    },
    // Gemini分析结果
    geminiAnalysis: {
      summary: String,
      testAnalysis: {
        functionalIssues: [{
          issue: String,
          severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
          },
          impact: String,
          recommendation: String
        }],
        uiIssues: [{
          issue: String,
          severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
          },
          impact: String,
          recommendation: String
        }],
        performanceIssues: [{
          issue: String,
          severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
          },
          impact: String,
          recommendation: String
        }],
        compatibilityIssues: [{
          issue: String,
          severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
          },
          impact: String,
          recommendation: String
        }],
        securityIssues: [{
          issue: String,
          severity: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
          },
          impact: String,
          recommendation: String
        }]
      },
      overallAssessment: {
        qualityScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        criticalIssues: {
          type: Number,
          default: 0
        },
        majorIssues: {
          type: Number,
          default: 0
        },
        minorIssues: {
          type: Number,
          default: 0
        },
        recommendations: [String]
      },
      testRecommendations: [{
        testType: {
          type: String,
          enum: ['功能测试', 'UI测试', '性能测试', '兼容性测试', '安全测试']
        },
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
          default: 'medium'
        },
        description: String,
        expectedOutcome: String
      }]
    }
  },
  
  // 缩略图
  thumbnailPath: {
    type: String,
    default: '',
    trim: true
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
  
  parsedAt: {
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
videoSchema.index({ memberId: 1, createdAt: -1 });
videoSchema.index({ parseStatus: 1, createdAt: -1 });
videoSchema.index({ memberId: 1, parseStatus: 1 });

// 实例方法
videoSchema.methods.updateParseStatus = function(status, additionalData = {}) {
  this.parseStatus = status;
  this.updatedAt = new Date();
  
  if (status === 'processing') {
    // 开始解析
  } else if (status === 'completed' || status === 'failed') {
    this.parsedAt = new Date();
  }
  
  // 合并额外数据
  Object.assign(this, additionalData);
  
  return this.save();
};

// 静态方法
videoSchema.statics.getStatistics = async function(memberId) {
  const stats = await this.aggregate([
    { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
    {
      $group: {
        _id: '$parseStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    processing: 0,
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
videoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Video = mongoose.model('Video', videoSchema);

export default Video; 
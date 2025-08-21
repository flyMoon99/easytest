import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 关联目录
  directoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCaseDirectory',
    required: [true, '目录ID是必填项'],
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
  
  // 用例等级
  level: {
    type: String,
    enum: ['高', '中', '低'],
    default: '中',
    required: false
  },
  
  // 截图地址
  screenshotUrl: {
    type: String,
    default: '',
    trim: true
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
  
  // PW测试配置
  pwTestConfig: {
    // 是否启用PW测试
    enabled: {
      type: Boolean,
      default: false
    },
    
    // 测试执行模式
    executionMode: {
      type: String,
      enum: ['headless', 'headed', 'debug'],
      default: 'headless'
    },
    
    // 浏览器类型
    browserType: {
      type: String,
      enum: ['chromium', 'firefox', 'webkit'],
      default: 'chromium'
    },
    
    // 视口配置
    viewport: {
      width: {
        type: Number,
        default: 1920
      },
      height: {
        type: Number,
        default: 1080
      }
    },
    
    // 超时配置
    timeouts: {
      navigation: {
        type: Number,
        default: 30000
      },
      action: {
        type: Number,
        default: 5000
      },
      assertion: {
        type: Number,
        default: 10000
      }
    },
    
    // 重试配置
    retries: {
      count: {
        type: Number,
        default: 3
      },
      delay: {
        type: Number,
        default: 1000
      }
    },
    
    // 录制配置
    recording: {
      enabled: {
        type: Boolean,
        default: true
      },
      video: {
        type: Boolean,
        default: true
      },
      screenshots: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 生成的代码
  generatedCode: {
    // 完整测试代码
    fullScript: {
      type: String,
      default: ''
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
    }],
    
    // 代码版本
    version: {
      type: String,
      default: '1.0.0'
    },
    
    // 生成时间
    generatedAt: {
      type: Date
    },
    
    // 使用的AI模型
    aiModel: {
      type: String,
      default: ''
    },
    
    // 生成提示词
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
    }
  },
  
  // 执行历史记录
  executionHistory: [{
    // 执行ID
    executionId: {
      type: String,
      required: true
    },
    
    // 执行状态
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    
    // 执行结果
    result: {
      type: String,
      enum: ['pass', 'fail', 'blocked', 'skipped'],
      default: 'skipped'
    },
    
    // 执行开始时间
    startedAt: {
      type: Date
    },
    
    // 执行结束时间
    completedAt: {
      type: Date
    },
    
    // 执行时长（毫秒）
    duration: {
      type: Number,
      default: 0
    },
    
    // 执行的代码版本
    codeVersion: {
      type: String
    },
    
    // 执行环境信息
    environment: {
      browser: String,
      version: String,
      platform: String,
      userAgent: String
    },
    
    // 执行日志
    logs: [{
      level: {
        type: String,
        enum: ['info', 'warn', 'error', 'debug'],
        default: 'info'
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      step: Number
    }],
    
    // 错误信息
    error: {
      message: String,
      stack: String,
      step: Number
    },
    
    // 截图记录
    screenshots: [{
      step: Number,
      path: String,
      timestamp: Date,
      description: String
    }],
    
    // 录屏文件
    videoPath: {
      type: String
    },
    
    // 执行人
    executor: {
      type: String,
      default: 'system'
    }
  }],
  
  // 智能分析结果
  intelligentAnalysis: {
    // 自然语言理解结果
    nluResult: {
      // 提取的测试目标
      testObjective: {
        type: String,
        default: ''
      },
      
      // 识别的主要操作
      mainActions: [{
        action: String,
        target: String,
        expectedResult: String
      }],
      
      // 测试类型
      testType: {
        type: String,
        enum: ['functional', 'ui', 'navigation', 'form', 'api', 'performance'],
        default: 'functional'
      },
      
      // 复杂度评估
      complexity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      
      // 预估执行时间（秒）
      estimatedDuration: {
        type: Number,
        default: 30
      }
    }
  },
  
  // PW测试统计信息
  pwTestStatistics: {
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
    },
    
    // 代码生成次数
    codeGenerationCount: {
      type: Number,
      default: 0
    }
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
testCaseSchema.index({ directoryId: 1, createdAt: -1 });
testCaseSchema.index({ memberId: 1, directoryId: 1 });

// 静态方法
testCaseSchema.statics.getStatistics = async function(memberId) {
  const stats = await this.aggregate([
    { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 }
      }
    }
  ]);

  return {
    total: stats.length > 0 ? stats[0].total : 0
  };
};

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;

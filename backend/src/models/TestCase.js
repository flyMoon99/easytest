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

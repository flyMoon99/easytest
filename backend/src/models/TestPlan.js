import mongoose from 'mongoose';

const testPlanSchema = new mongoose.Schema({
  // 关联会员
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '会员ID是必填项'],
    index: true
  },

  // 计划名称
  name: {
    type: String,
    required: [true, '计划名称是必填项'],
    trim: true,
    maxlength: [100, '计划名称最多100个字符'],
    index: true
  },

  // 计划描述
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '计划描述最多2000个字符'],
    default: ''
  },

  // 状态
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'completed', 'cancelled'],
      message: '状态必须是 draft、active、completed 或 cancelled'
    },
    default: 'draft',
    index: true
  },

  // 测试类型
  testType: {
    type: String,
    required: [true, '测试类型是必填项'],
    trim: true,
    maxlength: [50, '测试类型最多50个字符']
  },

  // 测试负责人
  assignee: {
    type: String,
    required: [true, '测试负责人是必填项'],
    trim: true,
    maxlength: [50, '测试负责人最多50个字符']
  },

  // 开始时间
  startTime: {
    type: Date,
    required: [true, '开始时间是必填项']
  },

  // 结束时间
  endTime: {
    type: Date,
    required: [true, '结束时间是必填项']
  },

  // 关联的测试用例数量
  testCaseCount: {
    type: Number,
    default: 0,
    min: [0, '测试用例数量不能为负数']
  },

  // 已完成的测试用例数量
  completedTestCaseCount: {
    type: Number,
    default: 0,
    min: [0, '已完成的测试用例数量不能为负数']
  },

  // 统计信息
  statistics: {
    totalCases: {
      type: Number,
      default: 0
    },
    completedCases: {
      type: Number,
      default: 0
    },
    failedCases: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.memberId = ret.memberId.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
testPlanSchema.index({ memberId: 1, createdAt: -1 });
testPlanSchema.index({ status: 1, createdAt: -1 });
testPlanSchema.index({ memberId: 1, status: 1 });
testPlanSchema.index({ startTime: 1, endTime: 1 });

// 实例方法
testPlanSchema.methods.updateStatistics = async function() {
  const TestCase = mongoose.model('TestCase');
  
  // 统计该计划下的测试用例
  const stats = await TestCase.aggregate([
    {
      $match: {
        memberId: this.memberId,
        testPlanId: this._id
      }
    },
    {
      $group: {
        _id: null,
        totalCases: { $sum: 1 },
        completedCases: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        failedCases: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const stat = stats[0];
    this.statistics = {
      totalCases: stat.totalCases,
      completedCases: stat.completedCases,
      failedCases: stat.failedCases,
      successRate: stat.totalCases > 0 ? Math.round((stat.completedCases / stat.totalCases) * 100) : 0
    };
    this.testCaseCount = stat.totalCases;
    this.completedTestCaseCount = stat.completedCases;
  } else {
    this.statistics = {
      totalCases: 0,
      completedCases: 0,
      failedCases: 0,
      successRate: 0
    };
    this.testCaseCount = 0;
    this.completedTestCaseCount = 0;
  }

  await this.save();
};

// 静态方法：获取测试计划列表
testPlanSchema.statics.getTestPlanList = async function(memberId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { memberId };
  
  // 状态过滤
  if (status) {
    query.status = status;
  }
  
  // 搜索过滤
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { assignee: { $regex: search, $options: 'i' } },
      { testType: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [testPlans, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  // 转换数据格式
  const transformedTestPlans = testPlans.map(plan => ({
    ...plan,
    id: plan._id.toString(),
    memberId: plan.memberId.toString()
  }));

  return {
    testPlans: transformedTestPlans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// 静态方法：获取测试计划统计信息
testPlanSchema.statics.getTestPlanStatistics = async function(memberId) {
  const stats = await this.aggregate([
    {
      $match: { memberId: new mongoose.Types.ObjectId(memberId) }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      draft: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    };
  }

  return stats[0];
};

const TestPlan = mongoose.model('TestPlan', testPlanSchema);

export default TestPlan;

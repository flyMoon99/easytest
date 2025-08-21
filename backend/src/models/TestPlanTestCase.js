import mongoose from 'mongoose';

const testPlanTestCaseSchema = new mongoose.Schema({
  // 关联测试计划
  testPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestPlan',
    required: [true, '测试计划ID是必填项'],
    index: true
  },

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

  // 在该测试计划下的状态
  status: {
    type: String,
    enum: ['pending', 'screened', 'analyzed', 'completed', 'failed'],
    default: 'pending',
    required: true,
    index: true
  },

  // 在该测试计划下的执行结果
  result: {
    type: String,
    enum: ['pass', 'fail', 'blocked', 'skipped', 'notExecuted'],
    default: 'notExecuted',
    required: true
  },

  // 在该测试计划下的执行次数
  executionCount: {
    type: Number,
    default: 0,
    min: [0, '执行次数不能为负数']
  },

  // 在该测试计划下关联的Bug数量
  relatedBugs: {
    type: Number,
    default: 0,
    min: [0, '关联Bug数量不能为负数']
  },

  // 在该测试计划下最后执行时间
  lastExecutionTime: {
    type: Date,
    default: null
  },

  // 在该测试计划下最后执行人
  lastExecutor: {
    type: String,
    default: '未分配',
    trim: true,
    maxlength: [50, '最后执行人最多50个字符']
  },

  // 执行描述
  executionDescription: {
    type: String,
    trim: true,
    maxlength: [1000, '执行描述最多1000个字符'],
    default: ''
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

// 复合索引：确保一个测试计划下的一个用例只有一条记录
testPlanTestCaseSchema.index({ testPlanId: 1, testCaseId: 1 }, { unique: true });

// 其他索引
testPlanTestCaseSchema.index({ memberId: 1, testPlanId: 1 });
testPlanTestCaseSchema.index({ memberId: 1, testCaseId: 1 });
testPlanTestCaseSchema.index({ status: 1, testPlanId: 1 });
testPlanTestCaseSchema.index({ result: 1, testPlanId: 1 });
testPlanTestCaseSchema.index({ lastExecutionTime: -1 });

// 静态方法：获取测试计划的用例统计
testPlanTestCaseSchema.statics.getTestPlanStatistics = async function(testPlanId) {
  const stats = await this.aggregate([
    { $match: { testPlanId: new mongoose.Types.ObjectId(testPlanId) } },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalCases = await this.countDocuments({ testPlanId });
  const completedCases = stats.find(s => s._id === 'pass')?.count || 0;
  const failedCases = stats.find(s => s._id === 'fail')?.count || 0;
  const blockedCases = stats.find(s => s._id === 'blocked')?.count || 0;
  const notExecutedCases = stats.find(s => s._id === 'notExecuted')?.count || 0;
  
  const successRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  return {
    totalCases,
    completedCases,
    failedCases,
    blockedCases,
    notExecutedCases,
    successRate
  };
};

// 静态方法：批量创建关联
testPlanTestCaseSchema.statics.batchCreateAssociations = async function(testPlanId, testCaseIds, memberId) {
  const associations = testCaseIds.map(testCaseId => ({
    testPlanId,
    testCaseId,
    memberId,
    status: 'pending',
    result: 'notExecuted',
    executionCount: 0,
    relatedBugs: 0
  }));

  return await this.insertMany(associations, { ordered: false });
};

// 静态方法：获取测试计划的所有关联用例（带用例详情）
testPlanTestCaseSchema.statics.getTestPlanCasesWithDetails = async function(testPlanId, options = {}) {
  const { page = 1, limit = 50, status, result } = options;
  const skip = (page - 1) * limit;

  const matchStage = { testPlanId: new mongoose.Types.ObjectId(testPlanId) };
  if (status) matchStage.status = status;
  if (result) matchStage.result = result;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'testcases',
        localField: 'testCaseId',
        foreignField: '_id',
        as: 'testCase'
      }
    },
    { $unwind: '$testCase' },
    {
      $lookup: {
        from: 'testcasedirectories',
        localField: 'testCase.directoryId',
        foreignField: '_id',
        as: 'directory'
      }
    },
    { $unwind: { path: '$directory', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        id: '$_id',
        testCaseId: '$testCaseId',
        title: '$testCase.title',
        entryUrl: '$testCase.entryUrl',
        description: '$testCase.description',
        level: '$testCase.level',
        directoryPath: {
          $cond: {
            if: { $ne: ['$directory.path', ''] },
            then: { $split: ['$directory.path', '/'] },
            else: []
          }
        },
        status: '$status',
        result: '$result',
        executionCount: '$executionCount',
        relatedBugs: '$relatedBugs',
        lastExecutionTime: '$lastExecutionTime',
        lastExecutor: '$lastExecutor',
        executionDescription: '$executionDescription',
        createdAt: '$createdAt',
        updatedAt: '$updatedAt'
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ];

  const [cases, total] = await Promise.all([
    this.aggregate(pipeline),
    this.countDocuments(matchStage)
  ]);

  return {
    testCases: cases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const TestPlanTestCase = mongoose.model('TestPlanTestCase', testPlanTestCaseSchema);

export default TestPlanTestCase;

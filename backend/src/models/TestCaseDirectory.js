import mongoose from 'mongoose';

const testCaseDirectorySchema = new mongoose.Schema({
  // 关联用户
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  // 目录名称
  name: {
    type: String,
    required: [true, '目录名称是必填项'],
    trim: true,
    minlength: [1, '目录名称至少1个字符'],
    maxlength: [100, '目录名称最多100个字符']
  },
  
  // 目录描述
  description: {
    type: String,
    trim: true,
    maxlength: [500, '目录描述最多500个字符'],
    default: ''
  },
  
  // 父目录ID（支持多层级结构）
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCaseDirectory',
    default: null,
    index: true
  },
  
  // 目录路径（用于快速查询和显示层级结构）
  path: {
    type: String,
    required: true,
    index: true,
    default: function() {
      return this.name || '';
    }
  },
  
  // 目录层级深度
  level: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 10 // 限制最大层级深度
  },
  
  // 排序顺序
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },
  
  // 目录状态
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    required: true,
    index: true
  },
  
  // 目录颜色标识（前端展示用）
  color: {
    type: String,
    default: '#1f2937', // 默认灰色
    match: /^#[0-9A-Fa-f]{6}$/
  },
  
  // 目录图标（前端展示用）
  icon: {
    type: String,
    default: 'folder',
    maxlength: [50, '图标名称最多50个字符']
  },
  
  // 统计信息（冗余存储，提高查询性能）
  statistics: {
    totalCases: {
      type: Number,
      default: 0
    },
    completedCases: {
      type: Number,
      default: 0
    },
    pendingCases: {
      type: Number,
      default: 0
    },
    failedCases: {
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
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 复合索引
testCaseDirectorySchema.index({ memberId: 1, parentId: 1, sortOrder: 1 });
testCaseDirectorySchema.index({ memberId: 1, path: 1 });
testCaseDirectorySchema.index({ memberId: 1, status: 1, level: 1 });

// 虚拟字段：子目录
testCaseDirectorySchema.virtual('children', {
  ref: 'TestCaseDirectory',
  localField: '_id',
  foreignField: 'parentId'
});

// 虚拟字段：父目录
testCaseDirectorySchema.virtual('parent', {
  ref: 'TestCaseDirectory',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// 虚拟字段：目录下的测试用例
// 第 155 行附近 - 虚拟字段定义
testCaseDirectorySchema.virtual('testCases', {
  ref: 'TestCase',  // 修复：改为正确的模型名
  localField: '_id',
  foreignField: 'directoryId'
});

// 第 155 行附近 - updateStatistics 方法
testCaseDirectorySchema.methods.updateStatistics = async function() {
  const TestCase = mongoose.model('TestCase');  // 修复：改为正确的模型名
  
  const stats = await TestCaseNew.aggregate([
    { $match: { directoryId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  this.statistics.totalCases = 0;
  this.statistics.completedCases = 0;
  this.statistics.pendingCases = 0;
  this.statistics.failedCases = 0;
  
  stats.forEach(stat => {
    this.statistics.totalCases += stat.count;
    switch (stat._id) {
      case 'completed':
        this.statistics.completedCases = stat.count;
        break;
      case 'pending':
        this.statistics.pendingCases = stat.count;
        break;
      case 'failed':
        this.statistics.failedCases = stat.count;
        break;
    }
  });
  
  return this.save();
};

// 静态方法：获取用户的目录树
testCaseDirectorySchema.statics.getDirectoryTree = async function(memberId, includeArchived = false) {
  const query = { memberId };
  if (!includeArchived) {
    query.status = { $ne: 'archived' };
  }
  
  const directories = await this.find(query)
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('parent', 'name path')
    .lean();
  
  // 手动转换 _id 为 id，因为 lean() 不会应用 toJSON 转换
  const transformDirectory = (dir) => {
    const transformed = {
      ...dir,
      id: dir._id.toString(),
      parentId: dir.parentId ? dir.parentId.toString() : null,
      memberId: dir.memberId.toString()
    };
    delete transformed._id;
    delete transformed.__v;
    return transformed;
  };
  
  // 转换所有目录
  const transformedDirectories = directories.map(transformDirectory);
  
  // 构建树形结构
  const directoryMap = new Map();
  const rootDirectories = [];

  transformedDirectories.forEach(dir => {
    dir.children = [];
    directoryMap.set(dir.id, dir);
  });

  transformedDirectories.forEach(dir => {
    if (dir.parentId) {
      const parent = directoryMap.get(dir.parentId);
      if (parent) {
        parent.children.push(dir);
      }
    } else {
      rootDirectories.push(dir);
    }
  });
  
  return rootDirectories;
};

// 静态方法：检查目录名称是否重复
testCaseDirectorySchema.statics.checkNameDuplicate = async function(memberId, name, parentId = null, excludeId = null) {
  const query = {
    memberId,
    name,
    parentId,
    status: { $ne: 'deleted' }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingDir = await this.findOne(query);
  return !!existingDir;
};

// 中间件：保存前更新路径
testCaseDirectorySchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // 如果是新建或者父目录发生变化，更新路径
  if (this.isNew || this.isModified('parentId') || this.isModified('name')) {
    if (this.parentId) {
      const parent = await this.constructor.findById(this.parentId);
      if (parent) {
        this.path = `${parent.path}/${this.name}`;
        this.level = parent.level + 1;
      } else {
        // 如果找不到父目录，设为根目录
        this.path = this.name;
        this.level = 0;
      }
    } else {
      // 根目录
      this.path = this.name;
      this.level = 0;
    }
  }
  
  next();
});

// 中间件：删除时处理子目录和测试用例
// 第 305 行附近 - 删除中间件
testCaseDirectorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // 递归删除子目录
  await this.constructor.deleteMany({ parentId: this._id });
  
  // 删除关联的测试用例
  const TestCase = mongoose.model('TestCase');  // 修复：改为正确的模型名
  await TestCase.deleteMany({ directoryId: this._id });
  
  next();
});

const TestCaseDirectory = mongoose.model('TestCaseDirectory', testCaseDirectorySchema);

export default TestCaseDirectory;

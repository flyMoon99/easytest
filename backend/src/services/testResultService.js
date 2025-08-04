import TestResult from '../models/TestResult.js';
import Video from '../models/Video.js';

/**
 * 创建单个测试结果
 * @param {Object} data - 测试结果数据
 * @returns {Promise<Object>} 创建的测试结果
 */
export const createTestResult = async (data) => {
  try {
    const testResult = new TestResult(data);
    await testResult.save();
    return testResult;
  } catch (error) {
    console.error('创建测试结果失败:', error);
    throw error;
  }
};

/**
 * 批量创建测试结果
 * @param {Array} testResults - 测试结果数组
 * @returns {Promise<Array>} 创建的测试结果数组
 */
export const createTestResultsBatch = async (testResults) => {
  try {
    const createdTestResults = await TestResult.insertMany(testResults);
    return createdTestResults;
  } catch (error) {
    console.error('批量创建测试结果失败:', error);
    throw error;
  }
};

/**
 * 从Gemini分析结果创建测试结果
 * @param {string} memberId - 会员ID
 * @param {string} videoId - 视频ID
 * @param {Object} geminiAnalysis - Gemini分析结果
 * @returns {Promise<Array>} 创建的测试结果数组
 */
export const createTestResultsFromGeminiAnalysis = async (memberId, videoId, geminiAnalysis) => {
  try {
    const testResults = [];
    
    // 处理功能问题
    if (geminiAnalysis.testAnalysis?.functionalIssues) {
      geminiAnalysis.testAnalysis.functionalIssues.forEach(issue => {
        testResults.push({
          memberId,
          videoId,
          issue: issue.issue,
          impact: issue.impact,
          recommendation: issue.recommendation,
          severity: issue.severity || 'medium',
          category: '功能测试'
        });
      });
    }
    
    // 处理UI问题
    if (geminiAnalysis.testAnalysis?.uiIssues) {
      geminiAnalysis.testAnalysis.uiIssues.forEach(issue => {
        testResults.push({
          memberId,
          videoId,
          issue: issue.issue,
          impact: issue.impact,
          recommendation: issue.recommendation,
          severity: issue.severity || 'medium',
          category: 'UI测试'
        });
      });
    }
    
    // 处理性能问题
    if (geminiAnalysis.testAnalysis?.performanceIssues) {
      geminiAnalysis.testAnalysis.performanceIssues.forEach(issue => {
        testResults.push({
          memberId,
          videoId,
          issue: issue.issue,
          impact: issue.impact,
          recommendation: issue.recommendation,
          severity: issue.severity || 'medium',
          category: '性能测试'
        });
      });
    }
    
    // 处理兼容性问题
    if (geminiAnalysis.testAnalysis?.compatibilityIssues) {
      geminiAnalysis.testAnalysis.compatibilityIssues.forEach(issue => {
        testResults.push({
          memberId,
          videoId,
          issue: issue.issue,
          impact: issue.impact,
          recommendation: issue.recommendation,
          severity: issue.severity || 'medium',
          category: '兼容性测试'
        });
      });
    }
    
    // 处理安全问题
    if (geminiAnalysis.testAnalysis?.securityIssues) {
      geminiAnalysis.testAnalysis.securityIssues.forEach(issue => {
        testResults.push({
          memberId,
          videoId,
          issue: issue.issue,
          impact: issue.impact,
          recommendation: issue.recommendation,
          severity: issue.severity || 'medium',
          category: '安全测试'
        });
      });
    }
    
    // 处理测试建议
    if (geminiAnalysis.testRecommendations) {
      geminiAnalysis.testRecommendations.forEach(rec => {
        testResults.push({
          memberId,
          videoId,
          issue: rec.description,
          impact: '需要进一步验证',
          recommendation: rec.expectedOutcome,
          severity: rec.priority || 'medium',
          category: rec.testType || '其他'
        });
      });
    }
    
    // 如果没有具体问题，创建一个默认的测试结果
    if (testResults.length === 0) {
      testResults.push({
        memberId,
        videoId,
        issue: '需要进一步分析视频内容',
        impact: '可能影响用户体验',
        recommendation: '建议手动检查视频内容并进行详细测试',
        severity: 'medium',
        category: '其他'
      });
    }
    
    // 批量创建测试结果
    if (testResults.length > 0) {
      const createdTestResults = await createTestResultsBatch(testResults);
      console.log(`成功创建 ${createdTestResults.length} 条测试结果`);
      return createdTestResults;
    }
    
    return [];
    
  } catch (error) {
    console.error('从Gemini分析结果创建测试结果失败:', error);
    throw error;
  }
};

/**
 * 获取测试结果列表
 * @param {Object} filters - 过滤条件
 * @param {Object} pagination - 分页参数
 * @returns {Promise<Object>} 测试结果列表和分页信息
 */
export const getTestResults = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // 应用过滤条件
    if (filters.memberId) {
      query.memberId = filters.memberId;
    }
    
    if (filters.videoId) {
      query.videoId = filters.videoId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.severity) {
      query.severity = filters.severity;
    }
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.search) {
      query.$or = [
        { issue: { $regex: filters.search, $options: 'i' } },
        { impact: { $regex: filters.search, $options: 'i' } },
        { recommendation: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const [testResults, total] = await Promise.all([
      TestResult.find(query)
        .populate('videoId', 'name originalName filePath mimeType fileSize')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TestResult.countDocuments(query)
    ]);
    
    return {
      testResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('获取测试结果列表失败:', error);
    throw error;
  }
};

/**
 * 获取单个测试结果
 * @param {string} id - 测试结果ID
 * @param {string} memberId - 会员ID
 * @returns {Promise<Object>} 测试结果
 */
export const getTestResult = async (id, memberId) => {
  try {
    const testResult = await TestResult.findOne({ _id: id, memberId })
      .populate('videoId', 'name originalName filePath mimeType fileSize');
    
    return testResult;
  } catch (error) {
    console.error('获取测试结果失败:', error);
    throw error;
  }
};

/**
 * 更新测试结果状态
 * @param {string} id - 测试结果ID
 * @param {string} memberId - 会员ID
 * @param {string} status - 新状态
 * @param {string} processingNote - 处理备注
 * @returns {Promise<Object>} 更新后的测试结果
 */
export const updateTestResultStatus = async (id, memberId, status, processingNote = '') => {
  try {
    const testResult = await TestResult.findOne({ _id: id, memberId });
    
    if (!testResult) {
      throw new Error('测试结果不存在');
    }
    
    await testResult.updateStatus(status, processingNote);
    return testResult;
  } catch (error) {
    console.error('更新测试结果状态失败:', error);
    throw error;
  }
};

/**
 * 更新测试结果
 * @param {string} id - 测试结果ID
 * @param {string} memberId - 会员ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的测试结果
 */
export const updateTestResult = async (id, memberId, updateData) => {
  try {
    const testResult = await TestResult.findOne({ _id: id, memberId });
    
    if (!testResult) {
      throw new Error('测试结果不存在');
    }
    
    // 更新字段
    Object.assign(testResult, updateData);
    await testResult.save();
    
    return testResult;
  } catch (error) {
    console.error('更新测试结果失败:', error);
    throw error;
  }
};

/**
 * 删除测试结果
 * @param {string} id - 测试结果ID
 * @param {string} memberId - 会员ID
 * @returns {Promise<boolean>} 删除是否成功
 */
export const deleteTestResult = async (id, memberId) => {
  try {
    const result = await TestResult.deleteOne({ _id: id, memberId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('删除测试结果失败:', error);
    throw error;
  }
};

/**
 * 获取测试结果统计信息
 * @param {string} memberId - 会员ID
 * @returns {Promise<Object>} 统计信息
 */
export const getTestResultStatistics = async (memberId) => {
  try {
    const statistics = await TestResult.getStatistics(memberId);
    return statistics;
  } catch (error) {
    console.error('获取测试结果统计失败:', error);
    throw error;
  }
};

/**
 * 根据视频ID获取测试结果
 * @param {string} videoId - 视频ID
 * @param {string} memberId - 会员ID
 * @returns {Promise<Array>} 测试结果数组
 */
export const getTestResultsByVideo = async (videoId, memberId) => {
  try {
    const testResults = await TestResult.find({ videoId, memberId })
      .sort({ createdAt: -1 });
    
    return testResults;
  } catch (error) {
    console.error('根据视频ID获取测试结果失败:', error);
    throw error;
  }
}; 
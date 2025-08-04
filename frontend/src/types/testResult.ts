// 测试结果状态枚举
export type TestResultStatus = 'pending' | 'processing' | 'completed';

// 紧急程度枚举
export type TestResultSeverity = 'high' | 'medium' | 'low';

// 测试类别枚举
export type TestResultCategory = '功能测试' | 'UI测试' | '性能测试' | '兼容性测试' | '安全测试' | '其他';

// 视频信息接口
export interface VideoInfo {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  mimeType?: string;
  fileSize?: number;
}

// 测试结果接口
export interface TestResult {
  id: string;
  memberId: string;
  videoId: string;
  issue: string;
  impact: string;
  recommendation: string;
  severity: TestResultSeverity;
  category: TestResultCategory;
  status: TestResultStatus;
  processingNote?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  video?: VideoInfo;
}

// 测试结果列表响应接口
export interface TestResultListResponse {
  testResults: TestResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 测试结果统计信息接口
export interface TestResultStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  completionRate: number;
}

// 创建测试结果请求接口
export interface CreateTestResultRequest {
  videoId: string;
  issue: string;
  impact: string;
  recommendation: string;
  severity?: TestResultSeverity;
  category?: TestResultCategory;
}

// 批量创建测试结果请求接口
export interface BatchCreateTestResultRequest {
  videoId: string;
  testResults: CreateTestResultRequest[];
}

// 更新测试结果状态请求接口
export interface UpdateTestResultStatusRequest {
  status: TestResultStatus;
  processingNote?: string;
}

// 更新测试结果请求接口
export interface UpdateTestResultRequest {
  issue?: string;
  impact?: string;
  recommendation?: string;
  severity?: TestResultSeverity;
  category?: TestResultCategory;
}

// 测试结果过滤条件接口
export interface TestResultFilters {
  status?: TestResultStatus;
  severity?: TestResultSeverity;
  category?: TestResultCategory;
  videoId?: string;
  search?: string;
}

// 测试结果分页参数接口
export interface TestResultPagination {
  page?: number;
  limit?: number;
}

// 测试结果查询参数接口
export interface TestResultQueryParams extends TestResultFilters, TestResultPagination {} 
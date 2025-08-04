// 视频解析状态
export type VideoParseStatus = 'pending' | 'processing' | 'completed' | 'failed'

// 问题严重程度
export type IssueSeverity = 'high' | 'medium' | 'low'

// 测试类型
export type TestType = '功能测试' | 'UI测试' | '性能测试' | '兼容性测试' | '安全测试'

// 问题项
export interface IssueItem {
  issue: string
  severity: IssueSeverity
  impact: string
  recommendation: string
}

// 测试建议
export interface TestRecommendation {
  testType: TestType
  priority: IssueSeverity
  description: string
  expectedOutcome: string
}

// 整体评估
export interface OverallAssessment {
  qualityScore: number
  criticalIssues: number
  majorIssues: number
  minorIssues: number
  recommendations: string[]
}

// 测试分析
export interface TestAnalysis {
  functionalIssues: IssueItem[]
  uiIssues: IssueItem[]
  performanceIssues: IssueItem[]
  compatibilityIssues: IssueItem[]
  securityIssues: IssueItem[]
}

// Gemini分析结果
export interface GeminiAnalysis {
  summary: string
  testAnalysis: TestAnalysis
  overallAssessment: OverallAssessment
  testRecommendations: TestRecommendation[]
}

// 视频解析结果
export interface VideoParseResult {
  success: boolean
  message: string
  errorDetails: string
  duration: number
  resolution?: {
    width: number
    height: number
  }
  frameRate: number
  geminiAnalysis?: GeminiAnalysis
}

// 视频记录
export interface VideoRecord {
  id: string
  name: string
  testDescription: string
  originalName: string
  fileSize: number
  filePath: string
  mimeType: string
  parseStatus: VideoParseStatus
  parseResult: VideoParseResult
  thumbnailPath: string
  createdAt: string
  updatedAt: string
  parsedAt?: string
  memberId: string
}

// 视频表单
export interface VideoForm {
  name: string
  testDescription: string
  video: File | null
}

// 视频统计信息
export interface VideoStatistics {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  successRate: number
}

// 视频列表响应
export interface VideoListResponse {
  videos: VideoRecord[]
  pagination: {
    current: number
    pageSize: number
    total: number
    pages: number
  }
  statistics: VideoStatistics
}

// 视频上传响应
export interface VideoUploadResponse {
  video: VideoRecord
  message: string
}

// 视频状态更新请求
export interface VideoStatusUpdateRequest {
  parseStatus: VideoParseStatus
  parseResult?: Partial<VideoParseResult>
}

// Gemini解析响应
export interface GeminiParseResponse {
  video: VideoRecord
  analysis: GeminiAnalysis
  message: string
} 
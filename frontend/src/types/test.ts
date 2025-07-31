export interface TestRecord {
  id: string
  title: string
  entryUrl: string
  description: string
  status: TestStatus
  createdAt: string
  updatedAt?: string
  completedAt?: string
  playwrightScripts: PlaywrightScript[]
  videoUrl?: string
  duration?: number
  userId: string
  screenshotUrl?: string
  result?: {
    success: boolean
    message: string
    errorDetails: string
  }
  aiAnalysis?: {
    analysis: string
    aiModel: string
    testType: string
    analyzedAt: string
  }
}

export interface PlaywrightScript {
  id: string
  testRecordId: string
  step: number
  action: string
  selector?: string
  value?: string
  description?: string
  explanation?: string
  videoSegmentUrl?: string
  timestamp?: number
  screenshot?: string
}

export interface TestForm {
  title: string
  entryUrl: string
  description: string
}

export interface TestStatistics {
  total: number
  pending: number
  screened: number
  analyzed: number
  completed: number
  failed: number
  successRate: number
}

export type TestStatus = 'pending' | 'screened' | 'analyzed' | 'completed' | 'failed'

export interface TestState {
  testRecords: TestRecord[]
  currentTest: TestRecord | null
  statistics: TestStatistics
  loading: boolean
  error: string | null
}
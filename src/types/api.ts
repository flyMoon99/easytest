export interface ApiResponse<T = unknown> {
  data: T
  message: string
  success: boolean
  code: number
}

export interface ApiError {
  message: string
  code: number
  details?: unknown
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
} 
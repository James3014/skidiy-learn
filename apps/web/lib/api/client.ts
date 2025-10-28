import axios, { AxiosInstance } from 'axios';
import type { paths } from './schema';
import { getApiBaseUrl } from '../utils/env';

const API_BASE_URL = getApiBaseUrl();

// 建立 axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器：自動加入 JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 回應攔截器：處理錯誤
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期或無效，清除本地 token 並導向登入頁
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Token 管理函數
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('accountId');
}

export function setUserInfo(accountId: string, role: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accountId', accountId);
  localStorage.setItem('userRole', role);
}

export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userRole');
}

export function getAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accountId');
}

export default apiClient;

// 型別安全的 API 函數

// TODO: Fix OpenAPI types when response schemas are added in backend controllers
export type LoginRequest = { accountId: string };
export type LoginResponse = { accessToken: string; accountId: string; role: string };

export type Lesson = {
  id: number;
  resortId: number;
  instructorId: string;
  lessonDate: string;
  createdAt: string;
  updatedAt: string;
  seatCount?: number;
  seats?: Array<{
    id: string;
    status: 'pending' | 'claimed' | 'completed';
    seatNumber: number;
  }>;
};

export type LessonDetail = Lesson;

export type Seat = {
  id: string;
  lessonId: number;
  seatNumber: number;
  status: 'pending' | 'claimed' | 'completed';
  claimedMappingId: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  selfEval?: {
    selfRating: number;
    selfComment: string | null;
  } | null;
};

export type SharedRecord = {
  id: string;
  lessonId: number;
  lessonDate: string;
  resortId: number;
  sharedBy: string;
  sharedAt: string;
};

export type CreateLessonRecordRequest = {
  lessonId: number;
  summary?: string;
  videos?: Array<Record<string, unknown>>;
  details: Array<{
    studentMappingId: string;
    shareVisibility?: 'private' | 'resort' | 'all';
    studentTypes?: string[];
    analyses?: Array<{
      analysisGroupId?: number;
      analysisItemId?: number;
      customAnalysis?: string;
    }>;
    practices?: Array<{
      skillId?: number;
      drillId?: number;
      customDrill?: string;
      practiceNotes?: string;
    }>;
  }>;
};

export type AnalysisGroup = {
  id: number;
  name: string;
  displayOrder: number;
  items: Array<{
    id: number;
    name: string;
    displayOrder: number;
  }>;
};

export type PracticeSkill = {
  id: number;
  name: string;
  displayOrder: number;
  drills: Array<{
    id: number;
    name: string;
    displayOrder: number;
  }>;
};

export type Ability = {
  id: number;
  name: string;
  category: string;
  sportType: string;
  skillLevel: number;
  sequenceInLevel: number;
  description: string | null;
};

export type CoachRatingRequest = {
  lessonRecordDetailId: string;
  abilityId: number;
  rating: number;
  proficiencyBand: 'knew' | 'familiar' | 'excellent';
  comment?: string;
  sourceRatingId?: string;
};

export type CreateCoachRatingsRequest = {
  ratings: CoachRatingRequest[];
};

export type LatestRating = {
  abilityId: number;
  abilityName: string;
  rating: number;
  proficiencyBand: 'knew' | 'familiar' | 'excellent';
  comment: string | null;
  ratedAt: string;
};

export type CoachRating = {
  id: string;
  abilityId: number;
  abilityName: string;
  rating: number;
  proficiencyBand: 'knew' | 'familiar' | 'excellent';
  comment: string | null;
  createdAt: string;
};

export type InvitationInfo = {
  code: string;
  seatId: string;
  expiresAt: string;
  claimedAt: string | null;
  claimedBy: string | null;
  isExpired: boolean;
  isClaimed: boolean;
};

export type ClaimInvitationRequest = {
  code: string;
  studentName: string;
  studentEnglish?: string;
  birthDate?: string;
  contactEmail?: string;
  guardianEmail?: string;
  contactPhone?: string;
  isMinor?: boolean;
  hasExternalInsurance?: boolean;
  insuranceProvider?: string;
  note?: string;
};

export type ClaimInvitationResponse = {
  seatId: string;
  mappingId: string;
  message: string;
};

export type LessonRecordDetailResponse = {
  id: string;
  lessonRecordId: string;
  studentMappingId: string;
  resortId: number;
  shareVisibility: 'private' | 'resort' | 'all';
  studentTypes: string[];
  sharedAt: string | null;
  sharedBy: string | null;
  coachRatings?: CoachRating[];
};

export type LessonRecordResponse = {
  id: string;
  lessonId: number;
  summary: string | null;
  videos: unknown;
  createdAt: string;
  updatedAt: string;
  details: LessonRecordDetailResponse[];
};

// API 函數

export const api = {
  // 認證
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/api/v1/auth/login', data);
    return response.data;
  },

  // 課程
  lessons: {
    list: async (params?: { role?: 'coach' | 'student'; date?: string }): Promise<Lesson[]> => {
      const response = await apiClient.get('/api/api/v1/lessons', { params });
      return response.data;
    },

    getById: async (id: number): Promise<LessonDetail> => {
      const response = await apiClient.get(`/api/api/v1/lessons/${id}`);
      return response.data;
    },

    getSeats: async (id: number, includeSelfEval: boolean = false): Promise<Seat[]> => {
      const params = includeSelfEval ? { include: 'self_eval' } : undefined;
      const response = await apiClient.get(`/api/api/v1/lessons/${id}/seats`, { params });
      return response.data;
    }
  },

  // 共享記錄
  sharing: {
    getRecords: async (params?: { resortId?: number; limit?: number }): Promise<SharedRecord[]> => {
      const response = await apiClient.get('/api/api/v1/sharing/records', { params });
      return response.data;
    }
  },

  // 教學記錄
  lessonRecords: {
    create: async (data: CreateLessonRecordRequest): Promise<LessonRecordResponse> => {
      const response = await apiClient.post('/api/api/v1/lesson-records', data);
      return response.data;
    },
    listPrivate: async (): Promise<LessonRecordResponse[]> => {
      const response = await apiClient.get('/api/api/v1/lesson-records/private');
      return response.data;
    }
  },

  // 分析項目
  analysis: {
    getGroups: async (): Promise<AnalysisGroup[]> => {
      const response = await apiClient.get('/api/analysis-groups');
      return response.data;
    }
  },

  // 練習技能
  practice: {
    getSkills: async (): Promise<PracticeSkill[]> => {
      const response = await apiClient.get('/api/practice-skills');
      return response.data;
    }
  },

  // 能力
  abilities: {
    getAll: async (): Promise<Ability[]> => {
      const response = await apiClient.get('/api/abilities');
      return response.data;
    }
  },

  // 教練評分
  ratings: {
    create: async (data: CreateCoachRatingsRequest): Promise<any> => {
      const response = await apiClient.post('/api/api/v1/lesson-records/ratings', data);
      return response.data;
    },
    getLatest: async (mappingId: string): Promise<LatestRating[]> => {
      const response = await apiClient.get(`/api/api/v1/lesson-records/students/${mappingId}/latest-ratings`);
      return response.data;
    }
  },

  // 邀請碼
  invitations: {
    verify: async (code: string): Promise<InvitationInfo> => {
      const response = await apiClient.get(`/api/api/v1/invitations/${code}`);
      return response.data;
    },
    claim: async (data: ClaimInvitationRequest): Promise<ClaimInvitationResponse> => {
      const response = await apiClient.post('/api/api/v1/invitations/claim', data);
      return response.data;
    }
  }
};

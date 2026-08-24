export type UserRole = 'resident' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: any;
  notification_prefs?: {
    email: boolean;
    in_app: boolean;
  };
}

export type ReportCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Streetlight'
  | 'Water Leak'
  | 'Drainage'
  | 'Stray Animal';

export type ReportStatus = 'Reported' | 'Acknowledged' | 'In Progress' | 'Resolved';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface PhotoAuthenticityResult {
  is_authentic: boolean;
  authenticity_score: number; // 0 to 100
  verdict: 'Authentic Civic Hazard Photo' | 'Potential Stock/Duplicate Photo' | 'Irrelevant/Non-Civic Image';
  detected_hazard: string;
  confidence_reason: string;
  source: 'ai_vision' | 'heuristic_fallback';
}

export interface ReportItem {
  id: string;
  user_id: string;
  user_name?: string;
  category: ReportCategory;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: ReportStatus;
  risk_level: RiskLevel;
  suggested_action: string;
  upvote_count: number;
  flag_count: number;
  duplicate_of: string | null;
  photo_verified?: boolean;
  photo_authenticity_score?: number;
  photo_authenticity_verdict?: string;
  detected_hazard?: string;
  is_disputed?: boolean;
  dispute_count?: number;
  resolution_rating_avg?: number;
  resolution_verified_count?: number;
  created_at: any;
  updated_at?: any;
}

export interface ResolutionFeedbackItem {
  id?: string;
  report_id: string;
  user_id: string;
  user_name: string;
  rating: number; // 1 to 5
  verified_resolved: boolean;
  comments: string;
  after_photo_url?: string;
  is_dispute?: boolean;
  dispute_reason?: string;
  created_at: any;
}

export interface SlaStatusInfo {
  slaHours: number;
  slaDeadline: Date;
  isBreached: boolean;
  hoursRemaining: number;
  hoursElapsed: number;
  statusLabel: 'Within SLA' | 'Escalated - SLA Breached' | 'Resolved Within SLA' | 'Resolved Past SLA';
}

export interface CivicBroadcastItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'emergency';
  category?: ReportCategory | 'general';
  ward?: string;
  active: boolean;
  created_at: any;
}

export interface CitizenLeaderboardItem {
  uid: string;
  name: string;
  email?: string;
  points: number;
  reports_submitted: number;
  reports_resolved: number;
  badges: string[];
  rank?: number;
}

export interface StatusHistoryItem {
  id?: string;
  status: ReportStatus;
  changed_by: string;
  changed_by_name?: string;
  notes?: string;
  timestamp: any;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  report_id: string;
  message: string;
  read: boolean;
  created_at: any;
}

export interface RiskAssessmentResult {
  risk_level: RiskLevel;
  suggested_action: string;
  source: 'openrouter' | 'fallback';
}

export interface ReportCommentItem {
  id: string;
  user_id: string;
  user_name: string;
  user_role?: UserRole;
  content: string;
  created_at: any;
}

export interface DailyAnalytics {
  date: string;
  total_reports: number;
  resolved_reports: number;
  avg_resolution_hours: number;
  reports_by_category: Record<ReportCategory, number>;
  risk_distribution: Record<RiskLevel, number>;
}

export interface ReportFilter {
  category?: ReportCategory | 'all';
  status?: ReportStatus | 'all';
  risk_level?: RiskLevel | 'all';
  search?: string;
  radiusKm?: number | 'all';
  sortBy?: 'newest' | 'upvotes' | 'risk';
}


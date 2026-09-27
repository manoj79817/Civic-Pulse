export type IssueCategory =
  | 'road'
  | 'streetlight'
  | 'waste'
  | 'water'
  | 'drainage'
  | 'footpath'
  | 'traffic'
  | 'parks'
  | 'other';

export type IssuePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type IssueStatus =
  | 'Reported'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export interface TimelineEvent {
  id: string;
  status: IssueStatus;
  title: string;
  timestamp: string;
  remark?: string;
  actor?: string;
}

export interface CivicIssue {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  priorityReasoning: string[];
  status: IssueStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood?: string;
  };
  photoUrl?: string;
  department: string;
  assignedCrew?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: TimelineEvent[];
  upvotes: number;
  deviceId?: string;
  isDuplicateOf?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  distanceMeters: number;
  existingIssue?: CivicIssue;
  reason?: string;
}

export interface PriorityEvaluation {
  priority: IssuePriority;
  score: number;
  reasons: string[];
  nearbySimilarCount: number;
}

export interface CityAnalytics {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  criticalIssues: number;
  resolutionRatePercent: number;
  avgResolutionHours: number;
  categoryBreakdown: { category: IssueCategory; label: string; count: number; color: string }[];
  statusBreakdown: { status: IssueStatus; count: number; color: string }[];
  recentActivityTrend: { date: string; reported: number; resolved: number }[];
  departmentPerformance: {
    department: string;
    active: number;
    resolved: number;
    avgHours: number;
  }[];
}

import { CivicIssue, DuplicateCheckResult, PriorityEvaluation, CityAnalytics, IssueCategory, IssuePriority, IssueStatus } from '../types/index.ts';

const BASE_URL = '/api';

export async function fetchIssues(filters?: {
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
  deviceId?: string;
}): Promise<CivicIssue[]> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.deviceId) params.append('deviceId', filters.deviceId);

  const res = await fetch(`${BASE_URL}/issues?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load issues: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

export async function fetchIssueByTrackingId(trackingId: string): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId.trim().toUpperCase())}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Issue not found`);
  }
  const json = await res.json();
  return json.data;
}

export async function submitIssueReport(data: {
  title: string;
  description: string;
  category: IssueCategory;
  location: { lat: number; lng: number; address: string; neighborhood?: string };
  photoUrl?: string;
  deviceId?: string;
  overridePriority?: IssuePriority;
}): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit issue');
  }
  const json = await res.json();
  return json.data;
}

export async function checkDuplicateIssue(
  category: IssueCategory,
  lat: number,
  lng: number
): Promise<DuplicateCheckResult> {
  const res = await fetch(`${BASE_URL}/issues/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, lat, lng })
  });

  if (!res.ok) {
    return { isDuplicate: false, distanceMeters: 0 };
  }
  const json = await res.json();
  return json.data;
}

export async function evaluatePriorityPreview(
  category: IssueCategory,
  description: string,
  title: string,
  lat: number,
  lng: number
): Promise<PriorityEvaluation> {
  const res = await fetch(`${BASE_URL}/issues/evaluate-priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, description, title, lat, lng })
  });

  if (!res.ok) {
    return {
      priority: 'Medium',
      score: 30,
      reasons: ['Standard municipal triage'],
      nearbySimilarCount: 0
    };
  }
  const json = await res.json();
  return json.data;
}

export async function updateIssueStatus(
  trackingId: string,
  status: IssueStatus,
  remark?: string,
  actor?: string
): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, remark, actor })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update status');
  }
  const json = await res.json();
  return json.data;
}

export async function updateIssuePriority(
  trackingId: string,
  priority: IssuePriority,
  reason?: string
): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId)}/priority`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority, reason })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update priority');
  }
  const json = await res.json();
  return json.data;
}

export async function assignIssueDepartment(
  trackingId: string,
  department: string,
  crew?: string,
  remark?: string
): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId)}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department, crew, remark })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to assign department');
  }
  const json = await res.json();
  return json.data;
}

export async function upvoteIssue(trackingId: string): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId)}/upvote`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Failed to endorse report');
  }
  const json = await res.json();
  return json.data;
}

export async function addIssueRemark(
  trackingId: string,
  remark: string,
  actor?: string
): Promise<CivicIssue> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(trackingId)}/remark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ remark, actor })
  });
  if (!res.ok) {
    throw new Error('Failed to add remark');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchAnalytics(): Promise<CityAnalytics> {
  const res = await fetch(`${BASE_URL}/analytics`);
  if (!res.ok) {
    throw new Error('Failed to load analytics');
  }
  const json = await res.json();
  return json.data;
}

export async function resetDatabaseSeed(): Promise<void> {
  const res = await fetch(`${BASE_URL}/reset-seed`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to reset seed data');
  }
}

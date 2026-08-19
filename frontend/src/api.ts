const BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  trust_score: number;
  total_actions: number;
  violations: number;
  created_at: string;
}

export interface ActionSummary {
  id: string;
  agent_id: string;
  agent_name: string;
  action_type: string;
  resource_type: string;
  description: string;
  status: string;
  risk_score: number | null;
  decision: string | null;
  created_at: string;
}

export interface Evaluation {
  id: string;
  action_id: string;
  policy_id: string;
  risk_score: number;
  decision: string;
  risk_breakdown: Record<string, number>;
  context_factors: Record<string, unknown>;
  behavioral_factors: Record<string, unknown>;
  explanation: string;
  decided_at: string;
}

export interface Review {
  id: string;
  action_id: string;
  reviewer: string;
  decision: string;
  reason: string;
  decided_at: string;
}

export interface AuditEvent {
  id: string;
  action_id: string | null;
  agent_id: string | null;
  event_type: string;
  actor: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface BehaviorLog {
  id: string;
  agent_id: string;
  event_type: string;
  severity: number;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ActionDetail {
  action: ActionSummary;
  evaluation: Evaluation | null;
  review: Review | null;
  audit_events: AuditEvent[];
  parameters: Record<string, unknown>;
}

export interface AgentProfile extends Agent {
  recent_actions: ActionSummary[];
  behavior_logs: BehaviorLog[];
  risk_trend: number[];
}

export interface DashboardSummary {
  total_actions: number;
  autonomous_count: number;
  confirm_count: number;
  full_review_count: number;
  rejected_count: number;
  approved_count: number;
  pending_reviews: number;
  average_risk: number;
  recent_actions: ActionSummary[];
  agent_stats: Agent[];
}

export interface Policy {
  id: string;
  name: string;
  version: number;
  autonomous_threshold: number;
  confirm_threshold: number;
  risk_weights: Record<string, number>;
  is_active: boolean;
  created_at: string;
}

export interface DemoResult {
  demo_session_id: string;
  actions: { action: ActionSummary; evaluation: Evaluation }[];
  message: string;
}

export const api = {
  dashboard: () => request<DashboardSummary>('/api/v1/dashboard/summary'),
  actions: (params?: string) => request<ActionSummary[]>(`/api/v1/actions${params ? `?${params}` : ''}`),
  action: (id: string) => request<ActionDetail>(`/api/v1/actions/${id}`),
  approve: (id: string, reviewer: string, reason: string) =>
    request<Review>(`/api/v1/actions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewer, reason }),
    }),
  reject: (id: string, reviewer: string, reason: string) =>
    request<Review>(`/api/v1/actions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewer, reason }),
    }),
  execute: (id: string) =>
    request<{ action_id: string; status: string }>(`/api/v1/actions/${id}/execute`, { method: 'POST' }),
  agents: () => request<Agent[]>('/api/v1/agents'),
  agentProfile: (id: string) => request<AgentProfile>(`/api/v1/agents/${id}/profile`),
  policy: () => request<Policy>('/api/v1/policies/active'),
  updatePolicy: (data: Partial<Policy>) =>
    request<Policy>('/api/v1/policies/active', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  runDemo: (scenario = 'all') =>
    request<DemoResult>('/api/v1/demo/run', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
  health: () => request<{ status: string; version: string }>('/health'),
};

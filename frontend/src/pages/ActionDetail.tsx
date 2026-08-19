import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import type { ActionDetail as ActionDetailType } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

export default function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ActionDetailType | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) api.action(id).then(setDetail).catch(e => setError(e.message));
  }, [id]);

  if (error) return <div className="text-sm p-4 rounded-lg" style={{ color: 'var(--accent-red)', background: 'var(--bg-card)' }}>Error: {error}</div>;
  if (!detail) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading action details...</div>;

  const { action, evaluation, review, audit_events, parameters } = detail;

  const breakdownData = evaluation
    ? Object.entries(evaluation.risk_breakdown)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => ({ factor: k.replace(/_/g, ' '), value: v }))
    : [];

  return (
    <div>
      <Link to="/actions" className="text-xs mb-3 inline-block" style={{ color: 'var(--accent-blue)' }}>&larr; Action Feed</Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">{action.action_type.toUpperCase()} {action.resource_type}</h1>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.agent_name} &middot; {new Date(action.created_at).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge score={evaluation?.risk_score} decision={evaluation?.decision} size="lg" />
          <StatusBadge status={action.status} />
        </div>
      </div>

      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{action.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Risk Breakdown Chart */}
        {breakdownData.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Risk Factor Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={breakdownData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={90} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}
                  fill="var(--accent-blue)"
                  label={{ position: 'right', fontSize: 10, fill: 'var(--text-secondary)', formatter: (v: unknown) => `+${Number(v).toFixed(1)}` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Details */}
        <div className="space-y-4">
          {/* Context Factors */}
          {evaluation?.context_factors && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Context Factors</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(evaluation.context_factors).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs px-2 py-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Factors */}
          {evaluation?.behavioral_factors && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Behavioral Factors</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(evaluation.behavioral_factors).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs px-2 py-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{typeof v === 'number' ? v.toFixed(1) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          {Object.keys(parameters).length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Action Parameters</h3>
              <div className="space-y-1">
                {Object.entries(parameters).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs px-2 py-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span className="font-mono">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      {evaluation && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Guardian Explanation</h3>
          {evaluation.explanation.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-relaxed mb-2 last:mb-0" style={{ color: para.startsWith('AI Insight:') ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{para}</p>
          ))}
        </div>
      )}

      {/* Review */}
      {review && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: `1px solid ${review.decision === 'approved' ? 'var(--accent-green)' : 'var(--accent-red)'}40` }}>
          <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Review Decision</h3>
          <div className="flex items-center gap-3">
            <StatusBadge status={review.decision} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>by {review.reviewer}</span>
            {review.reason && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {review.reason}</span>}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {audit_events.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Audit Trail</h3>
          <div className="space-y-1">
            {audit_events.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(e.created_at).toLocaleTimeString()}</span>
                <span className="font-mono font-medium" style={{ color: 'var(--accent-blue)' }}>{e.event_type}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{e.actor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

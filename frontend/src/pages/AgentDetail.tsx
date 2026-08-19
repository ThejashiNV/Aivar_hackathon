import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import type { AgentProfile } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

function trustColor(score: number) {
  if (score >= 60) return 'var(--accent-green)';
  if (score >= 35) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.agentProfile(id).then(setProfile).catch(e => setError(e.message));
      const iv = setInterval(() => api.agentProfile(id).then(setProfile).catch(() => {}), 5000);
      return () => clearInterval(iv);
    }
  }, [id]);

  if (error) return <div className="text-sm p-4 rounded-lg" style={{ color: 'var(--accent-red)', background: 'var(--bg-card)' }}>Error: {error}</div>;
  if (!profile) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading agent profile...</div>;

  const trendData = profile.risk_trend.map((s, i) => ({ idx: i + 1, risk: s }));

  return (
    <div>
      <Link to="/agents" className="text-xs mb-3 inline-block" style={{ color: 'var(--accent-blue)' }}>&larr; All Agents</Link>

      <div className="flex items-start gap-6 mb-6">
        <div>
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.agent_type.toUpperCase()} &middot; {profile.description}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-4xl font-bold" style={{ color: trustColor(profile.trust_score) }}>
            {profile.trust_score.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Trust Score</div>
          <div className="w-32 h-2 rounded-full mt-1" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${profile.trust_score}%`, background: trustColor(profile.trust_score) }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Actions" value={profile.total_actions} />
        <StatCard label="Violations" value={profile.violations} color={profile.violations > 0 ? 'var(--accent-red)' : undefined} />
        <StatCard label="Trust Score" value={profile.trust_score.toFixed(1)} color={trustColor(profile.trust_score)} />
        <StatCard label="Avg Risk" value={trendData.length > 0 ? (trendData.reduce((s, d) => s + d.risk, 0) / trendData.length).toFixed(1) : '—'} />
      </div>

      {/* Risk Trend */}
      {trendData.length > 1 && (
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Risk Score Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <XAxis dataKey="idx" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="risk" stroke="var(--accent-blue)" strokeWidth={2} dot={{ fill: 'var(--accent-blue)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Behavior Log */}
      {profile.behavior_logs.length > 0 && (
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Behavior Timeline</h3>
          <div className="space-y-2">
            {profile.behavior_logs.map(b => (
              <div key={b.id} className="flex items-center gap-3 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleTimeString()}</span>
                <span className="font-mono font-medium" style={{
                  color: b.event_type.includes('violation') || b.event_type.includes('rejected') || b.event_type.includes('suspicious')
                    ? 'var(--accent-red)' : 'var(--accent-green)'
                }}>{b.event_type}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  trust: {(b.details as Record<string, number>).new_trust?.toFixed(1) || '—'} (Δ{(b.details as Record<string, number>).trust_delta?.toFixed(1) || '—'})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Recent Actions</h3>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2 px-2 font-medium">TIME</th>
              <th className="text-left py-2 px-2 font-medium">ACTION</th>
              <th className="text-left py-2 px-2 font-medium">RESOURCE</th>
              <th className="text-left py-2 px-2 font-medium">RISK</th>
              <th className="text-left py-2 px-2 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {profile.recent_actions.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2 px-2" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                <td className="py-2 px-2 font-mono">{a.action_type.toUpperCase()}</td>
                <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                <td className="py-2 px-2"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                <td className="py-2 px-2"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

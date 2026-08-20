import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Bot, TrendingUp, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import type { AgentProfile } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

function trustColor(score: number) {
  if (score >= 60) return 'var(--risk-low)';
  if (score >= 35) return 'var(--risk-medium)';
  return 'var(--risk-high)';
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

  if (error) return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-high)' }} />
      <div className="text-sm" style={{ color: 'var(--risk-high)' }}>Error: {error}</div>
    </div>
  );
  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
    </div>
  );

  const trendData = profile.risk_trend.map((s, i) => ({ idx: i + 1, risk: s }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/agents" className="inline-flex items-center gap-1 text-[12px] mb-5 font-medium transition-colors" style={{ color: 'var(--accent-gold)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> All Agents
      </Link>

      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
              background: 'rgba(212,164,78,0.1)', border: '1px solid rgba(212,164,78,0.15)',
            }}>
              <Bot className="w-7 h-7" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-cream)' }}>{profile.name}</h1>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{profile.agent_type.toUpperCase()} &middot; {profile.description}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: trustColor(profile.trust_score), fontFamily: "'JetBrains Mono', monospace" }}>
              {profile.trust_score.toFixed(1)}
            </div>
            <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>Trust Score</div>
            <div className="w-24 h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--coffee-700)' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${profile.trust_score}%`, background: trustColor(profile.trust_score),
                boxShadow: `0 0 6px ${trustColor(profile.trust_score)}40`,
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Actions', value: profile.total_actions, color: 'var(--accent-gold)' },
          { label: 'Violations', value: profile.violations, color: profile.violations > 0 ? 'var(--risk-high)' : 'var(--risk-low)' },
          { label: 'Trust Score', value: profile.trust_score.toFixed(1), color: trustColor(profile.trust_score) },
          { label: 'Avg Risk', value: trendData.length > 0 ? (trendData.reduce((s, d) => s + d.risk, 0) / trendData.length).toFixed(1) : '—', color: 'var(--accent-caramel)' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-xl font-bold mt-1" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {trendData.length > 1 && (
        <div className="glass-card rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Risk Score Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="idx" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="risk" stroke="var(--accent-gold)" strokeWidth={2} dot={{ fill: 'var(--accent-gold)', r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {profile.behavior_logs.length > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--text-muted)' }}>Behavior Timeline</h3>
          {profile.behavior_logs.map((b, i) => {
            const isNeg = b.event_type.includes('violation') || b.event_type.includes('rejected') || b.event_type.includes('suspicious');
            return (
              <div key={b.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < profile.behavior_logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{
                  background: isNeg ? 'var(--risk-high)' : 'var(--risk-low)',
                  boxShadow: `0 0 6px ${isNeg ? 'rgba(232,93,74,0.3)' : 'rgba(91,185,116,0.3)'}`,
                }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(b.created_at).toLocaleTimeString()}</span>
                <span className="text-[11px] font-semibold" style={{ color: isNeg ? 'var(--risk-high)' : 'var(--risk-low)', fontFamily: "'JetBrains Mono', monospace" }}>{b.event_type}</span>
                <span className="text-[11px] ml-auto" style={{ color: 'var(--text-secondary)' }}>
                  trust: {(b.details as Record<string, number>).new_trust?.toFixed(1) || '—'}
                  <span style={{ color: 'var(--text-muted)' }}> ({(b.details as Record<string, number>).trust_delta > 0 ? '+' : ''}{(b.details as Record<string, number>).trust_delta?.toFixed(1) || '—'})</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--text-muted)' }}>Recent Actions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['TIME', 'ACTION', 'RESOURCE', 'RISK', 'STATUS'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.recent_actions.map(a => (
                <tr key={a.id} className="transition-colors duration-200" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(212,164,78,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="py-2.5 px-3 text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3 text-[11px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-caramel)' }}>{a.action_type.toUpperCase()}</td>
                  <td className="py-2.5 px-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                  <td className="py-2.5 px-3"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                  <td className="py-2.5 px-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

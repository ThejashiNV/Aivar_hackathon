import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Agent } from '../api';

function trustColor(score: number) {
  if (score >= 60) return 'var(--accent-green)';
  if (score >= 35) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  useEffect(() => { api.agents().then(setAgents); const iv = setInterval(() => api.agents().then(setAgents), 5000); return () => clearInterval(iv); }, []);

  return (
    <div>
      <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Agent Profiles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => (
          <Link to={`/agents/${a.id}`} key={a.id}
            className="rounded-xl p-5 transition-colors no-underline"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'inherit' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold">{a.name}</div>
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{a.agent_type}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: trustColor(a.trust_score) }}>
                  {a.trust_score.toFixed(0)}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Trust Score</div>
              </div>
            </div>

            {/* Trust bar */}
            <div className="w-full h-1.5 rounded-full mb-3" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${a.trust_score}%`, background: trustColor(a.trust_score) }} />
            </div>

            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.description}</div>

            <div className="flex gap-4 mt-3">
              <Stat label="Actions" value={a.total_actions} />
              <Stat label="Violations" value={a.violations} color={a.violations > 0 ? 'var(--accent-red)' : undefined} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { ActionSummary } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

export default function ActionFeed() {
  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    api.actions(filter ? `decision=${filter}` : '').then(a => { setActions(a); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Action Feed</h1>
        <div className="flex gap-2">
          {['', 'autonomous', 'confirm', 'full_review'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filter === f ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border)'}`,
              }}>
              {f ? f.replace('_', ' ').toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {error && !actions.length && <div className="text-sm mb-4 p-3 rounded-lg" style={{ color: 'var(--accent-red)', background: 'var(--bg-card)' }}>Failed to load actions: {error}</div>}
      {loading && !actions.length && <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Loading actions...</div>}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-3 px-4 font-medium text-xs">TIME</th>
              <th className="text-left py-3 px-4 font-medium text-xs">AGENT</th>
              <th className="text-left py-3 px-4 font-medium text-xs">ACTION</th>
              <th className="text-left py-3 px-4 font-medium text-xs">RESOURCE</th>
              <th className="text-left py-3 px-4 font-medium text-xs">DESCRIPTION</th>
              <th className="text-left py-3 px-4 font-medium text-xs">RISK</th>
              <th className="text-left py-3 px-4 font-medium text-xs">STATUS</th>
              <th className="text-left py-3 px-4 font-medium text-xs"></th>
            </tr>
          </thead>
          <tbody>
            {actions.map(a => (
              <tr key={a.id} className="transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                <td className="py-3 px-4 text-xs font-medium">{a.agent_name}</td>
                <td className="py-3 px-4 text-xs font-mono">{a.action_type.toUpperCase()}</td>
                <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                <td className="py-3 px-4 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{a.description}</td>
                <td className="py-3 px-4"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                <td className="py-3 px-4">
                  <Link to={`/actions/${a.id}`} className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>View</Link>
                </td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet. Run the demo to generate actions.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

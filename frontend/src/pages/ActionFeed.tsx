import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ExternalLink } from 'lucide-react';
import { api } from '../api';
import type { ActionSummary } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

const filters = [
  { key: '', label: 'All' },
  { key: 'autonomous', label: 'Autonomous' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'full_review', label: 'Full Review' },
];

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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
          }}>
            <Activity className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-cream)' }}>Action Feed</h1>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Real-time AI agent action monitoring</p>
          </div>
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 tracking-wide"
              style={{
                background: filter === f.key ? 'rgba(212,164,78,0.15)' : 'var(--glass-bg)',
                color: filter === f.key ? 'var(--accent-gold)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f.key ? 'rgba(212,164,78,0.3)' : 'var(--glass-border)'}`,
              }}>
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {error && !actions.length && (
        <div className="glass-card rounded-2xl p-4 mb-4 text-sm" style={{ color: 'var(--risk-high)' }}>Failed to load actions: {error}</div>
      )}
      {loading && !actions.length && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['TIME', 'AGENT', 'ACTION', 'RESOURCE', 'DESCRIPTION', 'RISK', 'STATUS', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((a, i) => (
                <motion.tr key={a.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="transition-colors duration-200 cursor-pointer group"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(212,164,78,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="py-3.5 px-4 text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                  <td className="py-3.5 px-4 text-[12px] font-medium" style={{ color: 'var(--text-cream)' }}>{a.agent_name}</td>
                  <td className="py-3.5 px-4 text-[11px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-caramel)' }}>{a.action_type.toUpperCase()}</td>
                  <td className="py-3.5 px-4 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                  <td className="py-3.5 px-4 text-[11px] max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{a.description}</td>
                  <td className="py-3.5 px-4"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                  <td className="py-3.5 px-4"><StatusBadge status={a.status} /></td>
                  <td className="py-3.5 px-4">
                    <Link to={`/actions/${a.id}`} className="inline-flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-gold)' }}>
                      <ExternalLink className="w-3 h-3" /> View
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {actions.length === 0 && !loading && (
                <tr><td colSpan={8} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet. Run the demo to generate actions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

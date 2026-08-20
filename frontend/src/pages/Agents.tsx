import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Bot, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import type { Agent } from '../api';

function trustColor(score: number) {
  if (score >= 60) return 'var(--risk-low)';
  if (score >= 35) return 'var(--risk-medium)';
  return 'var(--risk-high)';
}

const agentIcons: Record<string, string> = {
  finance: '\u{1F4B0}',
  support: '\u{1F3A7}',
  data: '\u{1F4CA}',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => api.agents().then(a => { setAgents(a); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false));
    load(); const iv = setInterval(load, 5000); return () => clearInterval(iv);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
        }}>
          <Users className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-cream)' }}>Agent Profiles</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{agents.length} registered AI agents</p>
        </div>
      </div>

      {error && !agents.length && (
        <div className="glass-card rounded-2xl p-4 mb-4 text-sm" style={{ color: 'var(--risk-high)' }}>Failed to load agents: {error}</div>
      )}
      {loading && !agents.length && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a, i) => (
          <motion.div key={a.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
            <Link to={`/agents/${a.id}`}
              className="glass-card glass-card-hover rounded-2xl p-6 block no-underline group"
              style={{ color: 'inherit' }}>
              {/* Agent Identity */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{
                    background: 'rgba(212,164,78,0.1)',
                    border: '1px solid rgba(212,164,78,0.15)',
                  }}>
                    {agentIcons[a.agent_type] || <Bot className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold" style={{ color: 'var(--text-cream)' }}>{a.name}</div>
                    <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{a.agent_type}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-gold)' }} />
              </div>

              {/* Trust Score */}
              <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Trust Score</span>
                  <span className="text-2xl font-bold" style={{ color: trustColor(a.trust_score), fontFamily: "'JetBrains Mono', monospace" }}>
                    {a.trust_score.toFixed(0)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--coffee-700)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${a.trust_score}%`,
                    background: `linear-gradient(90deg, ${trustColor(a.trust_score)}, ${trustColor(a.trust_score)}cc)`,
                    boxShadow: `0 0 8px ${trustColor(a.trust_score)}40`,
                  }} />
                </div>
              </div>

              <div className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.description}</div>

              {/* Stats */}
              <div className="flex gap-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-cream)', fontFamily: "'JetBrains Mono', monospace" }}>{a.total_actions}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Violations</div>
                  <div className="text-sm font-bold flex items-center gap-1" style={{
                    color: a.violations > 0 ? 'var(--risk-high)' : 'var(--risk-low)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {a.violations > 0 && <ShieldAlert className="w-3 h-3" />}
                    {a.violations}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

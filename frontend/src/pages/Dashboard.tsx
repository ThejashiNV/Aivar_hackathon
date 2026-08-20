import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, Activity, XCircle, Clock, Zap, Eye, TrendingUp } from 'lucide-react';
import { api } from '../api';
import type { DashboardSummary } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

const PIE_COLORS = ['var(--risk-low)', 'var(--risk-medium)', 'var(--risk-high)'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
};

function riskColor(score: number) {
  if (score <= 30) return 'var(--risk-low)';
  if (score <= 60) return 'var(--risk-medium)';
  return 'var(--risk-high)';
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const load = () => {
    api.dashboard().then(d => { setData(d); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  if (error && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="glass-card rounded-2xl p-6 text-center">
        <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-high)' }} />
        <div className="text-sm" style={{ color: 'var(--risk-high)' }}>Failed to load dashboard: {error}</div>
      </div>
    </div>
  );
  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        Loading Guardian AI...
      </div>
    </div>
  );

  const pieData = [
    { name: 'Autonomous', value: data.autonomous_count },
    { name: 'Confirm', value: data.confirm_count },
    { name: 'Full Review', value: data.full_review_count },
  ].filter(d => d.value > 0);

  const trustData = data.agent_stats.map(a => ({
    name: a.name.replace('Agent', ''),
    trust: a.trust_score,
  }));

  const totalDecisions = data.autonomous_count + data.confirm_count + data.full_review_count;

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ minHeight: '340px' }}>
        {/* Background layers with parallax */}
        <div className="absolute inset-0 hero-gradient" style={{
          transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0003})`,
          transformOrigin: 'center top',
        }} />
        <div className="absolute inset-0 hero-grid" style={{
          transform: `translateY(${scrollY * 0.15}px)`,
          opacity: Math.max(0, 1 - scrollY * 0.003),
        }} />

        {/* Floating orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{
          background: 'radial-gradient(circle, rgba(212,164,78,0.08) 0%, transparent 70%)',
          top: '-100px', right: '-50px',
          transform: `translateY(${scrollY * 0.2}px)`,
          animation: 'pulse-glow 6s ease-in-out infinite',
        }} />
        <div className="absolute w-[300px] h-[300px] rounded-full" style={{
          background: 'radial-gradient(circle, rgba(164,107,53,0.06) 0%, transparent 70%)',
          bottom: '-80px', left: '10%',
          transform: `translateY(${-scrollY * 0.1}px)`,
          animation: 'pulse-glow 8s ease-in-out infinite 2s',
        }} />

        {/* Hero content */}
        <div className="relative z-10 px-4 md:px-8 pt-10 pb-8">
          <motion.div initial="hidden" animate="visible" className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
                boxShadow: '0 0 24px rgba(212,164,78,0.3)',
              }}>
                <Shield className="w-7 h-7" style={{ color: 'var(--bg-deep)' }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Guardian AI</h1>
                <p className="text-[11px] tracking-[0.15em] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>
                  AI Agent Governance & Risk Control
                </p>
              </div>
            </motion.div>

            {/* Hero KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {[
                { icon: Activity, label: 'Total Actions', value: data.total_actions, color: 'var(--accent-gold)' },
                { icon: Zap, label: 'Autonomous', value: data.autonomous_count, color: 'var(--risk-low)' },
                { icon: Eye, label: 'Confirmations', value: data.confirm_count, color: 'var(--risk-medium)' },
                { icon: Shield, label: 'Full Reviews', value: data.full_review_count, color: 'var(--risk-high)' },
                { icon: XCircle, label: 'Rejected', value: data.rejected_count, color: 'var(--risk-high)' },
                { icon: Clock, label: 'Pending', value: data.pending_reviews, color: 'var(--accent-orange)' },
              ].map((kpi, i) => (
                <motion.div key={kpi.label} variants={fadeUp} custom={i + 1}
                  className="glass-card rounded-2xl p-4 stat-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10 px-4 md:px-8 pb-8 -mt-2" style={{
        background: `linear-gradient(180deg, transparent 0%, var(--bg-deep) 40px)`,
      }}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Charts Row */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Decision Distribution */}
            <motion.div variants={fadeUp} custom={0} className="glass-card rounded-2xl p-5">
              <h3 className="text-[11px] font-semibold mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Decision Distribution</h3>
              <div className="text-[10px] mb-3" style={{ color: 'var(--coffee-500)' }}>{totalDecisions} total decisions</div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" strokeWidth={0}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{
                      background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: 12, color: 'var(--text-primary)',
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet</div>
              )}
            </motion.div>

            {/* Risk Gauge */}
            <motion.div variants={fadeUp} custom={1} className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
              <h3 className="text-[11px] font-semibold mb-1 uppercase tracking-[0.12em] self-start" style={{ color: 'var(--text-muted)' }}>System Risk Level</h3>
              <div className="text-[10px] mb-4 self-start" style={{ color: 'var(--coffee-500)' }}>Average across all actions</div>
              <div className="relative w-36 h-36 mb-2">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--coffee-700)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="245" strokeDashoffset="82" transform="rotate(135 60 60)" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={riskColor(data.average_risk)} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="245" strokeDashoffset={245 - (data.average_risk / 100) * 163} transform="rotate(135 60 60)"
                    style={{ filter: `drop-shadow(0 0 6px ${riskColor(data.average_risk)})`, transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: riskColor(data.average_risk), fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.average_risk.toFixed(1)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                </div>
              </div>
              <div className="flex gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--risk-low)' }} />Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--risk-medium)' }} />Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--risk-high)' }} />High</span>
              </div>
            </motion.div>

            {/* Agent Trust */}
            <motion.div variants={fadeUp} custom={2} className="glass-card rounded-2xl p-5">
              <h3 className="text-[11px] font-semibold mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Agent Trust Scores</h3>
              <div className="text-[10px] mb-3" style={{ color: 'var(--coffee-500)' }}>{data.agent_stats.length} active agents</div>
              {trustData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trustData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={55} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{
                      background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: 12, color: 'var(--text-primary)',
                    }} />
                    <Bar dataKey="trust" radius={[0, 6, 6, 0]}>
                      {trustData.map((d, i) => (
                        <Cell key={i} fill={d.trust >= 60 ? 'var(--risk-low)' : d.trust >= 35 ? 'var(--risk-medium)' : 'var(--risk-high)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: 'var(--text-muted)' }}>No agents</div>
              )}
            </motion.div>
          </motion.div>

          {/* Recent Actions */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Recent Actions</h3>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--coffee-500)' }}>Real-time action monitoring</div>
              </div>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['TIME', 'AGENT', 'ACTION', 'RESOURCE', 'RISK', 'STATUS'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 font-medium text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_actions.map(a => (
                    <tr key={a.id} className="transition-colors duration-200" style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(212,164,78,0.04)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-3 text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-3 text-[12px] font-medium" style={{ color: 'var(--text-cream)' }}>{a.agent_name}</td>
                      <td className="py-3 px-3 text-[11px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-caramel)' }}>{a.action_type.toUpperCase()}</td>
                      <td className="py-3 px-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                      <td className="py-3 px-3"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                      <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                  {data.recent_actions.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet. Run the demo to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

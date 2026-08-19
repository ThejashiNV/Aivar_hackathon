import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, Activity, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { api } from '../api';
import type { DashboardSummary } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

const COLORS = ['var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-red)', 'var(--accent-purple)'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.dashboard().then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  if (loading || !data) return <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const pieData = [
    { name: 'Autonomous', value: data.autonomous_count },
    { name: 'Confirm', value: data.confirm_count },
    { name: 'Full Review', value: data.full_review_count },
  ].filter(d => d.value > 0);

  const trustData = data.agent_stats.map(a => ({
    name: a.name.replace('Agent', ''),
    trust: a.trust_score,
    violations: a.violations,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Guardian AI Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Adaptive Autonomy Control Plane — Real-time governance overview
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI icon={Activity} label="Total Actions" value={data.total_actions} color="var(--accent-blue)" />
        <KPI icon={CheckCircle} label="Autonomous" value={data.autonomous_count} color="var(--accent-green)" />
        <KPI icon={AlertTriangle} label="Confirmations" value={data.confirm_count} color="var(--accent-yellow)" />
        <KPI icon={Shield} label="Full Reviews" value={data.full_review_count} color="var(--accent-red)" />
        <KPI icon={XCircle} label="Rejected" value={data.rejected_count} color="var(--accent-red)" />
        <KPI icon={Clock} label="Pending" value={data.pending_reviews} color="var(--accent-orange)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Decision Distribution */}
        <Card title="Decision Distribution">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet</div>
          )}
        </Card>

        {/* Average Risk */}
        <Card title="Risk Overview">
          <div className="flex flex-col items-center justify-center h-[180px]">
            <div className="text-4xl font-bold mb-1" style={{ color: data.average_risk > 60 ? 'var(--accent-red)' : data.average_risk > 30 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
              {data.average_risk.toFixed(1)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Average Risk Score</div>
            <div className="mt-3 w-full max-w-[200px] h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${data.average_risk}%`, background: data.average_risk > 60 ? 'var(--accent-red)' : data.average_risk > 30 ? 'var(--accent-yellow)' : 'var(--accent-green)' }} />
            </div>
          </div>
        </Card>

        {/* Agent Trust */}
        <Card title="Agent Trust Scores">
          {trustData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trustData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={60} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="trust" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: 'var(--text-muted)' }}>No agents</div>
          )}
        </Card>
      </div>

      {/* Recent Actions */}
      <Card title="Recent Actions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 px-2 font-medium text-xs">TIME</th>
                <th className="text-left py-2 px-2 font-medium text-xs">AGENT</th>
                <th className="text-left py-2 px-2 font-medium text-xs">ACTION</th>
                <th className="text-left py-2 px-2 font-medium text-xs">RESOURCE</th>
                <th className="text-left py-2 px-2 font-medium text-xs">RISK</th>
                <th className="text-left py-2 px-2 font-medium text-xs">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_actions.map(a => (
                <tr key={a.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                  <td className="py-2 px-2 text-xs font-medium">{a.agent_name}</td>
                  <td className="py-2 px-2 text-xs">{a.action_type.toUpperCase()}</td>
                  <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{a.resource_type}</td>
                  <td className="py-2 px-2"><RiskBadge score={a.risk_score} decision={a.decision} /></td>
                  <td className="py-2 px-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: { icon: typeof Activity; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';
import { api } from '../api';
import type { DemoResult } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { icon: CheckCircle, color: 'var(--accent-green)', label: 'Low Risk Read', desc: 'Read single customer profile → Autonomous' },
  { icon: AlertTriangle, color: 'var(--accent-yellow)', label: 'Medium Risk Update', desc: 'Update billing info → Confirm' },
  { icon: ShieldAlert, color: 'var(--accent-red)', label: 'High Risk Delete', desc: 'Bulk delete 4500 records → Full Review → Reject' },
  { icon: TrendingUp, color: 'var(--accent-purple)', label: 'Behavioral Escalation', desc: 'Same update, higher risk due to degraded trust' },
];

export default function Demo() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const runDemo = async () => {
    setRunning(true);
    setResult(null);
    setError('');
    setCurrentStep(0);

    try {
      const interval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, 3));
      }, 800);

      const res = await api.runDemo('all');
      clearInterval(interval);
      setCurrentStep(3);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo failed');
      setCurrentStep(-1);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Guardian AI Live Demo</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Watch Guardian evaluate AI agent actions in real-time, demonstrating adaptive autonomy control
          with behavioral escalation.
        </p>
      </div>

      {/* Steps Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center transition-all"
            style={{
              background: currentStep >= i ? `${s.color}15` : 'var(--bg-card)',
              border: `1px solid ${currentStep >= i ? `${s.color}50` : 'var(--border)'}`,
              opacity: currentStep >= 0 && currentStep < i ? 0.4 : 1,
            }}>
            <s.icon className="w-6 h-6 mx-auto mb-1.5" style={{ color: s.color }} />
            <div className="text-xs font-semibold mb-0.5" style={{ color: s.color }}>{s.label}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Run Button */}
      {!result && (
        <div className="text-center mb-6">
          <button onClick={runDemo} disabled={running}
            className="px-8 py-3 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2"
            style={{ background: running ? 'var(--border)' : 'var(--accent-blue)', color: '#fff' }}>
            <Play className="w-4 h-4" />
            {running ? 'Running Demo...' : 'Run Live Demo'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-red)' }}>
          <div className="text-sm" style={{ color: 'var(--accent-red)' }}>Error: {error}</div>
          <button onClick={() => { setError(''); setCurrentStep(-1); }}
            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div className="text-center mb-4">
            <div className="text-xs font-semibold uppercase" style={{ color: 'var(--accent-green)' }}>Demo Complete</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.message}</div>
          </div>

          <div className="space-y-3 mb-6">
            {result.actions.map((a, i) => (
              <div key={a.action.id} className="rounded-xl p-4 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onClick={() => navigate(`/actions/${a.action.id}`)}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: STEPS[i]?.color + '20', color: STEPS[i]?.color }}>{i + 1}</span>
                  <span className="text-sm font-medium">{STEPS[i]?.label}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <RiskBadge score={a.evaluation.risk_score} decision={a.evaluation.decision} size="md" />
                    <StatusBadge status={a.action.status} />
                  </div>
                </div>

                <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{a.action.description}</div>

                {/* Mini breakdown */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(a.evaluation.risk_breakdown)
                    .filter(([, v]) => v > 0)
                    .sort(([, x], [, y]) => y - x)
                    .slice(0, 4)
                    .map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        {k.replace(/_/g, ' ')}: +{v.toFixed(1)}
                      </span>
                    ))}
                </div>

                {/* Explanation excerpt */}
                <div className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {a.evaluation.explanation.split('.').slice(0, 2).join('.') + '.'}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => { setResult(null); setCurrentStep(-1); }}
              className="px-6 py-2 rounded-lg text-xs font-medium mr-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Run Again
            </button>
            <button onClick={() => navigate('/')}
              className="px-6 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}>
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, CheckCircle, AlertTriangle, ShieldAlert, TrendingUp, Zap } from 'lucide-react';
import { api } from '../api';
import type { DemoResult } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { icon: CheckCircle, color: 'var(--risk-low)', label: 'Low Risk Read', desc: 'Read single customer profile', decision: 'Autonomous' },
  { icon: AlertTriangle, color: 'var(--risk-medium)', label: 'Medium Risk Update', desc: 'Update billing info', decision: 'Confirm' },
  { icon: ShieldAlert, color: 'var(--risk-high)', label: 'High Risk Delete', desc: 'Bulk delete 4500 records', decision: 'Full Review' },
  { icon: TrendingUp, color: 'var(--accent-purple)', label: 'Behavioral Escalation', desc: 'Same update, trust degraded', decision: 'Escalated' },
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
          boxShadow: '0 0 32px rgba(212,164,78,0.3)',
        }}>
          <Zap className="w-7 h-7" style={{ color: 'var(--bg-deep)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gradient">Guardian AI Live Demo</h1>
        <p className="text-[12px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Watch Guardian evaluate AI agent actions in real-time, demonstrating adaptive autonomy control with behavioral escalation.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {STEPS.map((s, i) => (
          <motion.div key={i}
            animate={{ opacity: currentStep >= 0 && currentStep < i ? 0.3 : 1, scale: currentStep === i ? 1.03 : 1 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-4 text-center transition-all"
            style={{
              borderColor: currentStep >= i ? `${s.color}50` : 'var(--glass-border)',
              boxShadow: currentStep >= i ? `0 0 16px ${s.color}15` : 'none',
            }}>
            <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: s.color }} />
            <div className="text-[11px] font-bold mb-0.5" style={{ color: s.color }}>{s.label}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
            <div className="text-[9px] mt-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.decision}</div>
          </motion.div>
        ))}
      </div>

      {!result && (
        <div className="text-center mb-8">
          <button onClick={runDemo} disabled={running}
            className="px-10 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 inline-flex items-center gap-3"
            style={{
              background: running ? 'var(--coffee-700)' : 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-500) 100%)',
              color: running ? 'var(--text-muted)' : 'var(--bg-deep)',
              boxShadow: running ? 'none' : '0 4px 24px rgba(212,164,78,0.3)',
            }}>
            {running ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
                Running Demo...
              </>
            ) : (
              <><Play className="w-5 h-5" /> Run Live Demo</>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="text-center mb-6 glass-card rounded-2xl p-5">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-high)' }} />
          <div className="text-sm mb-3" style={{ color: 'var(--risk-high)' }}>Error: {error}</div>
          <button onClick={() => { setError(''); setCurrentStep(-1); }}
            className="px-5 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: 'rgba(212,164,78,0.15)', color: 'var(--accent-gold)' }}>
            Try Again
          </button>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-[12px] font-semibold">Demo Complete</span>
            </div>
            <div className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{result.message}</div>
          </div>

          <div className="space-y-3 mb-6">
            {result.actions.map((a, i) => (
              <motion.div key={a.action.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer"
                onClick={() => navigate(`/actions/${a.action.id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold" style={{
                    background: `${STEPS[i]?.color}15`, color: STEPS[i]?.color, border: `1px solid ${STEPS[i]?.color}25`,
                  }}>{i + 1}</div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-cream)' }}>{STEPS[i]?.label}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <RiskBadge score={a.evaluation.risk_score} decision={a.evaluation.decision} size="md" />
                    <StatusBadge status={a.action.status} />
                  </div>
                </div>

                <div className="text-[12px] mb-3" style={{ color: 'var(--text-secondary)' }}>{a.action.description}</div>

                <div className="flex gap-2 flex-wrap mb-2">
                  {Object.entries(a.evaluation.risk_breakdown)
                    .filter(([, v]) => v > 0)
                    .sort(([, x], [, y]) => y - x)
                    .slice(0, 4)
                    .map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2.5 py-1 rounded-lg font-medium" style={{
                        background: 'rgba(44,32,24,0.5)', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {k.replace(/_/g, ' ')}: <span style={{ color: 'var(--accent-caramel)' }}>+{v.toFixed(1)}</span>
                      </span>
                    ))}
                </div>

                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {a.evaluation.explanation.split('.').slice(0, 2).join('.') + '.'}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center flex gap-3 justify-center">
            <button onClick={() => { setResult(null); setCurrentStep(-1); }}
              className="px-6 py-3 rounded-xl text-[12px] font-semibold"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              Run Again
            </button>
            <button onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl text-[12px] font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-500) 100%)', color: 'var(--bg-deep)' }}>
              View Dashboard
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

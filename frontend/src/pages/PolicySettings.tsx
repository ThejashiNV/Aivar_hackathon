import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { api } from '../api';
import type { Policy } from '../api';

export default function PolicySettings() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [autonomousThreshold, setAutonomousThreshold] = useState(30);
  const [confirmThreshold, setConfirmThreshold] = useState(60);
  const [actionWeight, setActionWeight] = useState(0.45);
  const [contextWeight, setContextWeight] = useState(0.15);
  const [behaviorWeight, setBehaviorWeight] = useState(0.40);

  const load = () => {
    api.policy()
      .then(p => {
        setPolicy(p);
        setAutonomousThreshold(p.autonomous_threshold);
        setConfirmThreshold(p.confirm_threshold);
        setActionWeight(p.risk_weights.action_weight ?? 0.45);
        setContextWeight(p.risk_weights.context_weight ?? 0.15);
        setBehaviorWeight(p.risk_weights.behavior_weight ?? 0.40);
        setError('');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (autonomousThreshold >= confirmThreshold) {
      setError('Autonomous threshold must be less than Confirm threshold');
      return;
    }
    const totalWeight = actionWeight + contextWeight + behaviorWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setError(`Risk weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.updatePolicy({
        autonomous_threshold: autonomousThreshold,
        confirm_threshold: confirmThreshold,
        risk_weights: { action_weight: actionWeight, context_weight: contextWeight, behavior_weight: behaviorWeight },
      });
      setPolicy(updated);
      setSuccess(`Policy updated to version ${updated.version}`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (policy) {
      setAutonomousThreshold(policy.autonomous_threshold);
      setConfirmThreshold(policy.confirm_threshold);
      setActionWeight(policy.risk_weights.action_weight ?? 0.45);
      setContextWeight(policy.risk_weights.context_weight ?? 0.15);
      setBehaviorWeight(policy.risk_weights.behavior_weight ?? 0.40);
      setError('');
    }
  };

  if (error && !policy) return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-high)' }} />
      <div className="text-sm" style={{ color: 'var(--risk-high)' }}>Failed to load policy: {error}</div>
    </div>
  );
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
    </div>
  );

  const totalWeight = actionWeight + contextWeight + behaviorWeight;
  const weightsValid = Math.abs(totalWeight - 1.0) <= 0.01;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
        }}>
          <Settings className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-cream)' }}>Governance Policy</h1>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Version {policy?.version} &middot; Configure risk thresholds and scoring weights
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: 'var(--risk-high-bg)', color: 'var(--risk-high)', border: '1px solid rgba(232,93,74,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: 'var(--risk-low-bg)', color: 'var(--risk-low)', border: '1px solid rgba(91,185,116,0.2)' }}>
          <CheckCircle className="w-4 h-4 shrink-0" />{success}
        </div>
      )}

      {/* Decision Thresholds */}
      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Decision Thresholds</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Autonomous Threshold</label>
              <span className="text-[14px] font-bold" style={{ color: 'var(--risk-low)', fontFamily: "'JetBrains Mono', monospace" }}>{autonomousThreshold}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={autonomousThreshold}
              onChange={e => setAutonomousThreshold(Number(e.target.value))}
              className="w-full" />
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Score 0&ndash;{autonomousThreshold}: auto-execute</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Confirm Threshold</label>
              <span className="text-[14px] font-bold" style={{ color: 'var(--risk-medium)', fontFamily: "'JetBrains Mono', monospace" }}>{confirmThreshold}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={confirmThreshold}
              onChange={e => setConfirmThreshold(Number(e.target.value))}
              className="w-full" />
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Score {autonomousThreshold + 1}&ndash;{confirmThreshold}: user confirmation. Above {confirmThreshold}: full review.</div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="mt-5 flex h-4 rounded-xl overflow-hidden text-[9px] font-bold tracking-wider">
          <div style={{ width: `${autonomousThreshold}%`, background: 'var(--risk-low)' }} className="flex items-center justify-center text-white">AUTO</div>
          <div style={{ width: `${confirmThreshold - autonomousThreshold}%`, background: 'var(--risk-medium)' }} className="flex items-center justify-center text-white">CONFIRM</div>
          <div style={{ width: `${100 - confirmThreshold}%`, background: 'var(--risk-high)' }} className="flex items-center justify-center text-white">REVIEW</div>
        </div>
      </div>

      {/* Risk Weights */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-5" style={{ color: 'var(--text-muted)' }}>
          Risk Scoring Weights <span style={{ color: weightsValid ? 'var(--risk-low)' : 'var(--risk-high)' }}>(must sum to 1.0)</span>
        </h3>

        <div className="space-y-5">
          {[
            { label: 'Action Risk Weight', value: actionWeight, onChange: setActionWeight, color: 'var(--accent-gold)' },
            { label: 'Context Risk Weight', value: contextWeight, onChange: setContextWeight, color: 'var(--accent-purple)' },
            { label: 'Behavioral Risk Weight', value: behaviorWeight, onChange: setBehaviorWeight, color: 'var(--accent-orange)' },
          ].map(w => (
            <div key={w.label}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{w.label}</label>
                <span className="text-[14px] font-bold" style={{ color: w.color, fontFamily: "'JetBrains Mono', monospace" }}>{w.value.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={w.value}
                onChange={e => w.onChange(Number(e.target.value))}
                className="w-full" />
            </div>
          ))}
        </div>

        <div className="mt-4 text-[12px] font-semibold" style={{
          color: weightsValid ? 'var(--risk-low)' : 'var(--risk-high)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Total: {totalWeight.toFixed(2)} {weightsValid ? '✓' : '✗'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-500) 100%)',
            color: 'var(--bg-deep)',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 4px 16px rgba(212,164,78,0.2)',
          }}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-medium transition-all"
          style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
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
        risk_weights: {
          action_weight: actionWeight,
          context_weight: contextWeight,
          behavior_weight: behaviorWeight,
        },
      });
      setPolicy(updated);
      setSuccess(`Policy updated to version ${updated.version}`);
      setTimeout(() => setSuccess(''), 3000);
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

  if (error && !policy) return <div className="text-sm p-4 rounded-lg" style={{ color: 'var(--accent-red)', background: 'var(--bg-card)' }}>Failed to load policy: {error}</div>;
  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading policy...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Governance Policy</h1>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Version {policy?.version} &middot; Configure risk thresholds and scoring weights
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--accent-red)15', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--accent-green)15', border: '1px solid var(--accent-green)', color: 'var(--accent-green)' }}>{success}</div>}

      {/* Decision Thresholds */}
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Decision Thresholds</h3>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Autonomous Threshold (0 &ndash; score &le; {autonomousThreshold})</label>
              <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>{autonomousThreshold}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={autonomousThreshold}
              onChange={e => setAutonomousThreshold(Number(e.target.value))}
              className="w-full accent-[var(--accent-green)]" />
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Actions scoring at or below this threshold execute automatically</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Confirm Threshold ({autonomousThreshold + 1} &ndash; score &le; {confirmThreshold})</label>
              <span className="text-sm font-bold" style={{ color: 'var(--accent-yellow)' }}>{confirmThreshold}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={confirmThreshold}
              onChange={e => setConfirmThreshold(Number(e.target.value))}
              className="w-full accent-[var(--accent-yellow)]" />
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Actions scoring between thresholds require user confirmation. Above this requires full review.</div>
          </div>
        </div>

        {/* Visual threshold bar */}
        <div className="mt-4 flex h-3 rounded-full overflow-hidden text-[8px] font-bold">
          <div style={{ width: `${autonomousThreshold}%`, background: 'var(--accent-green)' }} className="flex items-center justify-center text-white">AUTO</div>
          <div style={{ width: `${confirmThreshold - autonomousThreshold}%`, background: 'var(--accent-yellow)' }} className="flex items-center justify-center text-white">CONFIRM</div>
          <div style={{ width: `${100 - confirmThreshold}%`, background: 'var(--accent-red)' }} className="flex items-center justify-center text-white">REVIEW</div>
        </div>
      </div>

      {/* Risk Weights */}
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Risk Scoring Weights (must sum to 1.0)</h3>

        <div className="space-y-4">
          <WeightInput label="Action Risk Weight" value={actionWeight} onChange={setActionWeight} color="var(--accent-blue)" />
          <WeightInput label="Context Risk Weight" value={contextWeight} onChange={setContextWeight} color="var(--accent-purple)" />
          <WeightInput label="Behavioral Risk Weight" value={behaviorWeight} onChange={setBehaviorWeight} color="var(--accent-orange)" />
        </div>

        <div className="mt-3 text-xs" style={{ color: Math.abs(actionWeight + contextWeight + behaviorWeight - 1.0) > 0.01 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
          Total: {(actionWeight + contextWeight + behaviorWeight).toFixed(2)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: 'var(--accent-blue)', color: '#fff', opacity: saving ? 0.5 : 1 }}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}

function WeightInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full" style={{ accentColor: color }} />
    </div>
  );
}

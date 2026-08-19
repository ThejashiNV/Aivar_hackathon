import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { ActionSummary, ActionDetail } from '../api';
import RiskBadge from '../components/RiskBadge';

export default function ReviewQueue() {
  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [selected, setSelected] = useState<ActionDetail | null>(null);
  const [reviewer, setReviewer] = useState('admin');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => {
    api.actions('status=pending').then(setActions);
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  const handleSelect = async (id: string) => {
    const detail = await api.action(id);
    setSelected(detail);
    setReason('');
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setProcessing(true);
    try {
      if (action === 'approve') {
        await api.approve(selected.action.id, reviewer, reason);
      } else {
        await api.reject(selected.action.id, reviewer, reason);
      }
      setSelected(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-3rem)]">
      {/* Queue List */}
      <div className="w-80 shrink-0 rounded-xl overflow-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Review Queue ({actions.length})</h2>
        </div>
        {actions.map(a => (
          <div key={a.id} onClick={() => handleSelect(a.id)}
            className="p-3 cursor-pointer transition-colors border-b"
            style={{
              borderColor: 'var(--border)',
              background: selected?.action.id === a.id ? 'var(--bg-hover)' : 'transparent',
            }}
            onMouseOver={e => { if (selected?.action.id !== a.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseOut={e => { if (selected?.action.id !== a.id) e.currentTarget.style.background = 'transparent'; }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{a.agent_name}</span>
              <RiskBadge score={a.risk_score} decision={a.decision} />
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {a.action_type.toUpperCase()} {a.resource_type}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{a.description}</div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No pending reviews</div>
        )}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 rounded-xl overflow-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {selected ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">{selected.action.action_type.toUpperCase()} {selected.action.resource_type}</h2>
              <RiskBadge score={selected.evaluation?.risk_score} decision={selected.evaluation?.decision} size="lg" />
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{selected.action.description}</p>

            {/* Risk Breakdown */}
            {selected.evaluation && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Risk Breakdown</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selected.evaluation.risk_breakdown)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
                        <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{k.replace('_', ' ')}</span>
                        <span className="text-xs font-bold" style={{ color: v > 10 ? 'var(--accent-red)' : v > 5 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>+{v.toFixed(1)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {selected.evaluation && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Explanation</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.evaluation.explanation}</p>
              </div>
            )}

            {/* Behavioral Factors */}
            {selected.evaluation?.behavioral_factors && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Behavioral Factors</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selected.evaluation.behavioral_factors).map(([k, v]) => (
                    <div key={k} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{k.replace('_', ' ')}</div>
                      <div className="text-sm font-bold">{typeof v === 'number' ? v.toFixed(1) : String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approve / Reject */}
            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-3 mb-3">
                <input
                  value={reviewer} onChange={e => setReviewer(e.target.value)}
                  placeholder="Reviewer name"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <textarea
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-3 resize-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <div className="flex gap-3">
                <button onClick={() => handleAction('approve')} disabled={processing}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'var(--accent-green)', color: '#fff' }}>
                  Approve
                </button>
                <button onClick={() => handleAction('reject')} disabled={processing}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'var(--accent-red)', color: '#fff' }}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
            Select an action to review
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Shield, Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import type { ActionSummary, ActionDetail } from '../api';
import RiskBadge from '../components/RiskBadge';

export default function ReviewQueue() {
  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [selected, setSelected] = useState<ActionDetail | null>(null);
  const [reviewer, setReviewer] = useState('admin');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = () => {
    api.actions('status=pending').then(setActions);
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  const handleSelect = async (id: string) => {
    const detail = await api.action(id);
    setSelected(detail);
    setReason('');
    setFeedback(null);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setProcessing(true);
    setFeedback(null);
    try {
      if (action === 'approve') {
        await api.approve(selected.action.id, reviewer, reason);
      } else {
        await api.reject(selected.action.id, reviewer, reason);
      }
      setFeedback({ type: 'success', msg: `Action ${action === 'approve' ? 'approved' : 'rejected'} successfully` });
      setTimeout(() => { setSelected(null); setFeedback(null); load(); }, 1200);
    } catch (e: unknown) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Action failed' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--risk-high) 0%, var(--coffee-600) 100%)',
        }}>
          <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-cream)' }}>Review Queue</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {actions.length} action{actions.length !== 1 ? 's' : ''} pending human review
          </p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* Queue List */}
        <div className="w-80 shrink-0 glass-card rounded-2xl overflow-auto flex flex-col">
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Pending Actions</span>
            {actions.length > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{
                background: 'var(--risk-high-bg)', color: 'var(--risk-high)',
              }}>{actions.length}</span>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {actions.map(a => (
              <div key={a.id} onClick={() => handleSelect(a.id)}
                className="p-4 cursor-pointer transition-all duration-200"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selected?.action.id === a.id ? 'rgba(212,164,78,0.08)' : 'transparent',
                  borderLeft: selected?.action.id === a.id ? '2px solid var(--accent-gold)' : '2px solid transparent',
                }}
                onMouseOver={e => { if (selected?.action.id !== a.id) e.currentTarget.style.background = 'rgba(212,164,78,0.04)'; }}
                onMouseOut={e => { if (selected?.action.id !== a.id) e.currentTarget.style.background = 'transparent'; }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-cream)' }}>{a.agent_name}</span>
                  <RiskBadge score={a.risk_score} decision={a.decision} />
                </div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--accent-caramel)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {a.action_type.toUpperCase()} {a.resource_type}
                </div>
                <div className="text-[10px] mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.description}</div>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="p-8 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-low)' }} />
                <div className="text-sm font-medium" style={{ color: 'var(--risk-low)' }}>All clear</div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>No pending reviews</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 glass-card rounded-2xl overflow-auto">
          {selected ? (
            <div className="p-6">
              {/* Action Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--risk-high)' }} />
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--risk-high)' }}>Requires Review</span>
                  </div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-cream)' }}>
                    {selected.action.action_type.toUpperCase()} {selected.action.resource_type}
                  </h2>
                </div>
                <RiskBadge score={selected.evaluation?.risk_score} decision={selected.evaluation?.decision} size="lg" />
              </div>

              <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.action.description}</p>

              {/* Risk Breakdown */}
              {selected.evaluation && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Risk Breakdown</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selected.evaluation.risk_breakdown)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'rgba(44,32,24,0.5)' }}>
                          <span className="text-[11px] capitalize" style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] font-bold" style={{
                            color: v > 10 ? 'var(--risk-high)' : v > 5 ? 'var(--risk-medium)' : 'var(--risk-low)',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>+{v.toFixed(1)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {selected.evaluation && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(44,32,24,0.5)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Why does this need review?</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selected.evaluation.explanation}</p>
                </div>
              )}

              {/* Behavioral Factors */}
              {selected.evaluation?.behavioral_factors && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Behavioral Factors</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selected.evaluation.behavioral_factors).map(([k, v]) => (
                      <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(44,32,24,0.5)' }}>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-bold mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-cream)' }}>
                          {typeof v === 'number' ? v.toFixed(1) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="mb-4 p-3 rounded-xl text-[12px] font-medium" style={{
                  background: feedback.type === 'success' ? 'var(--risk-low-bg)' : 'var(--risk-high-bg)',
                  color: feedback.type === 'success' ? 'var(--risk-low)' : 'var(--risk-high)',
                  border: `1px solid ${feedback.type === 'success' ? 'var(--risk-low)' : 'var(--risk-high)'}25`,
                }}>
                  {feedback.msg}
                </div>
              )}

              {/* Approve / Reject */}
              <div className="pt-5 mt-5" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex gap-3 mb-3">
                  <input
                    value={reviewer} onChange={e => setReviewer(e.target.value)}
                    placeholder="Reviewer name"
                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'rgba(44,32,24,0.5)', border: '1px solid var(--border)', color: 'var(--text-cream)' }}
                  />
                </div>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Reason for decision (optional)"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none mb-4 resize-none transition-colors"
                  style={{ background: 'rgba(44,32,24,0.5)', border: '1px solid var(--border)', color: 'var(--text-cream)' }}
                />
                <div className="flex gap-3">
                  <button onClick={() => handleAction('approve')} disabled={processing}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--risk-low) 0%, #3d9956 100%)',
                      color: '#fff',
                      opacity: processing ? 0.6 : 1,
                      boxShadow: '0 4px 16px rgba(91,185,116,0.2)',
                    }}>
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction('reject')} disabled={processing}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--risk-high) 0%, #c43d2e 100%)',
                      color: '#fff',
                      opacity: processing ? 0.6 : 1,
                      boxShadow: '0 4px 16px rgba(232,93,74,0.2)',
                    }}>
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <ClipboardCheck className="w-12 h-12 mb-3" style={{ color: 'var(--coffee-600)' }} />
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Select an action to review</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--coffee-600)' }}>Click a pending action from the queue</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

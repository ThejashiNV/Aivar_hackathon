import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Brain, Shield, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '../api';
import type { ActionDetail as ActionDetailType } from '../api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';

function factorColor(v: number) {
  if (v > 10) return 'var(--risk-high)';
  if (v > 5) return 'var(--risk-medium)';
  return 'var(--risk-low)';
}

export default function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ActionDetailType | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) api.action(id).then(setData).catch(e => setError(e.message));
  }, [id]);

  if (error) return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--risk-high)' }} />
      <div className="text-sm" style={{ color: 'var(--risk-high)' }}>Error: {error}</div>
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
    </div>
  );

  const breakdownData = data.evaluation
    ? Object.entries(data.evaluation.risk_breakdown)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }))
    : [];

  const explanationParts = data.evaluation?.explanation.split('\n\n') || [];
  const hasAiInsight = explanationParts.some(p => p.startsWith('AI Insight:'));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/actions" className="inline-flex items-center gap-1 text-[12px] mb-5 font-medium transition-colors" style={{ color: 'var(--accent-gold)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Action Feed
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{
                background: 'rgba(212,164,78,0.12)', color: 'var(--accent-caramel)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {data.action.action_type.toUpperCase()}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{data.action.resource_type}</span>
            </div>
            <h1 className="text-lg font-bold mt-2" style={{ color: 'var(--text-cream)' }}>{data.action.description}</h1>
            <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>{data.action.agent_name}</span>
              <span>&middot;</span>
              <span>{new Date(data.action.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge score={data.evaluation?.risk_score} decision={data.evaluation?.decision} size="lg" />
            <StatusBadge status={data.action.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Risk Breakdown Chart */}
        {breakdownData.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Risk Factor Breakdown</h3>
            </div>
            <ResponsiveContainer width="100%" height={breakdownData.length * 36 + 20}>
              <BarChart data={breakdownData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{
                  background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
                  borderRadius: 12, fontSize: 12, color: 'var(--text-primary)',
                }} formatter={(v) => [`+${Number(v).toFixed(1)}`, 'Risk']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {breakdownData.map((d, i) => <Cell key={i} fill={factorColor(d.value)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Context + Behavioral */}
        <div className="space-y-4">
          {data.evaluation?.context_factors && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Context Factors</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.evaluation.context_factors).map(([k, v]) => (
                  <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(44,32,24,0.5)' }}>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-cream)', fontFamily: "'JetBrains Mono', monospace" }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.evaluation?.behavioral_factors && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Behavioral Factors</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.evaluation.behavioral_factors).map(([k, v]) => {
                  const isNegative = String(k).includes('penalty') || String(k).includes('violation') || String(k).includes('rejection');
                  return (
                    <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(44,32,24,0.5)' }}>
                      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</div>
                      <div className="text-sm font-semibold" style={{
                        color: isNegative && Number(v) > 0 ? 'var(--risk-high)' : 'var(--text-cream)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>{typeof v === 'number' ? v.toFixed(1) : String(v)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parameters */}
      {Object.keys(data.parameters).length > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--text-muted)' }}>Action Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(data.parameters).map(([k, v]) => (
              <div key={k} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(44,32,24,0.5)' }}>
                <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-cream)', fontFamily: "'JetBrains Mono', monospace" }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {data.evaluation && (
        <div className="glass-card rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Guardian Explanation</h3>
            {hasAiInsight && (
              <span className="text-[9px] px-2 py-0.5 rounded-lg font-medium" style={{
                background: 'rgba(166,123,212,0.12)', color: 'var(--accent-purple)',
              }}>AI Enhanced</span>
            )}
          </div>
          {explanationParts.map((part, i) => {
            const isAi = part.startsWith('AI Insight:');
            return (
              <div key={i} className={`text-[12px] leading-relaxed ${i > 0 ? 'mt-3 pt-3' : ''}`}
                style={{
                  color: isAi ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  fontStyle: isAi ? 'italic' : 'normal',
                }}>
                {isAi && <span className="text-[9px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'var(--accent-purple)', fontStyle: 'normal' }}>Gemini AI Insight</span>}
                {isAi ? part.replace('AI Insight: ', '') : part}
              </div>
            );
          })}
          {hasAiInsight && (
            <div className="mt-3 text-[10px] rounded-lg px-3 py-2" style={{ background: 'rgba(44,32,24,0.5)', color: 'var(--text-muted)' }}>
              The risk decision is made by the deterministic risk engine. AI provides supplementary explanation only.
            </div>
          )}
        </div>
      )}

      {/* Audit Trail */}
      {data.audit_events.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--text-muted)' }}>Audit Trail</h3>
          <div className="space-y-0">
            {data.audit_events.map((e, i) => (
              <div key={e.id} className="flex items-start gap-3 relative py-3" style={{ borderBottom: i < data.audit_events.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                  background: e.event_type.includes('REJECT') || e.event_type.includes('VIOLATION') ? 'var(--risk-high)'
                    : e.event_type.includes('APPROV') || e.event_type.includes('EXECUT') ? 'var(--risk-low)'
                    : 'var(--accent-gold)',
                  boxShadow: `0 0 6px ${e.event_type.includes('REJECT') ? 'rgba(232,93,74,0.3)' : e.event_type.includes('APPROV') ? 'rgba(91,185,116,0.3)' : 'rgba(212,164,78,0.3)'}`,
                }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{
                      color: e.event_type.includes('REJECT') || e.event_type.includes('VIOLATION') ? 'var(--risk-high)'
                        : e.event_type.includes('APPROV') || e.event_type.includes('EXECUT') ? 'var(--risk-low)'
                        : 'var(--accent-gold)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{e.event_type}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{e.actor}</span>
                  </div>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(e.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

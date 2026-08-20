const statusStyles: Record<string, { color: string; bg: string; glow: string }> = {
  executed: { color: 'var(--risk-low)', bg: 'var(--risk-low-bg)', glow: 'rgba(91,185,116,0.3)' },
  approved: { color: 'var(--accent-blue)', bg: 'rgba(91,155,213,0.12)', glow: 'rgba(91,155,213,0.3)' },
  pending: { color: 'var(--risk-medium)', bg: 'var(--risk-medium-bg)', glow: 'rgba(232,168,56,0.3)' },
  rejected: { color: 'var(--risk-high)', bg: 'var(--risk-high-bg)', glow: 'rgba(232,93,74,0.3)' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || { color: 'var(--text-muted)', bg: 'rgba(139,107,78,0.1)', glow: 'transparent' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.glow}` }} />
      {status}
    </span>
  );
}

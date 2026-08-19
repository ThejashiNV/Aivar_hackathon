const statusStyles: Record<string, { bg: string; color: string }> = {
  executed: { bg: 'var(--accent-green)', color: 'var(--accent-green)' },
  approved: { bg: 'var(--accent-blue)', color: 'var(--accent-blue)' },
  pending: { bg: 'var(--accent-yellow)', color: 'var(--accent-yellow)' },
  rejected: { bg: 'var(--accent-red)', color: 'var(--accent-red)' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || { bg: 'var(--text-muted)', color: 'var(--text-muted)' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase"
      style={{ background: `${s.bg}18`, color: s.color, border: `1px solid ${s.color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {status}
    </span>
  );
}

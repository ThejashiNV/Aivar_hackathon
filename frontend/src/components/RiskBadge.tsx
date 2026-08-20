interface Props {
  score?: number | null;
  decision?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const decisionConfig: Record<string, { color: string; bg: string; label: string }> = {
  autonomous: { color: 'var(--risk-low)', bg: 'var(--risk-low-bg)', label: 'AUTONOMOUS' },
  confirm: { color: 'var(--risk-medium)', bg: 'var(--risk-medium-bg)', label: 'CONFIRM' },
  full_review: { color: 'var(--risk-high)', bg: 'var(--risk-high-bg)', label: 'FULL REVIEW' },
};

export default function RiskBadge({ score, decision, size = 'sm' }: Props) {
  const cfg = decision ? decisionConfig[decision] || { color: 'var(--text-muted)', bg: 'rgba(139,107,78,0.1)', label: decision.toUpperCase() } : { color: 'var(--text-muted)', bg: 'rgba(139,107,78,0.1)', label: '—' };
  const fontSize = size === 'lg' ? '13px' : size === 'md' ? '11px' : '10px';
  const padding = size === 'lg' ? '5px 12px' : size === 'md' ? '4px 10px' : '3px 8px';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg font-semibold whitespace-nowrap tracking-wide"
      style={{
        fontSize, padding,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}25`,
        letterSpacing: '0.03em',
      }}
    >
      {score != null && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{score.toFixed(1)}</span>}
      <span>{cfg.label}</span>
    </span>
  );
}

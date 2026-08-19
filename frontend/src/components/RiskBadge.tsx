interface Props {
  score?: number | null;
  decision?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const decisionColors: Record<string, string> = {
  autonomous: 'var(--accent-green)',
  confirm: 'var(--accent-yellow)',
  full_review: 'var(--accent-red)',
};

const decisionLabels: Record<string, string> = {
  autonomous: 'AUTONOMOUS',
  confirm: 'CONFIRM',
  full_review: 'FULL REVIEW',
};

export default function RiskBadge({ score, decision, size = 'sm' }: Props) {
  const color = decision ? decisionColors[decision] || 'var(--text-muted)' : 'var(--text-muted)';
  const label = decision ? decisionLabels[decision] || decision.toUpperCase() : '—';
  const fontSize = size === 'lg' ? '14px' : size === 'md' ? '12px' : '11px';
  const padding = size === 'lg' ? '4px 10px' : size === 'md' ? '3px 8px' : '2px 6px';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded font-semibold whitespace-nowrap"
      style={{ fontSize, padding, background: `${color}18`, color, border: `1px solid ${color}40` }}
    >
      {score != null && <span>{score.toFixed(1)}</span>}
      <span>{label}</span>
    </span>
  );
}

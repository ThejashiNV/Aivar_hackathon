import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <ShieldAlert className="w-16 h-16 mb-4" style={{ color: 'var(--accent-red)' }} />
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>404 — Page Not Found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>The page you're looking for doesn't exist in the Guardian AI control plane.</p>
      <Link to="/" className="px-6 py-2.5 rounded-lg text-sm font-medium no-underline" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
        Back to Dashboard
      </Link>
    </div>
  );
}

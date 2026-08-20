import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{
        background: 'var(--risk-high-bg)', border: '1px solid rgba(232,93,74,0.2)',
      }}>
        <ShieldAlert className="w-10 h-10" style={{ color: 'var(--risk-high)' }} />
      </div>
      <h1 className="text-3xl font-bold mb-2 text-gradient">404</h1>
      <p className="text-[14px] mb-1" style={{ color: 'var(--text-cream)' }}>Page Not Found</p>
      <p className="text-[12px] mb-8 max-w-sm" style={{ color: 'var(--text-muted)' }}>
        The page you're looking for doesn't exist in the Guardian AI control plane.
      </p>
      <Link to="/" className="px-8 py-3 rounded-xl text-[13px] font-semibold no-underline transition-all"
        style={{
          background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-500) 100%)',
          color: 'var(--bg-deep)',
          boxShadow: '0 4px 16px rgba(212,164,78,0.2)',
        }}>
        Back to Dashboard
      </Link>
    </motion.div>
  );
}

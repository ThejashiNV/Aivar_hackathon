import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, ClipboardCheck, Users, Play, Settings, Menu, X, Coffee } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/actions', icon: Activity, label: 'Action Feed' },
  { to: '/reviews', icon: ClipboardCheck, label: 'Review Queue' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/policy', icon: Settings, label: 'Policy' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--bg-deep)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(12, 10, 9, 0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
      )}

      <nav className={`
        fixed z-40 md:relative md:z-auto
        w-60 shrink-0 flex flex-col h-full
        transition-transform md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-deep) 100%)',
        borderRight: '1px solid var(--border)',
      }}>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
            boxShadow: '0 0 16px rgba(212, 164, 78, 0.3)',
          }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-cream)' }}>Guardian AI</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Control Plane</div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          <div className="text-[9px] uppercase tracking-[0.2em] px-3 mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Navigation</div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${isActive ? 'font-semibold' : ''}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(212, 164, 78, 0.12)' : 'transparent',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(212, 164, 78, 0.15)' : '1px solid transparent',
              })}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="px-3 pb-4">
          <div className="text-[9px] uppercase tracking-[0.2em] px-3 mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Quick Actions</div>
          <NavLink
            to="/demo"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-500) 100%)',
              color: 'var(--bg-deep)',
              boxShadow: '0 4px 16px rgba(212, 164, 78, 0.25)',
            }}
          >
            <Play className="w-4 h-4" />
            Run Live Demo
          </NavLink>
        </div>

        <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Coffee className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Adaptive Autonomy v1.0</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3" style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
        }}>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: 'var(--text-cream)' }} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--coffee-600) 100%)',
          }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--bg-deep)' }} />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-cream)' }}>Guardian AI</span>
        </div>

        <main className={`flex-1 overflow-auto ${isDashboard ? '' : 'p-4 md:p-6'}`} style={{ background: 'var(--bg-deep)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

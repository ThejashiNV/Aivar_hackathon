import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, ClipboardCheck, Users, Play } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/actions', icon: Activity, label: 'Action Feed' },
  { to: '/reviews', icon: ClipboardCheck, label: 'Review Queue' },
  { to: '/agents', icon: Users, label: 'Agents' },
];

export default function Layout() {
  return (
    <div className="flex h-screen w-full">
      <nav className="w-56 shrink-0 flex flex-col border-r"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Shield className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Guardian AI</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Autonomy Control Plane</div>
          </div>
        </div>

        <div className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'font-medium' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              })}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <NavLink
            to="/demo"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent-blue)',
              color: '#fff',
            }}
          >
            <Play className="w-4 h-4" />
            Run Live Demo
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  );
}

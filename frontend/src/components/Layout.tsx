import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, ClipboardCheck, Users, Play, Settings, Menu, X } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/actions', icon: Activity, label: 'Action Feed' },
  { to: '/reviews', icon: ClipboardCheck, label: 'Review Queue' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/policy', icon: Settings, label: 'Policy' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed z-40 md:relative md:z-auto
        w-56 shrink-0 flex flex-col border-r h-full
        transition-transform md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Shield className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Guardian AI</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Autonomy Control Plane</div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <Shield className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Guardian AI</span>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: 'var(--bg-primary)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

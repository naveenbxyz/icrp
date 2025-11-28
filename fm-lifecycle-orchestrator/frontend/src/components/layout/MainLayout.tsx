import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  Settings,
  Menu,
  X,
  Shield,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import AIChatBubble from '../AIChatBubble'

interface MainLayoutProps {
  children: ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Extract client ID from URL if on client detail page
  const getClientIdFromUrl = (): number | undefined => {
    const match = location.pathname.match(/^\/clients\/(\d+)/)
    return match ? parseInt(match[1], 10) : undefined
  }

  const clientId = getClientIdFromUrl()

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      path: '/clients',
      label: 'Clients',
      icon: <Users size={20} />
    },
    {
      path: '/ai-demo',
      label: 'AI Demo',
      icon: <Sparkles size={20} />
    },
    {
      path: '/ai-insights',
      label: 'AI Insights',
      icon: <TrendingUp size={20} />
    },
    {
      path: '/tasks',
      label: 'Tasks',
      icon: <ClipboardList size={20} />
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings size={20} />
    }
  ]

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1f2937',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 40,
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #374151'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#f9fafb'
          }}>
            Markets Client Portal
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '4px 0 0 0'
          }}>
            Readiness & Onboarding
          </p>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '16px 0',
          overflowY: 'auto'
        }}>
          {navItems.map((item) => {
            const isActive = isActivePath(item.path)
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setIsMobileMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: 'none',
                  backgroundColor: isActive ? '#374151' : 'transparent',
                  color: isActive ? '#60a5fa' : '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#374151'
                    e.currentTarget.style.color = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#d1d5db'
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #374151',
          fontSize: '11px',
          color: '#9ca3af'
        }}>
          <p style={{ margin: 0 }}>© 2025 Markets Client Portal</p>
          <p style={{ margin: '4px 0 0 0' }}>Version 1.0.0</p>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 50,
          display: 'none',
          padding: '8px',
          backgroundColor: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
        className="mobile-menu-toggle"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 30
          }}
          className="mobile-overlay"
        />
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '260px',
        width: 'calc(100% - 260px)'
      }}>
        {children}
      </main>

      {/* AI Chat Bubble - Global (context-aware on client pages) */}
      <AIChatBubble clientId={clientId} />

      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 768px) {
          aside {
            transform: translateX(${isMobileMenuOpen ? '0' : '-100%'});
            transition: transform 0.3s ease-in-out;
          }
          main {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}

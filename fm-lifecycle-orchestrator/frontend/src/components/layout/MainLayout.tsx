import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { ThemeToggle } from '../ui/theme-toggle'
import AIChatBubble from '../AIChatBubble'

interface MainLayoutProps {
  children: ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Task Inbox', icon: ClipboardList },
  { path: '/compliance', label: 'Compliance', icon: Shield },
  { path: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const clientIdMatch = location.pathname.match(/^\/client\/(\d+)/)
  const clientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : undefined

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const activeItem = NAV_ITEMS.find((item) => isActive(item.path))
  const currentLabel = activeItem?.label ?? 'Workspace'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              Markets Client Portal
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Readiness &amp; Onboarding
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
              NB
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">Naveen Batchala</div>
              <div className="truncate text-[10px] text-muted-foreground">
                Relationship Manager
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">Workspace</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium text-foreground">{currentLabel}</span>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </div>

      <AIChatBubble clientId={clientId} />
    </div>
  )
}

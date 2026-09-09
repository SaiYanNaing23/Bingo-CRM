import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  Building2,
  UsersRound,
  BriefcaseBusiness,
  CheckSquare2,
  CalendarDays,
  LogOut,
  ChevronRight,
  Settings2,
  ChevronsUpDown,
  Palette,
  FolderKanban,
  NotebookPen,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/auth-context'
import { BrandLogo } from '@/components/shared/brand-logo'

const groups = [
  {
    label: 'Career',
    links: [
      { label: 'Companies', to: '/companies', icon: Building2 },
      { label: 'Contacts', to: '/contacts', icon: UsersRound },
      { label: 'Applications', to: '/applications', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'Plan your day',
    links: [
      { label: 'All tasks', to: '/tasks', icon: CheckSquare2 },
      { label: 'Today', to: '/tasks/today', icon: CalendarDays },
    ],
  },
  {
    label: 'Workspace',
    links: [
      { label: 'Projects', to: '/projects', icon: FolderKanban },
      { label: 'Notes', to: '/notes', icon: NotebookPen },
      { label: 'Settings', to: '/settings', icon: Settings2 },
    ],
  },
]
function savedSidebarOpen() {
  try {
    return !document.cookie.split('; ').includes('sidebar_state=false')
  } catch {
    return true
  }
}

export function Workspace() {
  return (
    <SidebarProvider defaultOpen={savedSidebarOpen()}>
      <WorkspaceContent />
    </SidebarProvider>
  )
}

function WorkspaceContent() {
  const auth = useAuth()
  const location = useLocation()
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar()
  const links = groups.flatMap((group) => group.links)
  const section = location.pathname.startsWith('/tasks/today')
    ? 'Today'
    : links.find((link) => location.pathname.startsWith(link.to))?.label || 'Workspace'
  const name = auth.user?.fullName || 'Your workspace'
  const initials = (auth.user?.fullName || auth.user?.email || 'U').slice(0, 2).toUpperCase()
  const active = (to: string) =>
    location.pathname.startsWith(to) &&
    !(to === '/tasks' && location.pathname.startsWith('/tasks/today'))

  useEffect(() => {
    document.title = `${section} · BINGO CRM`
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location.pathname, section])

  return (
    <>
      <a
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed"
        href="#main-content"
      >
        Skip to content
      </a>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-sidebar-accent"
                tooltip="BINGO CRM workspace"
              >
                <Link
                  to="/companies"
                  onClick={() => setOpenMobile(false)}
                  aria-label="BINGO CRM workspace"
                >
                  <BrandLogo />
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">BINGO CRM</span>
                    <span className="truncate text-xs text-sidebar-foreground/65">
                      Career workspace
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <nav aria-label="Main navigation">
            {groups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.links.map((link) => (
                      <SidebarMenuItem key={link.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active(link.to)}
                          tooltip={link.label}
                          className="h-9 data-[active=true]:font-semibold data-[active=true]:[&>svg]:text-sidebar-primary"
                        >
                          <Link
                            to={link.to}
                            aria-label={link.label}
                            aria-current={active(link.to) ? 'page' : undefined}
                            onClick={() => setOpenMobile(false)}
                          >
                            <link.icon />
                            <span>{link.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    aria-label="Account menu"
                    tooltip="Account menu"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-xs font-semibold">
                      {initials}
                    </span>
                    <span className="grid min-w-0 flex-1 text-left leading-tight">
                      <span className="truncate font-semibold">{name}</span>
                      <span className="truncate text-xs text-sidebar-foreground/65">
                        {auth.user?.email}
                      </span>
                    </span>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-60 rounded-lg"
                  side={isMobile ? 'top' : 'right'}
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/appearance" onClick={() => setOpenMobile(false)}>
                      <Palette />
                      Appearance
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setOpenMobile(false)
                      auth.logout()
                    }}
                  >
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset id="main-content" tabIndex={-1} className="min-w-0 outline-none">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger
              aria-label={
                isMobile ? 'Open navigation' : open ? 'Collapse sidebar' : 'Expand sidebar'
              }
              aria-expanded={isMobile ? openMobile : open}
              title="Toggle sidebar (Ctrl/Cmd+B)"
            />
            <Separator
              orientation="vertical"
              className="mr-1 h-4 data-[orientation=vertical]:h-4"
            />
            <span className="hidden text-xs text-muted-foreground sm:inline">Workspace</span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="text-sm font-medium">{section}</span>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {new Intl.DateTimeFormat('en', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(new Date())}
          </span>
        </header>
        <div className="page-width min-w-0 p-5 sm:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  )
}

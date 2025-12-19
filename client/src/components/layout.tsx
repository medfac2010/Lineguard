import { useApp } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  LayoutDashboard,
  Phone,
  AlertTriangle,
  Users,
  LogOut,
  Menu,
  ClipboardList,
  FileText,
  MessageCircle,
  PlusCircle,
  BarChart,
  Settings,
  List,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building2,
  History,
  Activity,
  UserCog,
  Sun,
  Moon
} from "lucide-react";
import useTheme from "@/hooks/use-theme";
import { Toggle } from "./ui/toggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, conversations, messages } = useApp();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Theme
  const { theme, setTheme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user && location !== '/login') {
      setLocation('/login');
    }
  }, [user, location, setLocation]);

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">{children}</div>;
  }

  // Calculate unread count
  const unreadCount = user.role === 'admin'
    ? conversations.reduce((acc, c) => acc + c.unread, 0)
    : messages.filter(m => m.receiverId === user.id && !m.read).length;

  const NavItem = ({ href, icon: Icon, label, badge, indent }: { href: string, icon: any, label: string, badge?: number, indent?: boolean }) => (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer relative",
        indent && "ml-4",
        location === href
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {badge ? (
          <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full shrink-0">
            {badge}
          </Badge>
        ) : null}
      </div>
    </Link>
  );

  const NavGroup = ({ label, icon: Icon, children, active }: { label: string, icon: any, children: React.ReactNode, active?: boolean }) => {
    const [isOpen, setIsOpen] = useState(active);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground",
            isOpen && "text-foreground"
          )}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Phone className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">LineGuard</span>
        </div>
        <div className="mt-4 text-xs text-muted-foreground uppercase font-bold tracking-wider">
          Portail {user.role === 'admin' ? 'Admin' : user.role === 'subsidiary' ? 'Filiale' : 'Maintenance'}
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
        {user.role === 'subsidiary' && (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Général</p>
              <NavItem href="/" icon={LayoutDashboard} label="Tableau de bord" />
              <NavItem href="/chat" icon={MessageCircle} label="Messages" badge={unreadCount} />
            </div>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ressources</p>
              <NavItem href="/all-lines" icon={Phone} label="Toutes les lignes" />
            </div>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Système</p>
              <NavItem href="/settings" icon={Settings} label="Paramètres" />
            </div>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <NavGroup label="Tableau de bord" icon={LayoutDashboard} active={location === '/admin' || location === '/admin/reports'}>
              <NavItem href="/admin" icon={Activity} label="Aperçu" indent />
              <NavItem href="/admin/reports" icon={FileText} label="Statistiques" indent />
            </NavGroup>

            <NavGroup label="Communication" icon={MessageCircle} active={location === '/admin/messages'}>
              <NavItem href="/admin/messages" icon={MessageCircle} label="Messages" badge={unreadCount} indent />
            </NavGroup>

            <NavGroup label="Gestion des Lignes" icon={Phone} active={['/admin/lines', '/admin/line-types', '/admin/line-requests', '/admin/faults'].includes(location)}>
              <NavItem href="/admin/lines" icon={Phone} label="Toutes les lignes" indent />
              <NavItem href="/admin/line-types" icon={List} label="Types de lignes" indent />
              <NavItem href="/admin/line-requests" icon={PlusCircle} label="Demandes de lignes" indent />
              <NavItem href="/admin/faults" icon={AlertTriangle} label="Pannes" indent />
            </NavGroup>

            <NavGroup label="Infrastructure" icon={ShieldCheck} active={['/admin/users', '/admin/subsidiaries'].includes(location)}>
              <NavItem href="/admin/users" icon={UserCog} label="Utilisateurs" indent />
              <NavItem href="/admin/subsidiaries" icon={Building2} label="Filiales" indent />
            </NavGroup>

            <NavGroup label="Historique" icon={History} active={location === '/admin/history'}>
              <NavItem href="/admin/history" icon={ClipboardList} label="Interventions" indent />
            </NavGroup>

            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <NavItem href="/admin/settings" icon={Settings} label="Paramètres" />
            </div>
          </>
        )}

        {user.role === 'maintenance' && (
          <>
            <NavGroup label="Interventions" icon={ClipboardList} active={['/maintenance', '/maintenance/history'].includes(location)}>
              <NavItem href="/maintenance" icon={ClipboardList} label="Bons de travail" indent />
              <NavItem href="/maintenance/history" icon={FileText} label="Historique" indent />
            </NavGroup>

            <NavGroup label="Gestion des Lignes" icon={Phone} active={['/maintenance/requests', '/maintenance/lines'].includes(location)}>
              <NavItem href="/maintenance/requests" icon={List} label="Demandes" indent />
              <NavItem href="/maintenance/lines" icon={Phone} label="Toutes les lignes" indent />
            </NavGroup>

            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analyse & Comm</p>
              <NavItem href="/maintenance/statistics" icon={BarChart} label="Statistiques" />
              <NavItem href="/chat" icon={MessageCircle} label="Messages" badge={unreadCount} />
            </div>

            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <NavItem href="/maintenance/settings" icon={Settings} label="Paramètres" />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-8 w-8">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback className="text-xs font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground">Mode</div>
          <Toggle
            pressed={theme === 'dark'}
            size="sm"
            variant="outline"
            onPressedChange={(v: boolean) => setTheme(v ? 'dark' : 'light')}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Toggle>
        </div>

        <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); setLocation('/login'); }}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-card border-r border-border h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-lg">LineGuard</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Mobile theme toggle */}
          <Toggle
            pressed={theme === 'dark'}
            size="sm"
            variant="outline"
            onPressedChange={(v: boolean) => setTheme(v ? 'dark' : 'light')}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Toggle>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

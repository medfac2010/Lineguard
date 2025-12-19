import { useApp } from "@/lib/store";
import { Link, useLocation } from "wouter";
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
  List
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, conversations, messages } = useApp();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const NavItem = ({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) => (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer relative",
        location === href
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        {badge ? (
          <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full">
            {badge}
          </Badge>
        ) : null}
      </div>
    </Link>
  );

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

      <div className="flex-1 py-6 px-3 space-y-1">
        {user.role === 'subsidiary' && (
          <>
            <NavItem href="/" icon={LayoutDashboard} label="Tableau de bord" />
            <NavItem href="/chat" icon={MessageCircle} label="Messages" badge={unreadCount} />
            <NavItem href="/all-lines" icon={Phone} label="Toutes les lignes" />
            <NavItem href="/settings" icon={Users} label="Paramètres" />
          </>
        )}

        {user.role === 'admin' && (
          <>
            <NavItem href="/admin" icon={LayoutDashboard} label="Aperçu" />
            <NavItem href="/admin/messages" icon={MessageCircle} label="Messages" badge={unreadCount} />
            <NavItem href="/admin/faults" icon={AlertTriangle} label="Pannes" />
            <NavItem href="/admin/line-requests" icon={PlusCircle} label="Demandes de lignes" />
            <NavItem href="/admin/lines" icon={Phone} label="Toutes les lignes" />
            <NavItem href="/admin/line-types" icon={Phone} label="Types de lignes" />
            <NavItem href="/admin/users" icon={Users} label="Gestion des utilisateurs" />
            <NavItem href="/admin/subsidiaries" icon={Users} label="Filiales" />
            <NavItem href="/admin/history" icon={ClipboardList} label="Historique des interventions" />
            <NavItem href="/admin/reports" icon={FileText} label="Statistiques" />
            <NavItem href="/admin/settings" icon={Users} label="Paramètres" />
          </>
        )}

        {user.role === 'maintenance' && (
          <>
            <NavItem href="/maintenance" icon={ClipboardList} label="Bons de travail" />
            <NavItem href="/maintenance/requests" icon={List} label="Demandes de lignes" />
            <NavItem href="/maintenance/lines" icon={Phone} label="Gestion des lignes" />
            <NavItem href="/maintenance/statistics" icon={BarChart} label="Statistiques" />
            <NavItem href="/maintenance/history" icon={FileText} label="Historique des interventions" />
            <NavItem href="/chat" icon={MessageCircle} label="Messages" badge={unreadCount} />
            <NavItem href="/maintenance/settings" icon={Users} label="Paramètres" />
          </>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
          </div>
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

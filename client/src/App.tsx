import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import SubsidiaryDashboard from "@/pages/subsidiary/dashboard";
import SubsidiarySettings from "@/pages/subsidiary/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminFaults from "@/pages/admin/faults";
import AdminHistory from "@/pages/admin/history";
import AdminSettings from "@/pages/admin/settings";
import MaintenanceDashboard from "@/pages/maintenance/dashboard";
import AdminLines from "@/pages/admin/lines";
import AdminLineTypes from "@/pages/admin/line-types";
import AdminUsers from "@/pages/admin/users";
import AdminSubsidiaries from "@/pages/admin/subsidiaries";
import AdminStatistics from "@/pages/admin/statistics";
import MaintenanceSettings from "@/pages/maintenance/settings";
import MaintenanceHistory from "@/pages/maintenance/history";
import SubsidiaryAllLines from "@/pages/subsidiary/all-lines";
import AdminMessages from "@/pages/admin/messages";
import UserChat from "@/pages/chat";

function AppContent() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={LoginPage} />

        {/* Chat Routes */}
        <Route path="/chat" component={UserChat} />

        {/* Subsidiary Routes */}
        <Route path="/" component={SubsidiaryDashboard} />
        <Route path="/all-lines" component={SubsidiaryAllLines} />
        <Route path="/settings" component={SubsidiarySettings} />

        {/* Admin Routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/faults" component={AdminFaults} />
        <Route path="/admin/lines" component={AdminLines} />
        <Route path="/admin/line-types" component={AdminLineTypes} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/subsidiaries" component={AdminSubsidiaries} />
        <Route path="/admin/history" component={AdminHistory} />
        <Route path="/admin/reports" component={AdminStatistics} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/settings" component={AdminSettings} />

        {/* Maintenance Routes */}
        <Route path="/maintenance" component={MaintenanceDashboard} />
        <Route path="/maintenance/history" component={MaintenanceHistory} />
        <Route path="/maintenance/settings" component={MaintenanceSettings} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <AppContent />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

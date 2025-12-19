import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle2, ListTodo, Activity, Clock } from "lucide-react";

interface MaintenanceStats {
    total: number;
    resolved: number;
    open: number;
    assigned: number;
    avgResolutionTimeMs: number;
}

export default function MaintenanceStatistics() {
    const { data: stats, isLoading } = useQuery<MaintenanceStats>({
        queryKey: ['maintenance-stats'],
        queryFn: async () => {
            const res = await fetch('/api/maintenance/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const formatDuration = (ms: number) => {
        if (ms === 0) return 'N/A';
        const hours = Math.round(ms / (1000 * 60 * 60));
        const days = Math.round(hours / 24);
        if (days > 0) return `${days} days ${hours % 24} hours`;
        return `${hours} hours`;
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Maintenance Statistics</h1>
                <p className="text-muted-foreground">Overview of system health and performance.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Faults</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All time reported faults</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Faults</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.open || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently unassigned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <ListTodo className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.assigned || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently being worked on</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.resolved || 0}</div>
                        <p className="text-xs text-muted-foreground">Succesfully fixed</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-muted rounded-full">
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Average Resolution Time</p>
                            <h3 className="text-2xl font-bold">{formatDuration(stats?.avgResolutionTimeMs || 0)}</h3>
                            <p className="text-sm text-muted-foreground">From declaration to resolution</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

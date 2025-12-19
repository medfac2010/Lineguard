import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function MaintenanceLines() {
    const { lines, setLineStatus, subsidiaries } = useApp();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [confirmStatusId, setConfirmStatusId] = useState<string | null>(null);
    const [targetStatus, setTargetStatus] = useState<string>("");

    const filteredLines = lines.filter(l =>
        l.number.includes(searchTerm) ||
        subsidiaries.find(s => s.id === l.subsidiaryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStatusChange = async (id: string, status: string) => {
        setConfirmStatusId(id);
        setTargetStatus(status);
    };

    const confirmChange = async () => {
        if (confirmStatusId && targetStatus) {
            const success = await setLineStatus(confirmStatusId, targetStatus);
            if (success) {
                toast({ title: "Updated", description: `Line status updated to ${targetStatus}` });
                setConfirmStatusId(null);
            } else {
                toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
            }
        }
    };

    const getSubName = (id: string) => subsidiaries.find(s => s.id === id)?.name || "Unknown";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'working': return <Badge className="bg-green-500">Working</Badge>;
            case 'faulty': return <Badge variant="destructive">Faulty</Badge>;
            case 'maintenance': return <Badge className="bg-orange-500">Maintenance</Badge>;
            case 'out_of_service': return <Badge variant="secondary">Out of Service</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Lines</h1>
                <p className="text-muted-foreground">Search and update line statuses.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Lines</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search lines..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Subsidiary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Checked</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No lines found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLines.map((line) => (
                                    <TableRow key={line.id}>
                                        <TableCell className="font-mono">{line.number}</TableCell>
                                        <TableCell>{line.type}</TableCell>
                                        <TableCell>{getSubName(line.subsidiaryId)}</TableCell>
                                        <TableCell>{getStatusBadge(line.status)}</TableCell>
                                        <TableCell>{line.lastChecked ? format(new Date(line.lastChecked), 'PP') : '-'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {line.status === 'out_of_service' ? (
                                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(line.id, 'working')}>
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Set Working
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(line.id, 'out_of_service')}>
                                                    <Ban className="w-4 h-4 mr-1" /> Out of Service
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!confirmStatusId} onOpenChange={(open) => !open && setConfirmStatusId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change the line status to <strong>{targetStatus}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmStatusId(null)}>Cancel</Button>
                        <Button onClick={confirmChange}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

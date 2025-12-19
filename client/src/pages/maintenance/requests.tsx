import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function MaintenanceRequests() {
    const { lineRequests, subsidiaries, users, approveLineRequest, rejectLineRequest } = useApp();
    const { toast } = useToast();

    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const pendingRequests = lineRequests.filter(r => r.status === 'pending');
    const pastRequests = lineRequests.filter(r => r.status !== 'pending');

    const handleApprove = async (id: string) => {
        const success = await approveLineRequest(id);
        if (success) {
            toast({ title: "Approved", description: "Request approved and line created.", className: "bg-green-600 text-white border-none" });
        } else {
            toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
        }
    };

    const handleReject = async () => {
        if (!rejectingId || !rejectionReason) return;

        const success = await rejectLineRequest(rejectingId, rejectionReason);
        if (success) {
            toast({ title: "Rejected", description: "Request rejected." });
            setRejectingId(null);
            setRejectionReason("");
        } else {
            toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
        }
    };

    const getSubName = (id: string) => subsidiaries.find(s => s.id === id)?.name || "Unknown";
    const getAdminName = (id: string) => users.find(u => u.id === id)?.name || "Unknown";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Line Requests</h1>
                <p className="text-muted-foreground">Review and process requests for new lines.</p>
            </div>

            {/* Pending Requests */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Pending Requests ({pendingRequests.length})
                    </CardTitle>
                    <CardDescription>Requests awaiting your approval</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Requested Number</TableHead>
                                <TableHead>Subsidiary</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pending requests. Good job!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(new Date(req.createdAt), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-mono font-bold">{req.requestedNumber}</TableCell>
                                        <TableCell>{getSubName(req.subsidiaryId)}</TableCell>
                                        <TableCell>{getAdminName(req.adminId)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => setRejectingId(req.id)}>
                                                Reject
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Request History</CardTitle>
                    <CardDescription>Past approvals and rejections</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Processed</TableHead>
                                <TableHead>Number</TableHead>
                                <TableHead>Subsidiary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pastRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No history yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pastRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.respondedAt ? format(new Date(req.respondedAt), 'MMM d, yyyy') : '-'}</TableCell>
                                        <TableCell className="font-mono">{req.requestedNumber}</TableCell>
                                        <TableCell>{getSubName(req.subsidiaryId)}</TableCell>
                                        <TableCell>
                                            {req.status === 'approved'
                                                ? <Badge className="bg-green-500">Approved</Badge>
                                                : <Badge variant="destructive">Rejected</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {req.rejectionReason}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Rejection Dialog */}
            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g. Number unavailable, Invalid request..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirm Rejection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
